-- RLS-04 / RLS-07: keep identifying data behind consent-aware, role-checked RPCs.
-- RLS-08 (LOW) intentionally deferred: released_at currently represents insertion time;
-- the product needs an explicit publication contract before changing catalog visibility.
-- RLS-01/02/03/05/06 were already addressed by migration 0004.

-- Row policies cannot mask individual columns. Remove broad table SELECT privileges
-- (including PUBLIC's) before granting only non-sensitive columns to authenticated.
-- The guardian_links invite_code is also restricted to avoid a second path to codes.
revoke select on
  public.students, public.evaluations, public.consents,
  public.invite_codes, public.class_sessions, public.guardian_links
from public, anon, authenticated;

grant select (id, nickname, avatar, status, created_at)
  on public.students to authenticated;
grant select (id, attempt_id, level, suggested_level, graded_by, graded_at, source)
  on public.evaluations to authenticated;
grant select (id, student_id, guardian_id, terms_version, agreed_at, withdrawn_at)
  on public.consents to authenticated;
grant select (student_id, created_by, status, uses)
  on public.invite_codes to authenticated;
grant select (id, class_id, opened_by, opened_at, expires_at, closed_at)
  on public.class_sessions to authenticated;
grant select (guardian_id, student_id, linked_at)
  on public.guardian_links to authenticated;

-- The existing security-invoker view used SELECT * and exposed comment. Recreate
-- with a safe projection while preserving invoker RLS for the underlying rows.
drop view public.current_evaluations;
create view public.current_evaluations with (security_invoker = true) as
  select distinct on (attempt_id)
    id, attempt_id, level, suggested_level, graded_by, graded_at, source
  from public.evaluations
  order by attempt_id, graded_at desc;
revoke all on public.current_evaluations from public, anon, authenticated;
grant select on public.current_evaluations to authenticated;

-- RLS-04: explicit role check and a fresh consent check for every read.
-- Anonymous student devices cannot call these APIs for another student's data.
create function public.read_student_identity(p_student_id uuid)
returns table (id uuid, nickname text, avatar text, full_name text, birth_date date)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_uid();
  if not (public.is_guardian(p_student_id) or exists (
    select 1 from public.enrollments e
    where e.student_id = p_student_id and public.is_staff(e.class_id)
  )) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Not authorized to read student identity.';
  end if;

  return query
    select s.id, s.nickname, s.avatar,
      case when private.has_consent(s.id) then s.full_name else null::text end,
      case when private.has_consent(s.id) then s.birth_date else null::date end
    from public.students s where s.id = p_student_id;
end $$;

create function public.read_evaluation_comment(p_evaluation_id uuid)
returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_student uuid;
  v_class uuid;
  v_comment text;
begin
  perform private.require_uid();
  select en.student_id, en.class_id, ev.comment
    into v_student, v_class, v_comment
    from public.evaluations ev
    join public.attempts a on a.id = ev.attempt_id
    join public.enrollments en on en.id = a.enrollment_id
   where ev.id = p_evaluation_id;
  if not found or not (public.is_staff(v_class) or public.is_guardian(v_student)) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Not authorized to read evaluation comment.';
  end if;
  if not private.has_consent(v_student) then
    return null;
  end if;
  return v_comment;
end $$;

-- Consent text remains a legal snapshot available only to its linked guardian.
create function public.read_consent_terms(p_consent_id uuid)
returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_student uuid;
  v_guardian uuid;
  v_terms text;
  v_uid uuid := private.require_uid();
begin
  select c.student_id, c.guardian_id, c.terms_text
    into v_student, v_guardian, v_terms
    from public.consents c where c.id = p_consent_id;
  if not found or v_guardian <> v_uid or not public.is_guardian(v_student) then
    raise exception 'ZM_BLOCK_BR_PH_02' using detail = 'Not authorized to read consent terms.';
  end if;
  return v_terms;
end $$;

revoke all on function
  public.read_student_identity(uuid),
  public.read_evaluation_comment(uuid),
  public.read_consent_terms(uuid)
from public, anon;
grant execute on function
  public.read_student_identity(uuid),
  public.read_evaluation_comment(uuid),
  public.read_consent_terms(uuid)
to authenticated;
