function pageUrl(rel) {
  const base = process.env.BASE_URL;
  if (base) return `${base.replace(/\/+$/, '')}/${rel.replace(/^\/+/, '')}`;
  throw new Error('BASE_URL chưa được đặt: smoke cần HTTP server (npm run test:smoke hoặc test:dist), không dùng file://');
}

module.exports = { pageUrl };
