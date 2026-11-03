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
    'lop1-bai01': {
      content: 'lop1/bai01',
      scripts: ['js/lop1-bai01/lesson.js', 'js/lop1-bai01/ramp-scene.js', 'js/lop1-bai01/ramp-engine.js'],
      optional: ['js/lop1-bai01/art.js'],
      order: order('js/lop1-bai01/lesson.js', 'js/lop1-bai01/ramp-scene.js', 'js/lop1-bai01/ramp-engine.js', 'js/lop1-bai01/art.js')
    },
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
      flow: true, // content/lop1/bai09/flow.json: thêm chặng Khám phá + Chia sẻ (js/lesson-flow.js)
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
    'lop3-bai01': {
      content: 'lop3/bai01',
      scripts: ['js/lop3-bai01/lesson.js', 'js/lop3-bai01/quake-scene.js', 'js/lop3-bai01/quake-engine.js'],
      optional: ['js/lop3-bai01/art.js'],
      order: order('js/lop3-bai01/lesson.js', 'js/lop3-bai01/quake-scene.js', 'js/lop3-bai01/quake-engine.js', 'js/lop3-bai01/art.js')
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
    },
    'lop3-bai12': {
      content: 'lop3/bai12',
      scripts: ['js/lop3-bai12/lesson.js', 'js/lop3-bai12/plant-scene.js', 'js/lop3-bai12/plant-engine.js'],
      optional: ['js/lop3-bai12/art.js'],
      order: order('js/lop3-bai12/lesson.js', 'js/lop3-bai12/plant-scene.js', 'js/lop3-bai12/plant-engine.js', 'js/lop3-bai12/art.js')
    },
    'lop3-bai13': {
      content: 'lop3/bai13',
      scripts: ['js/lop3-bai13/lesson.js', 'js/lop3-bai13/rocket-scene.js', 'js/lop3-bai13/rocket-engine.js'],
      optional: ['js/lop3-bai13/art.js'],
      order: order('js/lop3-bai13/lesson.js', 'js/lop3-bai13/rocket-scene.js', 'js/lop3-bai13/rocket-engine.js', 'js/lop3-bai13/art.js')
    },
    'lop3-bai16': {
      content: 'lop3/bai16',
      scripts: ['js/lop3-bai16/lesson.js', 'js/lop3-bai16/launch-transport-scene.js', 'js/lop3-bai16/launch-transport-engine.js'],
      optional: ['js/lop3-bai16/art.js'],
      order: order('js/lop3-bai16/lesson.js', 'js/lop3-bai16/launch-transport-scene.js', 'js/lop3-bai16/launch-transport-engine.js', 'js/lop3-bai16/art.js')
    },
    'lop3-bai15': {
      content: 'lop3/bai15',
      scripts: ['js/lop3-bai15/lesson.js', 'js/lop3-bai15/push-scene.js', 'js/lop3-bai15/push-engine.js'],
      optional: ['js/lop3-bai15/art.js'],
      order: order('js/lop3-bai15/lesson.js', 'js/lop3-bai15/push-scene.js', 'js/lop3-bai15/push-engine.js', 'js/lop3-bai15/art.js')
    },
    'lop1-bai19': {
      content: 'lop1/bai19',
      scripts: ['js/lop1-bai19/lesson.js', 'js/lop1-bai19/snail-scene.js', 'js/lop1-bai19/snail-engine.js'],
      optional: ['js/lop1-bai19/art.js'],
      order: order('js/lop1-bai19/lesson.js', 'js/lop1-bai19/snail-scene.js', 'js/lop1-bai19/snail-engine.js', 'js/lop1-bai19/art.js')
    },
    'lop3-bai14': {
      content: 'lop3/bai14',
      scripts: ['js/lop3-bai14/lesson.js', 'js/lop3-bai14/guitar-scene.js', 'js/lop3-bai14/guitar-engine.js'],
      optional: ['js/lop3-bai14/art.js'],
      order: order('js/lop3-bai14/lesson.js', 'js/lop3-bai14/guitar-scene.js', 'js/lop3-bai14/guitar-engine.js', 'js/lop3-bai14/art.js')
    },
    'lop1-bai04': {
      content: 'lop1/bai04',
      scripts: ['js/lop1-bai04/lesson.js', 'js/lop1-bai04/drill-scene.js', 'js/lop1-bai04/drill-engine.js'],
      optional: ['js/lop1-bai04/art.js'],
      order: order('js/lop1-bai04/lesson.js', 'js/lop1-bai04/drill-scene.js', 'js/lop1-bai04/drill-engine.js', 'js/lop1-bai04/art.js')
    },
    'lop1-bai05': {
      content: 'lop1/bai05',
      scripts: ['js/lop1-bai05/lesson.js', 'js/lop1-bai05/spy-scene.js', 'js/lop1-bai05/spy-engine.js'],
      optional: ['js/lop1-bai05/art.js'],
      order: order('js/lop1-bai05/lesson.js', 'js/lop1-bai05/spy-scene.js', 'js/lop1-bai05/spy-engine.js', 'js/lop1-bai05/art.js')
    },
    'lop1-bai06': {
      content: 'lop1/bai06',
      scripts: ['js/lop1-bai06/lesson.js', 'js/lop1-bai06/traffic-scene.js', 'js/lop1-bai06/traffic-engine.js'],
      optional: ['js/lop1-bai06/art.js'],
      order: order('js/lop1-bai06/lesson.js', 'js/lop1-bai06/traffic-scene.js', 'js/lop1-bai06/traffic-engine.js', 'js/lop1-bai06/art.js')
    },
    'lop1-bai08': {
      content: 'lop1/bai08',
      scripts: ['js/lop1-bai08/lesson.js', 'js/lop1-bai08/gate-scene.js', 'js/lop1-bai08/gate-engine.js'],
      optional: ['js/lop1-bai08/art.js'],
      order: order('js/lop1-bai08/lesson.js', 'js/lop1-bai08/gate-scene.js', 'js/lop1-bai08/gate-engine.js', 'js/lop1-bai08/art.js')
    },
    'lop3-bai02': {
      content: 'lop3/bai02',
      scripts: ['js/lop3-bai02/lesson.js', 'js/lop3-bai02/forklift-scene.js', 'js/lop3-bai02/forklift-engine.js'],
      optional: ['js/lop3-bai02/art.js'],
      order: order('js/lop3-bai02/lesson.js', 'js/lop3-bai02/forklift-scene.js', 'js/lop3-bai02/forklift-engine.js', 'js/lop3-bai02/art.js')
    },
    'lop3-bai03': {
      content: 'lop3/bai03',
      scripts: ['js/lop3-bai03/lesson.js', 'js/lop3-bai03/lever-scene.js', 'js/lop3-bai03/lever-engine.js'],
      optional: ['js/lop3-bai03/art.js'],
      order: order('js/lop3-bai03/lesson.js', 'js/lop3-bai03/lever-scene.js', 'js/lop3-bai03/lever-engine.js', 'js/lop3-bai03/art.js')
    },
    'lop3-bai04': {
      content: 'lop3/bai04',
      scripts: ['js/lop3-bai04/lesson.js', 'js/lop3-bai04/sorter-scene.js', 'js/lop3-bai04/sorter-engine.js'],
      optional: ['js/lop3-bai04/art.js'],
      order: order('js/lop3-bai04/lesson.js', 'js/lop3-bai04/sorter-scene.js', 'js/lop3-bai04/sorter-engine.js', 'js/lop3-bai04/art.js')
    },
    'lop3-bai05': {
      content: 'lop3/bai05',
      scripts: ['js/lop3-bai05/lesson.js', 'js/lop3-bai05/truck-scene.js', 'js/lop3-bai05/truck-engine.js'],
      optional: ['js/lop3-bai05/art.js'],
      order: order('js/lop3-bai05/lesson.js', 'js/lop3-bai05/truck-scene.js', 'js/lop3-bai05/truck-engine.js', 'js/lop3-bai05/art.js')
    }
  };
})();
