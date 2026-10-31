const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const port = 4173;
const base = `http://127.0.0.1:${port}`;
const preview = spawn(process.execPath, [path.resolve(__dirname, '../node_modules/vite/bin/vite.js'), 'preview',
  '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit' });

function probe() {
  return new Promise(resolve => {
    const req = http.get(`${base}/index.html`, res => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.setTimeout(1000, () => req.destroy());
    req.on('error', () => resolve(false));
  });
}

async function main() {
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (preview.exitCode !== null) throw new Error(`Preview exited: ${preview.exitCode}`);
      if (await probe()) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    if (!ready) throw new Error(`Preview did not respond at ${base}`);
    const result = await new Promise((resolve, reject) => {
      const run = spawn(process.execPath, [path.join(__dirname, 'run-suite.js'), 'smoke'], {
        stdio: 'inherit', env: { ...process.env, BASE_URL: base }
      });
      run.on('error', reject);
      run.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    });
    if (result !== 0) process.exitCode = result;
  } finally {
    preview.kill();
  }
}

main().catch(err => { console.error(err); preview.kill(); process.exitCode = 1; });
