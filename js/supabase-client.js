// js/supabase-client.js – client Supabase dùng chung cho trình duyệt (khoá anon, an toàn nhờ RLS).
// Giá trị lấy từ .env.local (xem .env.example). Không bao giờ đưa mật khẩu DB hay service_role vào đây.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && anonKey);

// Thiếu cấu hình thì trả null để trang vẫn chạy chế độ localStorage như cũ (GD-13).
export const supabase = supabaseReady ? createClient(url, anonKey) : null;
