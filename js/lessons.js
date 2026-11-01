// Sổ đăng ký bài mô hình: thêm nội dung mới vào content/ và khai báo ở đây.
(function () {
  'use strict';
  const shared = {
    audio: 'js/audio-sfx.js',
    assembly: 'js/assembly-viewer.js',
    creative: 'js/creative-lab.js',
    sandbox: 'js/sandbox-3d.js',
    blocks: 'js/blocks-engine.js',
    engineBase: 'js/lesson-engine.js',
    sceneKit: 'js/scene-kit.js',
    missions: 'js/mission-tracker.js',
    app: 'js/app.js'
  };
  const order = (lesson, scene, engine, art) => [
    lesson, ...(art ? [art] : []), shared.audio, shared.assembly,
    shared.creative, shared.sandbox, shared.sceneKit, scene, shared.blocks, shared.engineBase,
    engine, shared.missions, shared.app
  ];

  window.ZM_LESSONS = {
    'lop1-bai02': {
      content: 'lop1/bai02',
      scripts: ['js/bai02/lesson.js', 'js/bai02/race-scene.js', 'js/bai02/race-engine.js'],
      optional: ['js/bai02/art.js'],
      order: order('js/bai02/lesson.js', 'js/bai02/race-scene.js', 'js/bai02/race-engine.js', 'js/bai02/art.js')
    },
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
    },
    'lop1-bai11': {
      content: 'lop1/bai11',
      scripts: ['js/bai11/lesson.js', 'js/bai11/water-scene.js', 'js/bai11/water-engine.js'],
      optional: ['js/bai11/art.js'],
      order: order('js/bai11/lesson.js', 'js/bai11/water-scene.js', 'js/bai11/water-engine.js', 'js/bai11/art.js')
    },
    'lop1-bai12': {
      content: 'lop1/bai12',
      scripts: ['js/bai12/lesson.js', 'js/bai12/flood-scene.js', 'js/bai12/dam-engine.js'],
      optional: ['js/bai12/art.js'],
      order: order('js/bai12/lesson.js', 'js/bai12/flood-scene.js', 'js/bai12/dam-engine.js', 'js/bai12/art.js')
    },
    'lop1-bai13': {
      content: 'lop1/bai13',
      scripts: ['js/bai13/lesson.js', 'js/bai13/snow-scene.js', 'js/bai13/plow-engine.js'],
      optional: ['js/bai13/art.js'],
      order: order('js/bai13/lesson.js', 'js/bai13/snow-scene.js', 'js/bai13/plow-engine.js', 'js/bai13/art.js')
    },
    'lop3-bai08': {
      content: 'lop3/bai08',
      scripts: ['js/lop3-bai08/lesson.js', 'js/lop3-bai08/rescue-scene.js', 'js/lop3-bai08/rescue-engine.js'],
      optional: ['js/lop3-bai08/art.js'],
      order: order('js/lop3-bai08/lesson.js', 'js/lop3-bai08/rescue-scene.js', 'js/lop3-bai08/rescue-engine.js', 'js/lop3-bai08/art.js')
    },
    'lop3-bai09': {
      content: 'lop3/bai09',
      scripts: ['js/lop3-bai09/lesson.js', 'js/lop3-bai09/storm-scene.js', 'js/lop3-bai09/storm-engine.js'],
      optional: ['js/lop3-bai09/art.js'],
      order: order('js/lop3-bai09/lesson.js', 'js/lop3-bai09/storm-scene.js', 'js/lop3-bai09/storm-engine.js', 'js/lop3-bai09/art.js')
    },
    'lop3-bai10': {
      content: 'lop3/bai10',
      scripts: ['js/lop3-bai10/lesson.js', 'js/lop3-bai10/rover-scene.js', 'js/lop3-bai10/rover-engine.js'],
      optional: ['js/lop3-bai10/art.js'],
      order: order('js/lop3-bai10/lesson.js', 'js/lop3-bai10/rover-scene.js', 'js/lop3-bai10/rover-engine.js', 'js/lop3-bai10/art.js')
    },
    'lop3-bai11': {
      content: 'lop3/bai11',
      scripts: ['js/lop3-bai11/lesson.js', 'js/lop3-bai11/water-scene.js', 'js/lop3-bai11/water-engine.js'],
      optional: ['js/lop3-bai11/art.js'],
      order: order('js/lop3-bai11/lesson.js', 'js/lop3-bai11/water-scene.js', 'js/lop3-bai11/water-engine.js', 'js/lop3-bai11/art.js')
    }
  };
})();
