# Cấu trúc một bài mô hình: hiện trạng (Bài 3, 9, 10)

Phạm vi: chỉ đọc mã, không sửa. Nguồn: `js/*.js`, `js/bai03|bai09|bai10/*`, `scripts/*`, `tests/*`. "Chưa xác định" = không tìm thấy trong mã.
Ký hiệu cột "Bắt buộc": **B** = mã đọc thẳng, thiếu thì lỗi hoặc hiển thị "undefined"; **T** = có kiểm tra/giá trị mặc định.

## 1. `window.LESSON`

| Trường | Kiểu | Ý nghĩa | Bài 3 / Bài 9 / Bài 10 | Module đọc | Bắt buộc |
|---|---|---|---|---|---|
| `id` | string | Mã bài | `lop1-bai03` / `lop1-bai09` / `lop1-bai10` | không module nào đọc (grep) | T (thừa) |
| `label` | string | Nhãn bài | `Bài 3` / `Bài 9` / `Bài 10` | không module nào đọc | T (thừa) |
| `code` | string | Tiền tố mã tham chiếu khi hoàn thành | `ZM3` / `ZM9` / `ZM10` | mission-tracker (`|| 'ZM'`) | T |
| `sheetName` | string | Tên bài gửi Google Sheets | "Bài 3: Robot thám hiểm Milo" / "Bài 9: Thông tin liên lạc vũ trụ" / "Bài 10: Bạn gió tinh nghịch – cối xoay gió" | mission-tracker (`|| document.title`) | T |
| `store` | string | Tiền tố khóa localStorage chặng/chế độ | `zm3_` / `zm9_` / `zm10_` | app.js | B (thiếu → khóa `undefinedstage`, không lỗi) |
| `baseName` | string | Tên thân mô hình hiện ở đồng hồ đo chặng 1 | Thân robot / Thân vệ tinh / Cối xoay gió | app.js (`am-step-s`) | B (thiếu → in "undefined") |
| `Engine` | string | Tên lớp engine trong `window` | `RoverEngine` / `SimulationEngine` / `WindEngine` | app.js (`new window[L.Engine]('sim-canvas-2d')`) | B |
| `book(d)` | hàm | Từ chi tiết sự kiện `zm:step` trả `{src, alt, loc, cap, pdf}` (hình sách của bước) | B3: `assets/bai03/step-NN.jpg`, 4 bước chỉ xoay (13, 14, 20, 22) / B9: `assets/official-assembly/step-NN.jpg` + bảng `BOOK_PAGES`, bước 20 dùng hình 19, pdf `references/official/...pdf#page=N` / B10: `assets/bai10/step-NN.jpg`, bước 15 là hoàn thành | app.js | B (gọi không kiểm tra) |
| `missions` | `{core:[], pro:[]}` | Danh sách nhiệm vụ; core = bắt buộc để nộp, pro = chỉ chế độ Nâng cao | core m1–m4; pro: B3 `m5`, B9 `m5,m6`, B10 `m5` | mission-tracker (mặc định core m1–m4, pro []) | T |
| `cards` | object | Thẻ nhiệm vụ chặng 3: `{n, title, text, go?:[stage, nhãn nút]}` theo mã m1–m6 | B3 m1–m5; B9 m1–m6; B10 m1–m5 | app.js (`updateMissionCard`) | B |
| `cardOrder` | `{kid:[], pro:[]}` | Thứ tự hiện thẻ theo chế độ | kid `m2,m3,m4,m1` cả ba; pro thêm m5 (B9 thêm m6) trước m1 | app.js | B (thiếu → lỗi `L.cardOrder[...]`) |
| `blocks` | `{toolbox, pro, sample, empty}` | Khay khối, khối chỉ Nâng cao, chương trình mẫu, chương trình trống. Mỗi khối là `'mã'` hoặc `['mã', {thuộc tính}]` | xem mục 4 | app.js → `BlockEngine(opts)` | T (có mặc định nhưng bài không dùng được nếu thiếu) |
| `details(tracker)` | hàm | Chuỗi chi tiết gửi kèm kết quả, đọc `tracker.state` | B3: `lastRun`, `upgrades`, `bHits` / B9: `avoidanceMethod`, `upgrades`, `photos` / B10: `best`, `upgrades` | mission-tracker (`this.lesson.details ?`) | T |
| `creative` | object | Cấu hình xưởng sáng tạo (bảng dưới) | cả ba có | creative-lab (`|| null` → thoát nếu thiếu) | T |

### `LESSON.creative`

| Trường | Kiểu | Ý nghĩa | Ghi chú theo bài | Bắt buộc |
|---|---|---|---|---|
| `store` | string | Khóa localStorage lựa chọn | `zm3.creative` / `zm9.creative` / `zm10.creative` (dấu `.`, khác `store` ở trên dấu `_`) | B |
| `kit` | `{mã: số}` | Số linh kiện trong hộp kit | B9 có thêm mã giả `sensor: 1` | B |
| `names` | `{mã: tên}` | Tên hiển thị linh kiện | | B (thiếu → hiện mã) |
| `features` | `{id: {text}}` | Tính năng mở ở sa bàn. B9 có `icon` nhưng creative-lab không đọc | B3: bin, antenna, solar, arm / B9: solar, radar, sensor / B10: long, more, light, tail | B (`FEATURES[f].text`) |
| `slots` | mảng `{id, name, options:[{id,label,parts:{mã:n},feature}]}` | Vị trí gắn và lựa chọn | 4 slot mỗi bài | B |
| `pics` | `{presetId: svg}` | Hình nhỏ gói gợi ý | B3, B10 dùng `Proxy` lấy `MarsArt/WindArt.PICS` (file `art.js` hiện không tồn tại) rồi rơi về SVG tạm; B9 SVG cố định | B |
| `presets` | mảng `{id,title,text,pick:{slot:option}}` | Gói gợi ý. B9 có `icon` (không ai đọc) | | B |
| `emptyText` | string | Chữ khi chưa gắn gì | | T |
| `placements(DATA, H)` | hàm | Trả `{'slot:option': [instance…]}` tính từ dữ liệu 3D. `H` = `{add, sub, scale, dot, cross, norm, col, fromCols, matMul, rotateTo, make, reach, box, by}` | B3 dùng `by('BE-5158'/'BE-6313'/'BP-8840')` và `DATA.creative.*`; B9 dùng `groupPath 'Main/Head'`, mã `BP-3976/3992/7045/7023/7620`; B10 dùng `DATA.drive.output`, `BE-3581` | B |

**Người đọc `window.LESSON_3D_DATA`** (không phải LESSON): assembly-viewer (`steps, instances, meshes, textures, stepInfo, stepDescriptions, drive, labels, source, label`), creative-lab (`instances, meshes, steps, creative`). Khóa tiến độ lắp của viewer phụ thuộc `source:steps:số linh kiện`.

## 2. Hợp đồng engine và scene

### Engine (`window[L.Engine]`), app.js / sandbox-3d / creative-lab / scene gọi

| Thành phần | Ai gọi | Ghi chú |
|---|---|---|
| `constructor(canvasId)` | app.js | B3, B10 bỏ qua tham số (không có canvas 2D) |
| `init()` | app.js | khởi động vòng lặp |
| `setProgram(blocks)` | app.js (mỗi lần đổi khối) | |
| `checkMissions()` | app.js | phải gọi `onMissionUpdate(state)` |
| `start()`, `stop()` | app.js (nút ▶/■, chạm Start), scene | |
| `setAssemblyDone(bool)` | app.js (sự kiện `zm:assembly-progress`) | quyết định m1 |
| `setUpgrades(list)` | creative-lab (nút "Thử trong sa bàn") | nhận mảng id tính năng; đặt `upgradeRun=false` |
| `pauseLoop()`, `resumeLoop()` | app.js khi đổi chặng | |
| `setAdvanced(bool)` | app.js (có kiểm tra tồn tại) | cả ba bài đều có |
| `resizeCanvas()` | sandbox-3d (nút `sim-swap-view`, không kiểm tra) | B3, B10 là hàm rỗng |
| `pose3d()` → `{output, motor, offset?}` (rad; offset m) | sandbox-3d (có kiểm tra, mặc định 0) | B3: output=-rev·2π, offset [x·0.002,0,0]; B9: output=-rev·2π, motor=motorRev·2π; B10: output=rev·2π |
| hook `onActiveBlockUpdate(i)`, `onEvent(type,data)`, `onMissionUpdate(state)` | app.js gán, engine gọi | |
| `onMissionUpdate` state | mission-tracker | khóa `m1..m6` (bool) + khóa tùy bài để `details()` đọc. Khóa `allDone` do engine gửi nhưng không ai đọc |

Sự kiện engine phát cho scene (không có danh sách chuẩn):
- B3: start, stop, hand, target, waitHand, seen, melody, drop, crash, deliver, emptyArrive, short, over, end
- B9: start, stop, loop, melody, near, crash, pass, photo, avoid, needSensor
- B10: start, stop, weather, press, speed, sampleDone, melody, broken, full, end

Engine tự ghi DOM: `sim-status-pill`, `sim-status-desc`, `sim-log-list`, `sim-active-upgrade-badge`, `calc-eq1`, `calc-eq2`; chỉ số riêng: B3 `m-dist m-sample m-speed(-note) m-target(-note)`, B9 `m-motor(-note) m-out m-seg(-note) m-step(-note) calc-verdict`, B10 `m-battery m-rate m-rpm(-note) m-weather(-note)`.

### Scene (`window.ZMScene`)

Cả ba export cùng bộ: `enter, leave, onEvent(type,data), setMode(m), mode()`; bên trong gọi `window.ZMSandbox?.open/close` khi `mode==='robot'`, gắn nút `#scene-toggle`. Thiếu: không bài nào thiếu hàm. Nhưng mỗi scene đọc thuộc tính engine khác nhau (không chuẩn hóa):
- B3 (`mars-scene.js`): `has, bPos, advanced, x, waitingHand, tol, hand, sample, running, rev`; gọi `putHand()`
- B9 (`space-scene.js`): `gallery, running, advanced, motorDir, motorOn, matchesSample, laneBlocked, isApproachingHazard, has, upgrades, seen, rockXY, rockCountdown, rockAlpha, rev, pathBlocked, loopsDone`; gọi `start/stop`
- B10 (`wind-scene.js`): `has, battery, running, weather, waitingPress, rpm, rev, pressed, chargeRate, broken, advanced`; gọi `press()`, `start()`

Khối lệnh engine hỗ trợ: xem mục 4.

## 3. Nguồn dữ liệu của một bài

| Cần có | B3 | B9 | B10 |
|---|---|---|---|
| File `.io` gốc | `references/drive_bai3/io/bai3.io` | `references/original_models/Bài 9 -...io` (và `drive_bai9/io`) | `references/drive_bai10/io/bai10.io` |
| `model2.ldr` (giải nén tay từ .io, "chỉ có ở máy") | `references/drive_bai3/model2.ldr` | `references/original_models/model2.ldr` | `references/drive_bai10/model2.ldr` |
| PDF bước lắp | `references/drive_bai3/bai3_huong_dan_lap.pdf` | `references/official/Bai9_Thong_tin_lien_lac_vu_tru.pdf` | `references/drive_bai10/bai10_huong_dan_lap.pdf` |
| Ảnh bước | `assets/bai03/step-NN.jpg` (22) | `assets/official-assembly/step-NN.jpg` (tạo bằng `scripts/extract-official-steps.ps1`, cần trang PDF đã dựng `source-NN.jpg`, mapping trang→bước viết cứng cho Bài 9) | `assets/bai10/step-NN.jpg` (15) |
| Cách tạo ảnh bước B3/B10 | chưa xác định (không có script) | | chưa xác định |
| Cover | `assets/covers/lop1-bai03.jpg` | `...bai09.jpg` | `...bai10.jpg`; cách tạo: chưa xác định |
| Kế hoạch bước | `scripts/bai03-plan.js` (`steps, byPart, stepInfo, stepDescriptions, finalStep, count, headCount, joinStep`) | `scripts/assembly-plan.js` (như trên, `headCount: 23`, không có `count`) | `scripts/bai10-plan.js` (`... count, rotor`) |
| Ánh xạ chi tiết | `scripts/bai03-parts.js` | `scripts/bai9-parts.js` | `scripts/bai10-parts.js` (nhập `bai9-parts` để lấy `colors`, `rgb`) |
| Lệnh sinh → `js/data-bai-XX.js` | `node scripts/generate-bai03.js` | `node scripts/generate-from-embedded-ldraw.js` | `node scripts/generate-bai10.js` |
| Mã sinh ra trong data | `source,label,meshes,textures,instances,steps,stepDescriptions,stepInfo,warnings,labels,creative,drive` (ghi bằng `cad.writeData`) |  |  |

- Mọi `*-parts.js`: `{parts:{'file.dat':{code,color,name,type}}, colors, rgb}`; mã ZMROBO dò bằng công cụ ngoài `RBB_Studio/io2rbb match` (không nằm trong repo).
- `*-plan.js`: `parts` là chỉ số theo thứ tự trải `model2.ldr`, không phải mã; mỗi bước đối chiếu thủ công với trang PDF.
- Script `generate-*` có phần viết cứng theo bài: chỉ số linh kiện của bộ truyền (B3 `WHEEL`, B10 `instances[23]` phải là `BP-3990`, B9 mảng `output.parts`), hình `creative` dựng tay (B3/B10), bước thay trục (B9).
- Không có `package.json`; chạy bằng `node` thuần. Kiểm thử: `node tests/mission.test.js` (Bài 9), `tests/bai03.test.js`, `tests/bai10.test.js`; `*.smoke.js` cần Playwright (cài đặt: chưa xác định).
- Trang bài: `lopX-baiYY.html` là bản sao tay (xem mục 6). Thứ tự nạp: data → lesson.js → (art.js, B3/B10, `onerror` bỏ qua vì file chưa có) → audio-sfx → assembly-viewer → creative-lab → sandbox-3d → scene → blocks-engine → engine → mission-tracker → app.js.
- Quy trình ghi trong README: bước 1 sinh dữ liệu, bước 2 viết `lesson.js` + engine + scene, bước 3 tạo trang HTML và điền `href`/`cover` ở catalog.

## 4. Khối lệnh (`js/blocks-engine.js`, `BLOCK_TEMPLATES`)

Khóa dùng trong `LESSON.blocks` → loại khối `type`, tên hiển thị, nhãn tiếng Việt, tham số (đổi khi chạm khối):

| Khóa | `type` | Tên hiển thị | Nhãn | Tham số | B3 | B9 | B10 |
|---|---|---|---|---|---|---|---|
| `start` | start | Start | Bắt đầu | không (không xóa được) | mẫu, trống | mẫu, trống | mẫu, trống |
| `repeatStart` | repeatStart | Repeat Start | Bắt đầu lặp | không | không | mẫu, trống | mẫu, trống |
| `repeatEnd` | repeatEnd | Repeat End | Lặp lại | không | không | mẫu, trống | mẫu, trống |
| `melodyA` / `melodyB` | melody | Melody A/B | Âm thanh A/B | `tune` A↔B | khay | khay (B ở mẫu) | `melodyA` khay |
| `highSpeed` | motor | High Speed | Quay nhanh | `speed` high | khay, mẫu | khay, mẫu | khay, mẫu |
| `lowSpeed` | motor | Low Speed | Quay chậm | `speed` low | không | không | khay, mẫu |
| `mediumSpeed` | motor | Medium Speed | Quay vừa | `speed` medium | không | không | khay, mẫu |
| `motorPower` | motor_power | Motor Power | Tốc độ động cơ | `power` 8→1, rồi về 8 | khay | khay | khay |
| `motorReverse` | motor_reverse | Motor This Way | Đổi chiều quay | không | khay | khay | không |
| `motorStop` | stop | Stop | Dừng motor | không | khay, mẫu | khay | khay, mẫu |
| `wait` | wait | Wait | Chờ | `duration` 1–5 (mặc định 3) | khay, mẫu | khay, mẫu | khay |
| `obstacle` | sensor_obstacle | Chờ vật cản | Chờ vật cản | không | khay, mẫu | khay | không (engine vẫn xử lý) |
| `touch` | sensor_touch | Waiting for Pressed | Chờ nhấn nút | không | không | không | khay, mẫu |
| `waitClear` | wait_clear | Đợi đường trống | Đợi đường trống | không | không | pro | không |
| `ifSee` (+ `ifEnd` tự thêm) | if_see / if_end | Nếu thấy vật lạ / Hết Nếu | | không; khối bên trong nằm giữa hai khối | không | pro | không |
| `photo` | photo | Chụp ảnh gửi về | Chụp ảnh & gửi | không | không | pro | không |
| `display` | display | Display | Màn hình | `icon: 'smile'` | không bài nào dùng, không icon, không engine nào xử lý | | |

Engine xử lý loại khối nào (grep trong 3 engine): B3: melody, motor, motor_power, motor_reverse, repeat, sensor_obstacle, start, stop, wait. B9: thêm if_see/if_end, photo, wait_clear (không có `sensor_touch`). B10: thêm sensor_touch (sensor_obstacle chỉ đồng nghĩa nhấn nút).
Chương trình mẫu và so sánh "hàng mẫu mờ": `renderGhost` so từng vị trí theo chữ ký (motor và motor_power coi như nhau, wait theo số giây, melody theo `tune`).

## 5. Nhiệm vụ

- Khai báo: `LESSON.missions` (mã), `LESSON.cards`, `LESSON.cardOrder`, chip HTML `#chip-mN` (viết tay trong từng trang, chip pro có lớp `pro-only`).
- Đánh dấu hoàn thành: engine tự chấm trong `checkMissions()` và gọi `onMissionUpdate({m1..m6,...})`; tracker: m1 theo trạng thái hiện tại (bỏ đánh dấu bước thì mất), m2 trở đi đã đạt thì giữ trong phiên (không lưu localStorage). `core` hoàn thành hết thì hiện hộp thoại, sinh mã `CODE-LỚP-TÊN-4SỐ`, cho nộp Sheets (webhook ở localStorage `zm_teacher_webhook`). Payload cố định cột m1–m6 (không có → `null`), `score` chỉ tính core.

| Mã | Loại | Bài 3 (rover-engine) | Bài 9 (simulation-engine) | Bài 10 (wind-engine) |
|---|---|---|---|---|
| m1 | core | Lắp đủ 22 bước: sự kiện `zm:assembly-progress` (viewer) → `setAssemblyDone` | đủ 28 bước, cùng cơ chế | đủ 15 bước, cùng cơ chế |
| m2 | core | Chương trình khớp mẫu và chạy hết có đưa tay (`finish`, `handUsed`) | khớp mẫu và `loopsDone>=1` | khối stop hoàn tất mẫu (`stopsAfterHigh` + `matchesSample`, sự kiện `sampleDone`) |
| m3 | core | Dừng trong ±tol quanh B mà mẫu cây không rơi (sự kiện `deliver`) | `asteroidAvoided` (né đám đá) | pin đầy (sự kiện `full`) |
| m4 | core | Có gói nâng cấp và đã chạy khối motor có gói (`upgrades.size>0 && upgradeRun`) | cùng điều kiện | cùng điều kiện |
| m5 | pro | `bHits.size>=3` (chở đúng 3 vị trí B khác nhau, chỉ ở Nâng cao) | `rockPassed` (đợi thiên thạch bay qua) | `done.m5`: pin đầy khi đã gặp bão ở Nâng cao |
| m6 | pro | không có | `gallery.size>0` (trạm nhận ảnh vật lạ) | không có |

## 6. Chỗ viết cứng theo bài trong module dùng chung (nợ cần dọn)

| # | Vị trí | Vấn đề |
|---|---|---|
| 1 | `js/app.js` dòng ~50 | Câu hoàn thành "tự sáng tạo chương trình mới cho vệ tinh" áp cho cả B3 (robot) và B10 (cối xoay gió) |
| 2 | `js/app.js` (`ghost-wrap`) | `$('ghost-wrap').hidden = !!m.m2`: ngầm định m2 là nhiệm vụ "hàng mẫu mờ" |
| 3 | `js/assembly-viewer.js` ~1143 | Nhãn dự phòng `DATA.label || 'Bài 9'`; đọc cứng `window.LESSON_3D_DATA`; `DATA.drive` chỉ hiểu hai khóa `output`, `motor` |
| 4 | `js/mission-tracker.js` | Cố định m1–m6 (payload `[1..6]`, mặc định core m1–m4, chip `chip-m1..m6`); m1 là mã đặc biệt (không giữ lại); `/^md$/` là dấu vết cũ; `allDone` từ engine không dùng |
| 5 | `js/creative-lab.js` | `r.code !== 'sensor'`: mã giả riêng của Bài 9; gọi cứng `simEngine.setUpgrades` |
| 6 | `js/blocks-engine.js` | Một từ điển `BLOCK_TEMPLATES` chung chứa khối chỉ một bài dùng (photo, ifSee, waitClear, touch); `cycleParam` đoán "có Quay vừa" qua `toolbox.includes('mediumSpeed')`; `insertAt` giả định tối đa một vòng lặp; `if_see` xử lý đặc biệt |
| 7 | Engine ↔ lesson.js | Chương trình mẫu khai báo hai lần (`LESSON.blocks.sample` và `SAMPLE` trong từng engine); nhãn gói nâng cấp lặp trong `setUpgrades` của engine so với `LESSON.creative.features`; số bước ghi cứng trong chữ thẻ (22/28/15) và chip HTML |
| 8 | Engine ↔ HTML | Engine ghi trực tiếp các id `m-*`, `calc-*`, `sim-*`; HTML mỗi bài là bản sao riêng (B3/B10 lệch 16 id so với B9: ví dụ `chip-m6`, `m-*`, `scene-press`) |
| 9 | Scene | Ba file `ZMScene` riêng, mỗi file lặp `enter/leave/setMode` và gọi `ZMSandbox`; mỗi scene đọc thuộc tính engine khác nhau, không có giao diện chuẩn |
| 10 | `js/project/project.js:39` | `BASES = [3, 9, 10, 11, 12, 13]` số bài viết cứng (11–13 chưa có trang); thêm bài mới phải sửa tay |
| 11 | Đặt tên/đường dẫn | `assets/official-assembly` (B9) so với `assets/bai03`, `assets/bai10`; `bai9-parts.js` (không số 0) so với `bai03`/`bai10`; `assembly-plan.js` và `generate-from-embedded-ldraw.js` không mang tên bài; `bai10-parts.js` phụ thuộc `bai9-parts.js`; `LESSON.store` (`zm10_`) và `creative.store` (`zm10.creative`) khác dấu |
| 12 | Trường thừa | `LESSON.id`, `LESSON.label`, `creative.features[].icon`, `presets[].icon` không ai đọc |
| 13 | Tests | Chỉ có test riêng từng bài (`mission.test.js` là của B9); chưa có test dùng chung kiểm tra hợp đồng `LESSON`/engine |

## 7. Catalog và localStorage

`js/catalog.js`: `window.ZM_CATALOG = { lessons, types, grades:[1..5] }`.
`L(grade, term, no, title, type='model', more={})` → `{grade, term, no, title, type, ...more}`; `type` ∈ `model | project | theory | test`; `more` = `{href, cover, about}`. Có `href` thì thẻ mở được, không có thì "Sắp có". `types[type]` = `{label, hint}`. Đọc bởi `js/home.js` (lọc theo `grade`, `term`, `href`, `cover`, `about`, `type`) và `js/project/project.js` (lấy `title`, `cover` của các bài trong `BASES`). Đã có `href`: Lớp 1 bài 3, 9, 10, các bài dự án 14–17 (`lop1-du-an.html?hk=&chang=`), 18 (`lop1-trung-bay.html?hk=1`); tuần 31–35 xem `catalog.js` (chưa kiểm từng dòng).

| Khóa localStorage | Nơi ghi | Nội dung |
|---|---|---|
| `zm3_` / `zm9_` / `zm10_` + `stage` | app.js | chặng đang mở (`assembly`/`creative`/`sim`) |
| `zm3_` / `zm9_` / `zm10_` + `mode` | app.js | `kid` hoặc `pro` |
| `zm3.creative` / `zm9.creative` / `zm10.creative` | creative-lab | JSON `{slotId: optionId}` |
| `rbb.progress:<source>:<steps>:<số linh kiện>` | assembly-viewer | tiến độ bước đã lắp, câu đố |
| `rbb.style` | assembly-viewer | `{mark, outline, pli}` |
| `zm_theme` | app.js, home.js, project.js, showcase.js | `light`/`dark` |
| `zm_student_name`, `zm_student_class` | mission-tracker, app.js | tên, lớp học sinh |
| `zm_teacher_webhook` | mission-tracker, app.js, project.js | địa chỉ Google Sheets |
| `zm_home_grade`, `zm_home_term` | home.js | lớp, học kì lần trước |
| `zm_proj_hk1`, `zm_proj_hk2` | project.js | bài làm sổ dự án theo học kì (JSON, có ảnh thu nhỏ) |

Nhiệm vụ đã đạt (m2 trở đi) không lưu; showcase.js không lưu poster (chỉ `zm_theme`).
