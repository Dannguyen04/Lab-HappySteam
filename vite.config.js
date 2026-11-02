const path = require('node:path');

module.exports = async () => {
  const { viteStaticCopy } = await import('vite-plugin-static-copy');
  return {
    base: './',
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          ['index', 'bai', 'lop1-du-an', 'lop1-trung-bay', 'giao-vien', 'vao-hoc', 'code-lab']
            .map(name => [name, path.resolve(__dirname, `${name}.html`)])
        )
      }
    },
    // Classic <script src> files are not bundled by Vite. Copy their source trees intact.
    plugins: [viteStaticCopy({
      targets: [
        { src: 'js', dest: '.' },
        { src: 'content', dest: '.' },
        { src: 'css', dest: '.' },
        { src: 'mock', dest: '.' }, // màn hình mẫu (dữ liệu giả) – docs/giao-viec/73
        { src: 'assets', dest: '.' },
        { src: 'references/official', dest: 'references' },
        { src: '.nojekyll', dest: '.' }
      ]
    })]
  };
};
