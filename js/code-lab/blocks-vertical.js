// Phòng lập trình (Code Lab) – Khối lệnh dọc chuẩn Scratch / RoboSim bằng Blockly (renderer Zelos).
// Cung cấp các khối tiếng Việt dịch sát RoboSim, bảng loại khối có màu, chuyển đổi 2 chiều với chuỗi khối phẳng.

import * as Blockly from 'blockly';

(function () {
  'use strict';

  // 1. Định nghĩa các khối RoboSim
  Blockly.defineBlocksWithJsonArray([
    // --- 1. Bộ điều khiển ---
    {
      type: 'block_start',
      message0: 'Bộ điều khiển – Nhiệm vụ 1',
      nextStatement: null,
      colour: '#08979c',
      tooltip: 'Khối bắt đầu chương trình của robot',
      helpUrl: ''
    },

    // --- 2. Động cơ ---
    {
      type: 'block_motors',
      message0: 'Động cơ M1 quay tốc độ %1 M2 quay tốc độ %2',
      args0: [
        { type: 'input_value', name: 'M1' },
        { type: 'input_value', name: 'M2' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#ecaa04',
      tooltip: 'Đặt tốc độ hai động cơ bánh xe độc lập (-100 đến 100)'
    },
    {
      type: 'block_motor_single',
      message0: 'Động cơ %1 quay tốc độ %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'MOTOR',
          options: [
            ['M1 (trái)', '1'],
            ['M2 (phải)', '2']
          ]
        },
        { type: 'input_value', name: 'SPEED' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#ecaa04',
      tooltip: 'Đặt tốc độ một động cơ M1 hoặc M2'
    },

    // --- 3. Di chuyển ---
    {
      type: 'block_move',
      message0: '%1 tốc độ %2 trong %3 giây',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DIR',
          options: [
            ['Tiến ↑', 'fwd'],
            ['Lùi ↓', 'back'],
            ['Rẽ trái ↶', 'left'],
            ['Rẽ phải ↷', 'right']
          ]
        },
        { type: 'input_value', name: 'SPEED' },
        { type: 'input_value', name: 'SEC' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#d22d8d',
      tooltip: 'Di chuyển theo hướng với tốc độ (-100 đến 100) trong số giây (0 = chạy mãi)'
    },
    {
      type: 'block_stop',
      message0: 'Dừng di chuyển ■',
      previousStatement: null,
      nextStatement: null,
      colour: '#d22d8d',
      tooltip: 'Dừng ngay cả hai động cơ'
    },

    // --- 4. Cảm biến (Điều kiện ra Boolean) ---
    {
      type: 'block_cond_dist',
      message0: 'Sóng âm (P1) %1 %2 cm',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['< gần hơn', '<'],
            ['> xa hơn', '>']
          ]
        },
        { type: 'field_number', name: 'VAL', value: 20, min: 0, max: 180 }
      ],
      output: 'Boolean',
      colour: '#2f8ef4',
      tooltip: 'Khoảng cách đo bằng cảm biến sóng âm P1'
    },
    {
      type: 'block_cond_touch',
      message0: 'Cảm biến chạm (P2) %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['được nhấn', 'is'],
            ['chưa nhấn', 'not']
          ]
        }
      ],
      output: 'Boolean',
      colour: '#2f8ef4',
      tooltip: 'Trạng thái cảm biến chạm ở mũi xe'
    },
    {
      type: 'block_cond_line',
      message0: 'Dò vạch %1 %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'SIDE',
          options: [
            ['mắt trái (P3)', 'lineL'],
            ['mắt phải (P3)', 'lineR']
          ]
        },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['thấy vạch đen', 'is'],
            ['không thấy vạch', 'not']
          ]
        }
      ],
      output: 'Boolean',
      colour: '#2f8ef4',
      tooltip: 'Mắt dò vạch quang học dưới đầu xe'
    },
    {
      type: 'block_cond_color',
      message0: 'Màu dưới xe (P4) %1 %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['là =', 'is'],
            ['khác ≠', 'not']
          ]
        },
        {
          type: 'field_dropdown',
          name: 'COLOR',
          options: [
            ['xanh lá', 'green'],
            ['đỏ', 'red'],
            ['xanh dương', 'blue'],
            ['vàng', 'yellow'],
            ['trắng', 'white']
          ]
        }
      ],
      output: 'Boolean',
      colour: '#2f8ef4',
      tooltip: 'Màu sắc nền mặt sân dưới xe'
    },

    // --- 5. Điều khiển ---
    {
      type: 'block_wait',
      message0: 'Chờ %1 giây',
      args0: [
        { type: 'input_value', name: 'SEC' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#fa8c16',
      tooltip: 'Tạm dừng chương trình trong số giây'
    },
    {
      type: 'block_wait_until',
      message0: 'Chờ đến khi %1',
      args0: [
        { type: 'input_value', name: 'COND', check: 'Boolean' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#fa8c16',
      tooltip: 'Chờ đến khi điều kiện cảm biến thỏa mãn'
    },
    {
      type: 'block_repeat',
      message0: 'Lặp lại %1 lần \n %2',
      args0: [
        { type: 'input_value', name: 'N' },
        { type: 'input_statement', name: 'DO' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#fa8c16',
      tooltip: 'Lặp lại các khối bên trong n lần'
    },
    {
      type: 'block_forever',
      message0: 'Lặp lại mãi mãi \n %1',
      args0: [
        { type: 'input_statement', name: 'DO' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#fa8c16',
      tooltip: 'Lặp lại liên tục không dừng'
    },
    {
      type: 'block_if',
      message0: 'Nếu %1 thì \n %2',
      args0: [
        { type: 'input_value', name: 'COND', check: 'Boolean' },
        { type: 'input_statement', name: 'DO' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#fa8c16',
      tooltip: 'Nếu điều kiện đúng thì thực hiện lệnh bên trong'
    },
    {
      type: 'block_if_else',
      message0: 'Nếu %1 thì \n %2 \n không thì \n %3',
      args0: [
        { type: 'input_value', name: 'COND', check: 'Boolean' },
        { type: 'input_statement', name: 'DO' },
        { type: 'input_statement', name: 'ELSE' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#fa8c16',
      tooltip: 'Nếu điều kiện đúng thì thực hiện nhánh 1, ngược lại thực hiện nhánh 2'
    },

    // --- 6. Âm thanh ---
    {
      type: 'block_sound',
      message0: 'Phát âm thanh %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TUNE',
          options: [
            ['Âm thanh A', 'A'],
            ['Âm thanh B', 'B']
          ]
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#2f4bda',
      tooltip: 'Phát giai điệu qua còi chip'
    },

    // --- 7. Hiển thị ---
    {
      type: 'block_led',
      message0: 'Đèn màu đổi sang %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'COLOR',
          options: [
            ['đỏ', 'red'],
            ['xanh lá', 'green'],
            ['xanh dương', 'blue'],
            ['vàng', 'yellow'],
            ['tắt đèn', 'off']
          ]
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#74b602',
      tooltip: 'Bật đèn LED màu trên xe Alpha 330'
    }
  ]);

  // RoboSim mở rộng: các ô số dùng khối biểu thức, không mất giá trị 0.
  const statement = (type, message0, args0, colour) => ({
    type, message0, args0, previousStatement: null, nextStatement: null, colour
  });
  const value = name => ({ type: 'input_value', name });
  const menu = (name, options) => ({ type: 'field_dropdown', name, options });
  const nameField = { type: 'field_input', name: 'NAME', text: 'so_vach' };
  const COLOR = { controller: '#08979c', motor: '#ecaa04', move: '#d22d8d',
    sensor: '#2f8ef4', line: '#339a78', display: '#74b602', control: '#fa8c16',
    math: '#8959a8', vars: '#c76b23' };
  Blockly.defineBlocksWithJsonArray([
    { type: 'block_num', message0: '%1', args0: [{ type: 'field_number', name: 'NUM', value: 0 }], output: null, colour: COLOR.math },
    { type: 'block_var_get', message0: 'biến %1', args0: [nameField], output: null, colour: COLOR.vars },
    { type: 'block_color_value', message0: 'màu %1', args0: [menu('COLOR', [['đỏ', 'red'], ['xanh lá', 'green'], ['xanh dương', 'blue'], ['vàng', 'yellow'], ['trắng', 'white']])], output: null, colour: COLOR.sensor },
    ...['dist', 'touch', 'lineL', 'lineR', 'light', 'color', 'timer', 'enc1', 'enc2'].map(s => ({
      type: 'block_sensor_' + s,
      message0: ({ dist: 'Sóng âm (cm)', touch: 'Chạm (0/1)', lineL: 'Dò vạch trái', lineR: 'Dò vạch phải', light: 'Quang (0–4095)', color: 'Màu (P4)', timer: 'Đồng hồ (ms)', enc1: 'Bộ đếm M1 (độ)', enc2: 'Bộ đếm M2 (độ)' })[s],
      output: null, colour: s.startsWith('line') ? COLOR.line : COLOR.sensor
    })),
    { type: 'block_math', message0: '%1 %2 %3', args0: [value('A'), menu('OP', [['+', '+'], ['−', '-'], ['×', '*'], ['÷', '/']]), value('B')], output: null, colour: COLOR.math },
    { type: 'block_compare', message0: '%1 %2 %3', args0: [value('A'), menu('OP', [['<', '<'], ['>', '>'], ['=', '='], ['≠', '!=']]), value('B')], output: 'Boolean', colour: COLOR.math },
    { type: 'block_logic', message0: '%1 %2 %3', args0: [value('A'), menu('OP', [['và', 'and'], ['hoặc', 'or']]), value('B')], output: 'Boolean', colour: COLOR.math },
    { type: 'block_not', message0: 'không %1', args0: [value('A')], output: 'Boolean', colour: COLOR.math },
    statement('block_move_deg', '%1 tốc độ %2 quay %3 độ', [menu('DIR', [['Tiến', 'fwd'], ['Lùi', 'back'], ['Rẽ trái', 'left'], ['Rẽ phải', 'right']]), value('SPEED'), value('DEG')], COLOR.move),
    statement('block_line_follow', 'Dò vạch tốc độ %1 trong %2 giây', [value('SPEED'), value('SEC')], COLOR.line),
    statement('block_turn_line', 'Rẽ động cơ trái %1 phải %2 đến khi %3 gặp vạch', [value('L'), value('R'), menu('EYE', [['mắt trái', 'L'], ['mắt phải', 'R']])], COLOR.line),
    statement('block_set_var', 'Đặt biến %1 bằng %2', [nameField, value('VALUE')], COLOR.vars),
    statement('block_change_var', 'Thay đổi biến %1 một lượng %2', [nameField, value('BY')], COLOR.vars),
    statement('block_show_var', 'Hiển thị biến %1', [nameField], COLOR.display),
    statement('block_timer_reset', 'Đặt lại đồng hồ', [], COLOR.controller),
    statement('block_buzzer', 'Bật còi %1', [menu('ON', [['bật', '1'], ['tắt', '0']])], COLOR.controller),
    statement('block_halt', 'Kết thúc chương trình', [], COLOR.controller)
  ]);

  // Cột danh mục khối (7 loại chuẩn RoboSim)
  const TOOLBOX_CONFIG = {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: 'Bộ điều khiển',
        colour: '#08979c',
        contents: [
          { kind: 'block', type: 'block_start' }
        ]
      },
      {
        kind: 'category',
        name: 'Động cơ',
        colour: '#ecaa04',
        contents: [
          { kind: 'block', type: 'block_motors' },
          { kind: 'block', type: 'block_motor_single' }
        ]
      },
      {
        kind: 'category',
        name: 'Di chuyển',
        colour: '#d22d8d',
        contents: [
          { kind: 'block', type: 'block_move' },
          { kind: 'block', type: 'block_stop' }
        ]
      },
      {
        kind: 'category',
        name: 'Cảm biến',
        colour: '#2f8ef4',
        contents: [
          { kind: 'block', type: 'block_cond_dist' },
          { kind: 'block', type: 'block_cond_touch' },
          { kind: 'block', type: 'block_cond_line' },
          { kind: 'block', type: 'block_cond_color' }
        ]
      },
      {
        kind: 'category',
        name: 'Điều khiển',
        colour: '#fa8c16',
        contents: [
          { kind: 'block', type: 'block_wait' },
          { kind: 'block', type: 'block_wait_until' },
          { kind: 'block', type: 'block_repeat' },
          { kind: 'block', type: 'block_forever' },
          { kind: 'block', type: 'block_if' },
          { kind: 'block', type: 'block_if_else' }
        ]
      },
      {
        kind: 'category',
        name: 'Âm thanh',
        colour: '#2f4bda',
        contents: [
          { kind: 'block', type: 'block_sound' }
        ]
      },
      {
        kind: 'category',
        name: 'Hiển thị',
        colour: '#74b602',
        contents: [
          { kind: 'block', type: 'block_led' }
        ]
      }
    ]
  };

  const categories = Object.fromEntries(TOOLBOX_CONFIG.contents.map(c => [c.name, c]));
  const add = (category, ...types) => categories[category].contents.push(...types.map(type => ({ kind: 'block', type })));
  add('Bộ điều khiển', 'block_timer_reset', 'block_buzzer', 'block_halt');
  add('Di chuyển', 'block_move_deg');
  add('Cảm biến', 'block_sensor_dist', 'block_sensor_touch', 'block_sensor_color',
    'block_sensor_light', 'block_sensor_timer', 'block_sensor_enc1', 'block_sensor_enc2', 'block_color_value');
  add('Hiển thị', 'block_show_var');
  categories['Dò vạch'] = { kind: 'category', name: 'Dò vạch', colour: COLOR.line, contents: [
    { kind: 'block', type: 'block_line_follow' }, { kind: 'block', type: 'block_turn_line' },
    { kind: 'block', type: 'block_sensor_lineL' }, { kind: 'block', type: 'block_sensor_lineR' }
  ] };
  categories['Toán tử'] = { kind: 'category', name: 'Toán tử', colour: COLOR.math, contents: [
    ...['block_num', 'block_math', 'block_compare', 'block_logic', 'block_not'].map(type => ({ kind: 'block', type }))
  ] };
  categories['Biến'] = { kind: 'category', name: 'Biến', colour: COLOR.vars, contents: [
    ...['block_var_get', 'block_set_var', 'block_change_var'].map(type => ({ kind: 'block', type }))
  ] };
  TOOLBOX_CONFIG.contents.splice(4, 0, categories['Dò vạch']);
  TOOLBOX_CONFIG.contents.push(categories['Toán tử'], categories['Biến']);
  const inputDefaults = {
    block_motors: { M1: 50, M2: 50 }, block_motor_single: { SPEED: 50 },
    block_move: { SPEED: 50, SEC: 1 }, block_move_deg: { SPEED: 50, DEG: 360 },
    block_wait: { SEC: 1 }, block_repeat: { N: 10 }, block_line_follow: { SPEED: 50, SEC: 2 },
    block_turn_line: { L: -40, R: 40 }, block_set_var: { VALUE: 0 },
    block_change_var: { BY: 1 }, block_math: { A: 0, B: 0 },
    block_compare: { A: 0, B: 0 }, block_logic: { A: 1, B: 1 }, block_not: { A: 1 }
  };
  for (const category of TOOLBOX_CONFIG.contents) {
    for (const item of category.contents) {
      if (!inputDefaults[item.type]) continue;
      item.inputs = Object.fromEntries(Object.entries(inputDefaults[item.type]).map(([name, n]) =>
        [name, { shadow: { type: 'block_num', fields: { NUM: n } } }]));
    }
  }

  // Định nghĩa theme robosim dựa trên Zelos
  const RoboSimTheme = Blockly.Theme.defineTheme('robosim_theme', {
    base: Blockly.Themes.Zelos,
    categoryStyles: {
      controller_category: { colour: '#08979c' },
      motor_category: { colour: '#ecaa04' },
      move_category: { colour: '#d22d8d' },
      sensor_category: { colour: '#2f8ef4' },
      control_category: { colour: '#fa8c16' },
      sound_category: { colour: '#2f4bda' },
      display_category: { colour: '#74b602' }
    },
    componentStyles: {
      workspaceBackgroundColour: '#f6f9fc',
      toolboxBackgroundColour: '#ffffff',
      toolboxForegroundColour: '#1c2833',
      flyoutBackgroundColour: '#ffffff',
      flyoutForegroundColour: '#1c2833',
      flyoutOpacity: 0.95,
      scrollbarColour: '#cbd5e1',
      scrollbarOpacity: 0.6
    }
  });

  let workspace = null;
  let isSyncing = false;
  let mountedSensors = { dist: 'P1', touch: 'P2', line: 'P3', color: 'P4', led: 'LED' };

  // Khởi tạo workspace
  function initWorkspace(container, onChange) {
    if (workspace) {
      workspace.dispose();
      workspace = null;
    }

    workspace = Blockly.inject(container, {
      renderer: 'zelos',
      theme: RoboSimTheme,
      toolbox: TOOLBOX_CONFIG,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.85,
        maxScale: 1.8,
        minScale: 0.45,
        scaleSpeed: 1.1
      },
      trashcan: true,
      sounds: false,
      grid: {
        spacing: 24,
        length: 2,
        colour: '#e2e8f0',
        snap: false
      }
    });

    workspace.addChangeListener(function (e) {
      if (e.isUiEvent) return;
      if (isSyncing) return;
      if (onChange) {
        const flat = toFlatBlocks();
        onChange(flat);
      }
    });

    applySensorAvailability();
    return workspace;
  }

  // Cập nhật cảm biến đang gắn
  function setMountedSensors(sensors) {
    mountedSensors = Object.assign({}, sensors);
    applySensorAvailability();
  }

  // Khay được dựng lại mỗi lần mở nhóm, nên đánh dấu disabled ngay trong cấu hình khay rồi updateToolbox
  function applySensorAvailability() {
    if (!workspace) return;
    const sensorMap = {
      block_cond_dist: 'dist',
      block_cond_touch: 'touch',
      block_cond_line: 'line',
      block_cond_color: 'color',
      block_led: 'led',
      block_sensor_dist: 'dist', block_sensor_touch: 'touch',
      block_sensor_lineL: 'line', block_sensor_lineR: 'line',
      block_sensor_color: 'color', block_sensor_light: 'line',
      block_line_follow: 'line', block_turn_line: 'line'
    };

    const toolbox = {
      ...TOOLBOX_CONFIG,
      contents: TOOLBOX_CONFIG.contents.map(category => ({
        ...category,
        contents: category.contents.map(item => {
          const key = sensorMap[item.type];
          return key && !mountedSensors[key] ? { ...item, disabled: true } : item;
        })
      }))
    };
    workspace.updateToolbox(toolbox);
  }

  function readExpr(b) {
    if (!b) return 0;
    if (b.type === 'block_num') return Number(b.getFieldValue('NUM'));
    if (b.type === 'block_var_get') return { v: b.getFieldValue('NAME') || 'so_vach' };
    if (b.type === 'block_color_value') return { c: b.getFieldValue('COLOR') || 'red' };
    if (b.type.startsWith('block_sensor_')) return { s: b.type.substring('block_sensor_'.length) };
    if (['block_math', 'block_compare', 'block_logic'].includes(b.type)) {
      return { op: b.getFieldValue('OP'), a: readExpr(b.getInputTargetBlock('A')),
        b: readExpr(b.getInputTargetBlock('B')) };
    }
    if (b.type === 'block_not') return { op: 'not', a: readExpr(b.getInputTargetBlock('A')) };
    // Điều kiện đời cũ vẫn được chuyển trực tiếp ra biểu thức lồng nhau.
    if (b.type === 'block_cond_dist') return { op: b.getFieldValue('OP'),
      a: { s: 'dist' }, b: Number(b.getFieldValue('VAL')) };
    if (b.type === 'block_cond_touch') return b.getFieldValue('OP') === 'not' ?
      { op: 'not', a: { s: 'touch' } } : { s: 'touch' };
    if (b.type === 'block_cond_line') {
      const sensor = { s: b.getFieldValue('SIDE') || 'lineL' };
      return b.getFieldValue('OP') === 'not' ? { op: 'not', a: sensor } : sensor;
    }
    if (b.type === 'block_cond_color') return { op: b.getFieldValue('OP') === 'not' ? '!=' : '=',
      a: { s: 'color' }, b: { c: b.getFieldValue('COLOR') || 'green' } };
    return 0;
  }

  function readInput(b, name, fallback) {
    const child = b.getInputTargetBlock(name);
    return child ? readExpr(child) : fallback;
  }

  // Trích xuất điều kiện
  function extractCond(cb) {
    if (!cb) return { s: 'dist', op: '<', v: 20 };
    if (!cb.type.startsWith('block_cond_')) return readExpr(cb);
    switch (cb.type) {
      case 'block_cond_dist':
        return {
          s: 'dist',
          op: cb.getFieldValue('OP') || '<',
          v: Number(cb.getFieldValue('VAL'))
        };
      case 'block_cond_touch':
        return {
          s: 'touch',
          op: cb.getFieldValue('OP') || 'is'
        };
      case 'block_cond_line':
        return {
          s: cb.getFieldValue('SIDE') || 'lineL',
          op: cb.getFieldValue('OP') || 'is'
        };
      case 'block_cond_color':
        return {
          s: 'color',
          op: cb.getFieldValue('OP') || 'is',
          v: cb.getFieldValue('COLOR') || 'green'
        };
      default:
        return { s: 'dist', op: '<', v: 20 };
    }
  }

  // Chuyển Blockly workspace → Chuỗi khối phẳng
  function toFlatBlocks() {
    if (!workspace) return [{ t: 'start' }];
    const topBlocks = workspace.getTopBlocks(true);
    const startBlock = topBlocks.find(b => b.type === 'block_start') || topBlocks[0];
    if (!startBlock) return [{ t: 'start' }];

    const flat = [];

    function walk(b) {
      while (b) {
        extractSingle(b, flat);
        b = b.getNextBlock();
      }
    }

    function extractSingle(b, out) {
      const id = b.id;
      switch (b.type) {
        case 'block_start':
          out.push({ t: 'start', id });
          break;
        case 'block_move':
          out.push({
            t: 'move',
            dir: b.getFieldValue('DIR') || 'fwd',
            speed: readInput(b, 'SPEED', 50),
            sec: readInput(b, 'SEC', 1),
            id
          });
          break;
        case 'block_motors':
          out.push({
            t: 'motors',
            m1: readInput(b, 'M1', 50),
            m2: readInput(b, 'M2', 50),
            id
          });
          break;
        case 'block_motor_single': {
          out.push({ t: 'motor', port: Number(b.getFieldValue('MOTOR')),
            speed: readInput(b, 'SPEED', 50), id });
          break;
        }
        case 'block_stop':
          out.push({ t: 'stop', id });
          break;
        case 'block_wait':
          out.push({
            t: 'wait',
            sec: readInput(b, 'SEC', 1),
            id
          });
          break;
        case 'block_wait_until': {
          const cond = extractCond(b.getInputTargetBlock('COND'));
          out.push({ t: 'waitUntil', cond, id });
          break;
        }
        case 'block_repeat': {
          const n = readInput(b, 'N', 10);
          out.push({ t: 'repeat', n, id });
          const target = b.getInputTargetBlock('DO');
          if (target) walk(target);
          out.push({ t: 'end', id: id + '_end' });
          break;
        }
        case 'block_forever': {
          out.push({ t: 'forever', id });
          const target = b.getInputTargetBlock('DO');
          if (target) walk(target);
          out.push({ t: 'end', id: id + '_end' });
          break;
        }
        case 'block_if': {
          const cond = extractCond(b.getInputTargetBlock('COND'));
          out.push({ t: 'if', cond, id });
          const doTarget = b.getInputTargetBlock('DO');
          if (doTarget) walk(doTarget);
          out.push({ t: 'end', id: id + '_end' });
          break;
        }
        case 'block_if_else': {
          const cond = extractCond(b.getInputTargetBlock('COND'));
          out.push({ t: 'if', cond, id });
          const doTarget = b.getInputTargetBlock('DO');
          if (doTarget) walk(doTarget);
          out.push({ t: 'else', id: id + '_else' });
          const elseTarget = b.getInputTargetBlock('ELSE');
          if (elseTarget) walk(elseTarget);
          out.push({ t: 'end', id: id + '_end' });
          break;
        }
        case 'block_sound':
          out.push({
            t: 'sound',
            tune: b.getFieldValue('TUNE') || 'A',
            id
          });
          break;
        case 'block_led':
          out.push({
            t: 'led',
            color: b.getFieldValue('COLOR') || 'red',
            id
          });
          break;
        case 'block_move_deg':
          out.push({ t: 'moveDeg', dir: b.getFieldValue('DIR') || 'fwd',
            speed: readInput(b, 'SPEED', 50), deg: readInput(b, 'DEG', 360), id });
          break;
        case 'block_line_follow':
          out.push({ t: 'lineFollow', speed: readInput(b, 'SPEED', 50), sec: readInput(b, 'SEC', 2), id });
          break;
        case 'block_turn_line':
          out.push({ t: 'turnUntilLine', l: readInput(b, 'L', -40), r: readInput(b, 'R', 40),
            eye: b.getFieldValue('EYE') || 'L', id });
          break;
        case 'block_set_var':
          out.push({ t: 'setVar', name: b.getFieldValue('NAME') || 'so_vach',
            value: readInput(b, 'VALUE', 0), id });
          break;
        case 'block_change_var':
          out.push({ t: 'changeVar', name: b.getFieldValue('NAME') || 'so_vach',
            by: readInput(b, 'BY', 1), id });
          break;
        case 'block_show_var':
          out.push({ t: 'show', name: b.getFieldValue('NAME') || 'so_vach', id });
          break;
        case 'block_timer_reset': out.push({ t: 'timerReset', id }); break;
        case 'block_buzzer': out.push({ t: 'buzzer', on: b.getFieldValue('ON') === '1', id }); break;
        case 'block_halt': out.push({ t: 'halt', id }); break;
      }
    }

    walk(startBlock);
    if (!flat.length || flat[0].t !== 'start') flat.unshift({ t: 'start' });
    return flat;
  }

  function buildExpr(expr) {
    if (!workspace) return null;
    let type = 'block_num';
    if (expr && typeof expr === 'object') {
      if ('v' in expr) type = 'block_var_get';
      else if ('c' in expr) type = 'block_color_value';
      else if ('s' in expr) type = 'block_sensor_' + expr.s;
      else if (expr.op === 'not') type = 'block_not';
      else if (['+', '-', '*', '/'].includes(expr.op)) type = 'block_math';
      else if (['<', '>', '=', '!='].includes(expr.op)) type = 'block_compare';
      else if (['and', 'or'].includes(expr.op)) type = 'block_logic';
    }
    if (!Blockly.Blocks[type]) type = 'block_num';
    const block = workspace.newBlock(type);
    if (type === 'block_num') block.setFieldValue(String(typeof expr === 'number' ? expr : expr?.n ?? 0), 'NUM');
    else if (type === 'block_var_get') block.setFieldValue(expr.v, 'NAME');
    else if (type === 'block_color_value') block.setFieldValue(expr.c, 'COLOR');
    else if (['block_math', 'block_compare', 'block_logic'].includes(type)) {
      block.setFieldValue(expr.op, 'OP');
      connectExpr(block, 'A', expr.a);
      connectExpr(block, 'B', expr.b);
    } else if (type === 'block_not') connectExpr(block, 'A', expr.a);
    block.initSvg();
    block.render();
    return block;
  }

  function connectExpr(parent, input, expr) {
    const child = buildExpr(expr);
    if (child && parent.getInput(input)) parent.getInput(input).connection.connect(child.outputConnection);
  }

  // Tạo khối điều kiện
  function createCondBlock(cond) {
    if (!workspace) return null;
    if (!cond) cond = { s: 'dist', op: '<', v: 20 };
    if ('a' in cond || ('s' in cond && !('op' in cond))) return buildExpr(cond);
    let cb;
    if (cond.s === 'dist') {
      cb = workspace.newBlock('block_cond_dist');
      cb.setFieldValue(cond.op || '<', 'OP');
      cb.setFieldValue(cond.v !== undefined ? String(cond.v) : '20', 'VAL');
    } else if (cond.s === 'touch') {
      cb = workspace.newBlock('block_cond_touch');
      cb.setFieldValue(cond.op || 'is', 'OP');
    } else if (cond.s === 'lineL' || cond.s === 'lineR') {
      cb = workspace.newBlock('block_cond_line');
      cb.setFieldValue(cond.s, 'SIDE');
      cb.setFieldValue(cond.op || 'is', 'OP');
    } else if (cond.s === 'color') {
      cb = workspace.newBlock('block_cond_color');
      cb.setFieldValue(cond.op || 'is', 'OP');
      cb.setFieldValue(cond.v || 'green', 'COLOR');
    } else {
      cb = workspace.newBlock('block_cond_dist');
    }
    cb.initSvg();
    cb.render();
    return cb;
  }

  // Nạp chuỗi khối phẳng vào Blockly workspace
  function fromFlatBlocks(blocks) {
    if (!workspace) return;
    isSyncing = true;
    try {
      workspace.clear();
      if (!blocks || !blocks.length) blocks = [{ t: 'start' }];

      let idx = 0;

      function buildChain(parentConnection) {
        let lastConnection = parentConnection;
        while (idx < blocks.length) {
          const b = blocks[idx];
          if (b.t === 'else' || b.t === 'end') {
            return;
          }

          let block = null;
          switch (b.t) {
            case 'start':
              block = workspace.newBlock('block_start');
              break;
            case 'move':
              block = workspace.newBlock('block_move');
              block.setFieldValue(b.dir || 'fwd', 'DIR');
              connectExpr(block, 'SPEED', b.speed ?? 50);
              connectExpr(block, 'SEC', b.sec ?? 1);
              break;
            case 'motors':
              block = workspace.newBlock('block_motors');
              connectExpr(block, 'M1', b.m1 ?? 50);
              connectExpr(block, 'M2', b.m2 ?? 50);
              break;
            case 'motor':
              block = workspace.newBlock('block_motor_single');
              block.setFieldValue(String(b.port ?? 1), 'MOTOR');
              connectExpr(block, 'SPEED', b.speed ?? 50);
              break;
            case 'stop':
              block = workspace.newBlock('block_stop');
              break;
            case 'wait':
              block = workspace.newBlock('block_wait');
              connectExpr(block, 'SEC', b.sec ?? 1);
              break;
            case 'waitUntil': {
              block = workspace.newBlock('block_wait_until');
              const cond = createCondBlock(b.cond);
              if (cond && block.getInput('COND')) {
                block.getInput('COND').connection.connect(cond.outputConnection);
              }
              break;
            }
            case 'repeat': {
              block = workspace.newBlock('block_repeat');
              connectExpr(block, 'N', b.n ?? 10);
              idx++;
              buildChain(block.getInput('DO').connection);
              break;
            }
            case 'forever': {
              block = workspace.newBlock('block_forever');
              idx++;
              buildChain(block.getInput('DO').connection);
              break;
            }
            case 'if': {
              // Tìm xem có else không
              let hasElse = false;
              let depth = 0;
              for (let k = idx + 1; k < blocks.length; k++) {
                if (['repeat', 'forever', 'if'].includes(blocks[k].t)) depth++;
                else if (blocks[k].t === 'else' && depth === 0) { hasElse = true; break; }
                else if (blocks[k].t === 'end') {
                  if (depth === 0) break;
                  depth--;
                }
              }

              block = workspace.newBlock(hasElse ? 'block_if_else' : 'block_if');
              const cond = createCondBlock(b.cond);
              if (cond && block.getInput('COND')) {
                block.getInput('COND').connection.connect(cond.outputConnection);
              }
              idx++;
              buildChain(block.getInput('DO').connection);
              if (hasElse && idx < blocks.length && blocks[idx].t === 'else') {
                idx++;
                buildChain(block.getInput('ELSE').connection);
              }
              break;
            }
            case 'sound':
              block = workspace.newBlock('block_sound');
              block.setFieldValue(b.tune || 'A', 'TUNE');
              break;
            case 'led':
              block = workspace.newBlock('block_led');
              block.setFieldValue(b.color || 'red', 'COLOR');
              break;
            case 'moveDeg':
              block = workspace.newBlock('block_move_deg');
              block.setFieldValue(b.dir || 'fwd', 'DIR');
              connectExpr(block, 'SPEED', b.speed ?? 50);
              connectExpr(block, 'DEG', b.deg ?? 360);
              break;
            case 'lineFollow':
              block = workspace.newBlock('block_line_follow');
              connectExpr(block, 'SPEED', b.speed ?? 50);
              connectExpr(block, 'SEC', b.sec ?? 2);
              break;
            case 'turnUntilLine':
              block = workspace.newBlock('block_turn_line');
              connectExpr(block, 'L', b.l ?? -40);
              connectExpr(block, 'R', b.r ?? 40);
              block.setFieldValue(b.eye || 'L', 'EYE');
              break;
            case 'setVar':
              block = workspace.newBlock('block_set_var');
              block.setFieldValue(b.name || 'so_vach', 'NAME');
              connectExpr(block, 'VALUE', b.value ?? 0);
              break;
            case 'changeVar':
              block = workspace.newBlock('block_change_var');
              block.setFieldValue(b.name || 'so_vach', 'NAME');
              connectExpr(block, 'BY', b.by ?? 1);
              break;
            case 'show':
              block = workspace.newBlock('block_show_var');
              block.setFieldValue(b.name || 'so_vach', 'NAME');
              break;
            case 'timerReset': block = workspace.newBlock('block_timer_reset'); break;
            case 'buzzer':
              block = workspace.newBlock('block_buzzer');
              block.setFieldValue(b.on ? '1' : '0', 'ON');
              break;
            case 'halt': block = workspace.newBlock('block_halt'); break;
          }

          if (block) {
            b.id = block.id;
            block.initSvg();
            block.render();

            if (lastConnection) {
              lastConnection.connect(block.previousConnection || block.nextConnection);
            } else if (b.t === 'start') {
              block.moveBy(40, 30);
            }
            lastConnection = block.nextConnection;
          }
          idx++;
        }
      }

      buildChain(null);
      workspace.render();
    } finally {
      isSyncing = false;
    }
  }

  // Tô sáng khối theo ID khi đang mô phỏng
  function highlightBlock(blockId) {
    if (!workspace) return;
    workspace.highlightBlock(blockId);
  }

  // Cập nhật kích thước khi chuyển màn
  function resize() {
    if (workspace) {
      Blockly.svgResize(workspace);
    }
  }

  // Xuất API toàn cục
  window.CodeLabBlocksVertical = {
    initWorkspace,
    toFlatBlocks,
    fromFlatBlocks,
    highlightBlock,
    resize,
    setMountedSensors,
    get workspace() { return workspace; }
  };
})();
