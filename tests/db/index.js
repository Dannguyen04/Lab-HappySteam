// Node 24 treats "node --test tests/db/" as one explicit entrypoint.
// Run the isolated PGlite test files through the test runner.
const { spawnSync } = require('node:child_process');
const { readdirSync, existsSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const files = readdirSync(__dirname).filter(name => name.endsWith('.test.mjs')).sort()
  .map(name => path.join(__dirname, name));
const { NODE_TEST_CONTEXT, ...cleanEnv } = process.env;
// Phiếu 44 không sửa package manifest: chấp nhận PGlite cài tách biệt ở thư mục tạm.
const isolated = path.join(os.tmpdir(), 'happysteam-pglite');
if (!cleanEnv.PGLITE_DIR && existsSync(path.join(isolated, 'node_modules/@electric-sql/pglite/package.json'))) {
  cleanEnv.PGLITE_DIR = isolated;
}
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', env: cleanEnv });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
