// Sổ đăng ký bài mô hình: thêm nội dung mới vào content/ và khai báo ở đây.
(function () {
  'use strict';
  const shared = {
    audio: 'js/audio-sfx.js',
    assembly: 'js/assembly-viewer.js',
    creative: 'js/creative-lab.js',
    sandbox: 'js/sandbox-3d.js',
    blocks: 'js/blocks-engine.js',
    missions: 'js/mission-tracker.js',
    app: 'js/app.js'
  };
  const order = (lesson, scene, engine, art) => [
    lesson, ...(art ? [art] : []), shared.audio, shared.assembly,
    shared.creative, shared.sandbox, scene, shared.blocks,
    engine, shared.missions, shared.app
  ];

  window.ZM_LESSONS = {
    'lop1-bai03': {
      content: 'lop1/bai03',
      scripts: ['js/bai03/lesson.js', 'js/bai03/mars-scene.js', 'js/bai03/rover-engine.js'],
      optional: ['js/bai03/art.js'],
      order: order('js/bai03/lesson.js', 'js/bai03/mars-scene.js', 'js/bai03/rover-engine.js', 'js/bai03/art.js')
    },
    'lop1-bai09': {
      content: 'lop1/bai09',
      scripts: ['js/bai09/lesson.js', 'js/space-scene.js', 'js/simulation-engine.js'],
      optional: ['js/bai09/art.js'],
      order: order('js/bai09/lesson.js', 'js/space-scene.js', 'js/simulation-engine.js')
    },
    'lop1-bai10': {
      content: 'lop1/bai10',
      scripts: ['js/bai10/lesson.js', 'js/bai10/wind-scene.js', 'js/bai10/wind-engine.js'],
      optional: ['js/bai10/art.js'],
      order: order('js/bai10/lesson.js', 'js/bai10/wind-scene.js', 'js/bai10/wind-engine.js', 'js/bai10/art.js')
    }
  };
})();
