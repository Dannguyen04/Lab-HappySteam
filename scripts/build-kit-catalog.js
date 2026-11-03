// Gộp danh sách thô RoboBuilder + tên linh kiện thành danh mục từng bộ kit: content/kits/catalog/<bo>.json
// Chạy: node scripts/build-kit-catalog.js
const fs = require('fs');
const path = require('path');
const raw = (f) => require(path.join(__dirname, '../content/kits/raw', f));
const sets = raw('robobuilder-sets.json').sets;
const elec = raw('electronics-names.json');
const mech = raw('mechanical-names.json');
const map = raw('kit-map.json');

// Các bộ người dùng đang có (xác nhận 2026-11-03). Super AI: chờ xác định gói mở rộng.
const OWNED = { 'alpha-a': 'Alpha Set A', beta: 'Beta Set' };

const outDir = path.join(__dirname, '../content/kits/catalog');
fs.mkdirSync(outDir, { recursive: true });
for (const [id, name] of Object.entries(OWNED)) {
  const info = map[name];
  const set = sets[info.robobuilderSet];
  const parts = set.parts.map((p) => {
    const n = elec[p.code] || mech[p.code] || {};
    return {
      code: p.code,
      color: p.color,
      count: p.count,
      nameVi: n.nameVi || null,
      group: n.kind ? 'electronic' : n.group || null,
      kind: n.kind || undefined,
      lengthHoles: n.lengthHoles ?? undefined,
      sizeMm: n.sizeMm || null,
      confidence: n.confidence || null,
      snapPoints: [], // điền sau cho web lắp ráp
    };
  });
  const out = {
    id, name, model: info.model, robobuilderSet: info.robobuilderSet,
    pitchMm: 10, types: parts.length, pieces: set.pieces, sources: info.sources, parts,
  };
  fs.writeFileSync(path.join(outDir, id + '.json'), JSON.stringify(out, null, 1));
  const missing = parts.filter((p) => !p.nameVi).map((p) => p.code);
  console.log(id, parts.length, 'loại,', set.pieces, 'chi tiết; thiếu tên:', missing.join(' ') || 'không');
}

// Các gói Super AI (nguồn: content/kits/raw/super-ai-packs.json, đọc từ zmrobo.com). Mỗi gói một file super-ai-<model>.json.
const packs = raw('super-ai-packs.json');
for (const [model, pack] of Object.entries(packs)) {
  const id = 'super-ai-' + model.replace(/^JMC-/, '').toLowerCase();
  const parts = (pack.parts || []).map((p) => {
    const code = p.code ? p.code.replace(/^JMP-/, '') : null;
    const n = (code && (elec[code] || mech[code])) || {};
    return {
      code, count: p.count ?? null, nameVi: p.nameVi || n.nameVi || null,
      group: n.kind || /^BE-/.test(code || '') ? 'electronic' : n.group || null,
      sizeMm: n.sizeMm || null, hasMesh: !!p.hasMesh, snapPoints: [],
    };
  });
  const counted = parts.reduce((s, p) => s + (p.count || 0), 0);
  const out = {
    id, name: pack.name, model, controller: pack.controller, baseKitRequired: pack.baseKitRequired,
    pitchMm: 10, pieces: pack.pieces, countedPieces: counted,
    // "đủ" chỉ khi nguồn báo đủ VÀ tổng đếm khớp số chi tiết công bố
    complete: !!pack.partsListComplete && pack.pieces != null && counted >= pack.pieces,
    sources: pack.sources, evidence: pack.evidence, parts,
  };
  fs.writeFileSync(path.join(outDir, id + '.json'), JSON.stringify(out, null, 1));
  console.log(id, parts.length, 'loại, đếm', counted, '/ công bố', pack.pieces ?? '?', out.complete ? 'ĐỦ' : 'CHƯA ĐỦ');
}
