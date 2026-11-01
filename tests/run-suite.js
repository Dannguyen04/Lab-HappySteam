const { readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync, fork } = require('node:child_process');

const selectedKind = process.argv[2];
if (selectedKind && selectedKind !== 'logic' && selectedKind !== 'smoke') {
  console.error('Usage: node tests/run-suite.js [logic|smoke] [tên bài…]');
  process.exit(2);
}
const kinds = selectedKind ? [selectedKind] : ['logic', 'smoke'];
const only = process.argv.slice(selectedKind ? 3 : 2);

function startServer() {
  const server = fork(path.join(__dirname, 'helpers/static-server.js'), [], {
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  return new Promise((resolve, reject) => {
    server.once('message', ({ port }) => resolve({ server, base: `http://127.0.0.1:${port}` }));
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Static server exited: ${code}`)));
  });
}

async function main() {
  let failures = 0;
  for (const kind of kinds) {
    // test:dist đã cung cấp BASE_URL của Vite preview.
    const hosted = kind === 'smoke' && !process.env.BASE_URL ? await startServer() : null;
    try {
      const suffix = kind === 'logic' ? '.test.js' : '.smoke.js';
      // Lọc theo tên: node tests/run-suite.js smoke lop1-bai11 bai10
      const cases = readdirSync(__dirname).filter(name => name.endsWith(suffix) && (!only.length || only.some(o => name.includes(o)))).sort();
      let passed = 0;
      for (const name of cases) {
        console.log(`\n[${kind}] ${name}`);
        const result = spawnSync(process.execPath, [path.join(__dirname, name)], {
          stdio: 'inherit',
          env: { ...process.env, ...(hosted ? { BASE_URL: hosted.base } : {}) }
        });
        if (result.error) throw result.error;
        if (result.status !== 0) {
          failures++;
          console.error(`FAIL: ${kind} ${name} (exit ${result.status ?? 'unknown'})`);
        } else passed++;
      }
      console.log(`\n${failures ? 'RESULT' : 'PASS'}: ${passed}/${cases.length} ${kind} tests`);
    } finally {
      if (hosted) hosted.server.kill();
    }
  }
  if (failures) {
    console.error(`\nFAIL: ${failures} test files`);
    process.exitCode = 1;
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
