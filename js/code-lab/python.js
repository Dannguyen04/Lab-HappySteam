// Phòng lập trình (Code Lab) – Trình sinh mã Python trực tiếp từ chuỗi khối phẳng.
// Cú pháp chuẩn mô phỏng robot: motor(), move_forward(), while True:, if ultrasonic(1) < 20:, ...
(function (root) {
  'use strict';

  const pyName = name => {
    const safe = String(name || 'so_vach').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9_]/g, '_');
    return /^[A-Za-z_]/.test(safe) ? safe : '_' + safe;
  };
  const pyString = s => JSON.stringify(String(s));
  const sensors = {
    dist: 'ultrasonic(1)', touch: 'touch_sensor(2)', lineL: 'line_sensor_left(3)',
    lineR: 'line_sensor_right(3)', light: 'light_sensor(3)', color: 'color_sensor(4)',
    timer: 'controller_timer()', enc1: 'encoder(1)', enc2: 'encoder(2)'
  };
  function formatExpr(expr) {
    if (expr === undefined || expr === null) return '0';
    if (typeof expr === 'number') return String(expr);
    if (typeof expr === 'boolean') return expr ? 'True' : 'False';
    if (typeof expr === 'string') return pyString(expr);
    if ('n' in expr) return String(expr.n);
    if ('c' in expr) return pyString(expr.c);
    if ('v' in expr) return pyName(expr.v);
    if ('s' in expr && !('op' in expr)) return sensors[expr.s] || '0';
    if (expr.op === 'not') return `(not ${formatExpr(expr.a)})`;
    const op = ({ '=': '==', '!=': '!=', and: 'and', or: 'or' })[expr.op] || expr.op;
    if (!['+', '-', '*', '/', '<', '>', '==', '!=', 'and', 'or'].includes(op)) return '0';
    if (op === '/') return `safe_divide(${formatExpr(expr.a)}, ${formatExpr(expr.b)})`;
    return `(${formatExpr(expr.a)} ${op} ${formatExpr(expr.b)})`;
  }

  function formatCond(cond) {
    if (!cond) return 'True';
    if ('a' in cond || ('s' in cond && !('op' in cond))) return formatExpr(cond);
    switch (cond.s) {
      case 'dist': {
        const op = cond.op === '>' ? '>' : '<';
        const v = cond.v !== undefined ? cond.v : 20;
        return `ultrasonic(1) ${op} ${v}`;
      }
      case 'touch':
        return cond.op === 'not' ? 'not touch_sensor(2)' : 'touch_sensor(2)';
      case 'lineL':
        return cond.op === 'not' ? 'not line_sensor_left(3)' : 'line_sensor_left(3)';
      case 'lineR':
        return cond.op === 'not' ? 'not line_sensor_right(3)' : 'line_sensor_right(3)';
      case 'color': {
        const op = cond.op === 'not' ? '!=' : '==';
        return `color_sensor(4) ${op} '${cond.v || "green"}'`;
      }
      default:
        return 'True';
    }
  }

  function toPython(blocks) {
    if (!blocks || !blocks.length) {
      return '# Robot Alpha 330 - RoboSim Python\n# Chưa có chương trình\n';
    }

    const lines = [];
    lines.push('# Robot Alpha 330 - RoboSim Python');
    lines.push('from robosim import *');
    lines.push('');
    if (blocks.some(b => JSON.stringify(b).includes('"op":"/"'))) {
      lines.push('def safe_divide(a, b):');
      lines.push('    return a / b if b else 0');
      lines.push('');
    }

    let indent = 0;
    const pad = () => '    '.repeat(indent);
    const blockStack = [];

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.t === 'start') {
        lines.push('# Nhiệm vụ 1: Bắt đầu');
        continue;
      }
      if (b.t === 'else') {
        if (blockStack.length && !blockStack[blockStack.length - 1].hasBody) {
          lines.push(pad() + 'pass');
        }
        indent = Math.max(0, indent - 1);
        lines.push(pad() + 'else:');
        indent++;
        if (blockStack.length) blockStack[blockStack.length - 1].hasBody = false;
        continue;
      }
      if (b.t === 'end') {
        if (blockStack.length && !blockStack[blockStack.length - 1].hasBody) {
          lines.push(pad() + 'pass');
        }
        blockStack.pop();
        indent = Math.max(0, indent - 1);
        continue;
      }

      if (blockStack.length) {
        blockStack[blockStack.length - 1].hasBody = true;
      }

      switch (b.t) {
        case 'move': {
          const fn = {
            fwd: 'move_forward',
            back: 'move_backward',
            left: 'turn_left',
            right: 'turn_right'
          }[b.dir] || 'move_forward';
          const sec = formatExpr(b.sec ?? 1);
          const sp = formatExpr(b.speed ?? 50);
          lines.push(`${pad()}${fn}(${sp}, ${sec})`);
          break;
        }
        case 'motors': {
          const m1 = formatExpr(b.m1 ?? 50);
          const m2 = formatExpr(b.m2 ?? 50);
          lines.push(`${pad()}motor(1, ${m1})`);
          lines.push(`${pad()}motor(2, ${m2})`);
          break;
        }
        case 'stop': {
          lines.push(`${pad()}stop_moving()`);
          break;
        }
        case 'wait': {
          const sec = formatExpr(b.sec ?? 1);
          lines.push(`${pad()}wait(${sec})`);
          break;
        }
        case 'waitUntil': {
          lines.push(`${pad()}while not (${formatCond(b.cond)}):`);
          lines.push(`${pad()}    wait(0.05)`);
          break;
        }
        case 'repeat': {
          lines.push(`${pad()}for _ in range(max(0, int(${formatExpr(b.n ?? 10)}))):`);
          indent++;
          blockStack.push({ hasBody: false });
          break;
        }
        case 'forever': {
          lines.push(`${pad()}while True:`);
          indent++;
          blockStack.push({ hasBody: false });
          break;
        }
        case 'if': {
          lines.push(`${pad()}if ${formatCond(b.cond)}:`);
          indent++;
          blockStack.push({ hasBody: false });
          break;
        }
        case 'sound': {
          lines.push(`${pad()}play_sound('${b.tune || "A"}')`);
          break;
        }
        case 'led': {
          lines.push(`${pad()}set_led('${b.color || "red"}')`);
          break;
        }
        case 'motor':
          lines.push(`${pad()}motor(${Number(b.port) === 2 ? 2 : 1}, ${formatExpr(b.speed ?? 50)})`);
          break;
        case 'moveDeg': {
          const fn = { fwd: 'move_forward_degrees', back: 'move_backward_degrees',
            left: 'turn_left_degrees', right: 'turn_right_degrees' }[b.dir] || 'move_forward_degrees';
          lines.push(`${pad()}${fn}(${formatExpr(b.speed ?? 50)}, ${formatExpr(b.deg ?? 360)})`);
          break;
        }
        case 'lineFollow':
          lines.push(`${pad()}follow_line(${formatExpr(b.speed ?? 50)}, ${formatExpr(b.sec ?? 2)})`);
          break;
        case 'turnUntilLine':
          lines.push(`${pad()}turn_until_line(${formatExpr(b.l ?? -40)}, ${formatExpr(b.r ?? 40)}, ${pyString(b.eye || 'L')})`);
          break;
        case 'setVar':
          lines.push(`${pad()}${pyName(b.name)} = ${formatExpr(b.value ?? 0)}`);
          break;
        case 'changeVar': {
          const name = pyName(b.name);
          lines.push(`${pad()}${name} = globals().get(${pyString(name)}, 0) + ${formatExpr(b.by ?? 1)}`);
          break;
        }
        case 'show':
          lines.push(`${pad()}show_variable(${pyString(b.name)}, globals().get(${pyString(pyName(b.name))}, 0))`);
          break;
        case 'timerReset': lines.push(`${pad()}reset_timer()`); break;
        case 'buzzer': lines.push(`${pad()}buzzer(${b.on ? 'True' : 'False'})`); break;
        case 'halt': lines.push(`${pad()}stop_moving()`); lines.push(`${pad()}break_program()`); break;
      }
    }

    while (blockStack.length) {
      if (!blockStack.pop().hasBody) {
        lines.push(pad() + 'pass');
      }
      indent = Math.max(0, indent - 1);
    }

    return lines.join('\n') + '\n';
  }

  // Tô màu cú pháp Python để hiển thị trực quan trong ô xem mã
  function highlightPython(code) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      let l = esc(line);
      // Comments
      if (l.trim().startsWith('#')) {
        l = `<span class="py-comment">${l}</span>`;
      } else {
        // Strings
        l = l.replace(/(['"])(.*?)\1/g, '<span class="py-str">$1$2$1</span>');
        // Keywords
        l = l.replace(/\b(from|import|while|for|in|range|if|else|not|True|False|pass)\b/g, '<span class="py-kw">$1</span>');
        // Built-in functions
        l = l.replace(/\b(motor|move_forward|move_backward|turn_left|turn_right|stop_moving|wait|play_sound|set_led|ultrasonic|touch_sensor|line_sensor_left|line_sensor_right|color_sensor|light_sensor|controller_timer|encoder|follow_line|turn_until_line|show_variable|reset_timer|buzzer|break_program|safe_divide)\b(?=\()/g, '<span class="py-fn">$1</span>');
        // Numbers
        l = l.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="py-num">$1</span>');
      }
      return `<div class="py-line"><span class="py-lineno">${idx + 1}</span><span class="py-text">${l || ' '}</span></div>`;
    }).join('');
  }

  const CodeLabPython = { toPython, highlightPython, formatCond, formatExpr };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeLabPython;
  } else {
    root.CodeLabPython = CodeLabPython;
  }
})(typeof window !== 'undefined' ? window : globalThis);
