(() => {
  'use strict';

  const STORAGE_KEY = 'iwakan_custom_targets_v20';
  const EDIT_STEP = 0.005;
  const MIN_SIZE = 0.01;

  const defaultStages = [
    { src: 'assets/scene1.png', target: { x: 0.560, y: 0.740, w: 0.130, h: 0.080 } },
    { src: 'assets/scene2.png', target: { x: 0.035, y: 0.505, w: 0.400, h: 0.105 } },
    { src: 'assets/scene3.png', target: { x: 0.470, y: 0.600, w: 0.510, h: 0.240 } },
    { src: 'assets/scene4.png', target: { x: 0.670, y: 0.030, w: 0.310, h: 0.150 } },
    { src: 'assets/scene5.png', target: { x: 0.780, y: 0.740, w: 0.210, h: 0.130 } },
    { src: 'assets/scene6.png', target: { x: 0.730, y: 0.720, w: 0.250, h: 0.150 } },
    { src: 'assets/scene7.png', target: { x: 0.700, y: 0.180, w: 0.290, h: 0.240 } },
    { src: 'assets/scene8.png', target: { x: 0.810, y: 0.340, w: 0.170, h: 0.140 } },
    { src: 'assets/scene9.png', target: { x: 0.790, y: 0.090, w: 0.160, h: 0.140 } },
    { src: 'assets/scene10.png', target: { x: 0.770, y: 0.300, w: 0.200, h: 0.260 } },
    { src: 'assets/scene11.png', target: { x: 0.230, y: 0.260, w: 0.550, h: 0.470 } },
    { src: 'assets/scene12.png', target: { x: 0.000, y: 0.020, w: 0.150, h: 0.170 } },
    { src: 'assets/scene13.png', target: { x: 0.700, y: 0.290, w: 0.110, h: 0.170 } },
    { src: 'assets/scene14.png', target: { x: 0.000, y: 0.790, w: 0.150, h: 0.210 } },
    { src: 'assets/scene15.png', target: { x: 0.740, y: 0.120, w: 0.210, h: 0.560 } },
    { src: 'assets/scene16.png', target: { x: 0.350, y: 0.220, w: 0.240, h: 0.100 } },
    { src: 'assets/scene17.png', target: { x: 0.435, y: 0.390, w: 0.155, h: 0.120 } },
    { src: 'assets/scene18.png', target: { x: 0.650, y: 0.280, w: 0.260, h: 0.180 } },
    { src: 'assets/scene19.png', target: { x: 0.455, y: 0.090, w: 0.155, h: 0.095 } },
    { src: 'assets/scene20.png', target: { x: 0.000, y: 0.040, w: 0.160, h: 0.140 } }
  ];

  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const stages = deepClone(defaultStages);

  const $ = (id) => document.getElementById(id);
  const startPanel = $('startPanel');
  const stageSelectPanel = $('stageSelectPanel');
  const gamePanel = $('gamePanel');
  const editorPanel = $('editorPanel');
  const resultPanel = $('resultPanel');
  const secretEditorTrigger = $('secretEditorTrigger');

  const startButton = $('startButton');
  const stageSelectButton = $('stageSelectButton');
  const hitboxEditButton = $('hitboxEditButton');
  const stageEditButton = $('stageEditButton');
  const stageBackButton = $('stageBackButton');
  const resultStageSelectButton = $('resultStageSelectButton');
  const resultEditButton = $('resultEditButton');
  const retryButton = $('retryButton');
  const quitButton = $('quitButton');
  const stageGrid = $('stageGrid');

  const imageShell = $('imageShell');
  const sceneImage = $('sceneImage');
  const markerLayer = $('markerLayer');
  const loading = $('loading');
  const stageText = $('stageText');
  const livesText = $('livesText');
  const hintText = $('hintText');

  const toast = $('toast');
  const resultSymbol = $('resultSymbol');
  const resultTitle = $('resultTitle');
  const resultMessage = $('resultMessage');
  const clearCount = $('clearCount');
  const missCount = $('missCount');

  const editorPrevButton = $('editorPrevButton');
  const editorNextButton = $('editorNextButton');
  const editorStageLabel = $('editorStageLabel');
  const editorShell = $('editorShell');
  const editorImage = $('editorImage');
  const editorOverlay = $('editorOverlay');
  const editRect = $('editRect');
  const editorLoading = $('editorLoading');
  const editorValues = $('editorValues');
  const editorResetButton = $('editorResetButton');
  const editorCopyCurrentButton = $('editorCopyCurrentButton');
  const editorCopyAllButton = $('editorCopyAllButton');
  const editorPlayButton = $('editorPlayButton');
  const editorBackButton = $('editorBackButton');

  let stageIndex = 0;
  let stageMisses = 0;
  let totalMisses = 0;
  let solved = false;
  let playMode = 'campaign';
  let toastTimer = null;
  let audioContext = null;
  let masterGain = null;
  let bgmGain = null;
  let bgmTimer = null;
  let bgmPlaying = false;
  let bgmStep = 0;
  let soundEnabled = true;
  let bgmAudio = null;
  let bgmFadeTimer = null;

  let editStageIndex = 0;
  let editorDrawing = false;
  let drawStart = null;

  let secretTapCount = 0;
  let secretTapTimer = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round3(value) {
    return Math.round(value * 1000) / 1000;
  }

  function normalizeTarget(target) {
    const t = {
      x: clamp(target.x, 0, 1),
      y: clamp(target.y, 0, 1),
      w: clamp(target.w, MIN_SIZE, 1),
      h: clamp(target.h, MIN_SIZE, 1)
    };
    if (t.x + t.w > 1) t.x = 1 - t.w;
    if (t.y + t.h > 1) t.y = 1 - t.h;
    t.x = clamp(t.x, 0, 1 - MIN_SIZE);
    t.y = clamp(t.y, 0, 1 - MIN_SIZE);
    t.w = clamp(t.w, MIN_SIZE, 1 - t.x);
    t.h = clamp(t.h, MIN_SIZE, 1 - t.y);
    return {
      x: round3(t.x),
      y: round3(t.y),
      w: round3(t.w),
      h: round3(t.h)
    };
  }

  function loadCustomTargets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return;
      saved.forEach((target, index) => {
        if (!stages[index] || !target) return;
        stages[index].target = normalizeTarget(target);
      });
    } catch (error) {
      console.warn('custom target load failed', error);
    }
  }

  function saveCustomTargets() {
    const payload = stages.map((stage) => normalizeTarget(stage.target));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function setView(view) {
    startPanel.classList.toggle('hidden', view !== 'start');
    stageSelectPanel.classList.toggle('hidden', view !== 'select');
    gamePanel.classList.toggle('hidden', view !== 'game');
    editorPanel.classList.toggle('hidden', view !== 'editor');
    resultPanel.classList.toggle('hidden', view !== 'result');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function ensureAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) {
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(audioContext.destination);

      bgmGain = audioContext.createGain();
      bgmGain.gain.value = 0.11;
      bgmGain.connect(masterGain);
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playTone(frequency, start, duration, type = 'sine', volume = 0.15, destination = null, detune = 0) {
    const ctx = ensureAudio();
    if (!ctx || !soundEnabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    osc.detune.setValueAtTime(detune, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(destination || masterGain || ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.04);
  }

  function playNoise(start, duration, volume = 0.12, destination = null) {
    const ctx = ensureAudio();
    if (!ctx || !soundEnabled) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, start);
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination || masterGain || ctx.destination);
    source.start(start);
    source.stop(start + duration);
  }

  function getBgmAudio() {
    if (!bgmAudio) {
      bgmAudio = new Audio('assets/mystery_bgm.wav');
      bgmAudio.loop = true;
      bgmAudio.preload = 'auto';
      bgmAudio.volume = 0.42;
      bgmAudio.setAttribute('playsinline', '');
    }
    return bgmAudio;
  }

  function startBgm() {
    if (!soundEnabled) return;
    const audio = getBgmAudio();
    if (bgmFadeTimer) {
      clearInterval(bgmFadeTimer);
      bgmFadeTimer = null;
    }
    audio.volume = 0.42;
    bgmPlaying = true;

    // Called directly from a click/tap/key gesture, which makes playback
    // much more reliable on Chrome/Safari/mobile browsers than scheduling
    // the whole BGM through a suspended AudioContext.
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        console.warn('BGM playback was blocked; retrying on next game tap.', error);
        bgmPlaying = false;
      });
    }
  }

  function stopBgm(fade = true) {
    bgmPlaying = false;
    if (!bgmAudio) return;
    if (bgmFadeTimer) {
      clearInterval(bgmFadeTimer);
      bgmFadeTimer = null;
    }

    if (!fade) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
      bgmAudio.volume = 0.42;
      return;
    }

    const startVolume = bgmAudio.volume;
    const started = performance.now();
    bgmFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / 320);
      bgmAudio.volume = Math.max(0, startVolume * (1 - progress));
      if (progress >= 1) {
        clearInterval(bgmFadeTimer);
        bgmFadeTimer = null;
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
        bgmAudio.volume = 0.42;
      }
    }, 32);
  }

  function playCorrectSound() {
    const ctx = ensureAudio();
    if (!ctx || !soundEnabled) return;
    const now = ctx.currentTime + 0.01;

    // Bright arcade-style fanfare: impact + rising chord + shimmer
    playNoise(now, 0.12, 0.12);
    playTone(523.25, now, 0.18, 'square', 0.10);
    playTone(659.25, now + 0.07, 0.24, 'square', 0.10);
    playTone(783.99, now + 0.14, 0.30, 'triangle', 0.13);
    playTone(1046.50, now + 0.22, 0.42, 'sine', 0.18);
    playTone(1318.51, now + 0.28, 0.46, 'sine', 0.10, null, 7);
    playTone(1567.98, now + 0.34, 0.50, 'sine', 0.07, null, -7);
  }

  function playWrongSound() {
    const ctx = ensureAudio();
    if (!ctx || !soundEnabled) return;
    const now = ctx.currentTime + 0.01;

    // Heavy buzzer with descending hit
    playNoise(now, 0.18, 0.08);
    playTone(150, now, 0.42, 'sawtooth', 0.15);
    playTone(103, now + 0.03, 0.46, 'square', 0.09);
    playTone(82, now + 0.18, 0.38, 'sawtooth', 0.10);
    playTone(61.74, now + 0.31, 0.44, 'triangle', 0.10);
  }

  function playGameOverSound() {
    const ctx = ensureAudio();
    if (!ctx || !soundEnabled) return;
    const now = ctx.currentTime + 0.01;
    [220, 174.61, 146.83, 110].forEach((freq, i) => {
      playTone(freq, now + i * 0.18, 0.34, i % 2 ? 'sawtooth' : 'square', 0.10);
    });
    playNoise(now + 0.42, 0.38, 0.07);
  }

  function playClearSound() {
    const ctx = ensureAudio();
    if (!ctx || !soundEnabled) return;
    const now = ctx.currentTime + 0.01;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      playTone(freq, now + i * 0.11, 0.42, 'triangle', 0.11);
    });
    playTone(1567.98, now + 0.56, 0.75, 'sine', 0.12);
  }

  function updateHud() {
    stageText.textContent = `${stageIndex + 1} / ${stages.length}`;
    const remaining = Math.max(0, 3 - stageMisses);
    livesText.textContent = `${'● '.repeat(remaining)}${'○ '.repeat(3 - remaining)}`.trim();
    hintText.textContent = stageMisses === 0
      ? '気になる場所をタップしてください'
      : `この画像では、あと ${remaining} 回ミスするとゲームオーバー`;
  }

  function showToast(message, type = 'note') {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 1100);
  }

  function addMarker(xPercent, yPercent, correct) {
    const marker = document.createElement('div');
    marker.className = `tap-marker ${correct ? 'correct' : 'wrong'}`;
    marker.textContent = correct ? '〇' : '×';
    marker.style.left = `${xPercent * 100}%`;
    marker.style.top = `${yPercent * 100}%`;
    markerLayer.appendChild(marker);

    if (!correct) setTimeout(() => marker.remove(), 850);
  }

  function loadStage() {
    solved = false;
    stageMisses = 0;
    markerLayer.innerHTML = '';
    loading.textContent = 'LOADING...';
    loading.classList.remove('hidden');
    updateHud();

    const stage = stages[stageIndex];
    sceneImage.onload = () => loading.classList.add('hidden');
    sceneImage.onerror = () => { loading.textContent = '画像を読み込めませんでした'; };
    sceneImage.src = stage.src;
  }

  function buildStageSelect() {
    stageGrid.innerHTML = '';
    stages.forEach((stage, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'stage-card';
      button.innerHTML = `<img class="stage-thumb" src="${stage.src}" alt="ステージ${index + 1}"><strong>STAGE ${index + 1}</strong>`;
      button.addEventListener('click', () => startSingleStage(index));
      stageGrid.appendChild(button);
    });
  }

  function finishGame(clear) {
    stopBgm(true);
    if (clear) playClearSound();
    else playGameOverSound();
    setView('result');
    const cleared = playMode === 'single' ? (clear ? 1 : 0) : (clear ? stages.length : stageIndex);
    const total = playMode === 'single' ? 1 : stages.length;
    clearCount.textContent = `${cleared} / ${total}`;
    missCount.textContent = `${totalMisses}`;

    if (clear) {
      resultSymbol.textContent = '◎';
      resultSymbol.style.color = 'var(--accent)';
      resultTitle.textContent = playMode === 'single' ? 'STAGE CLEAR!' : 'GAME CLEAR!';
      if (playMode === 'single') {
        resultMessage.textContent = `ステージ ${stageIndex + 1} の違和感を見つけました。`;
      } else {
        resultMessage.textContent = totalMisses === 0
          ? 'ノーミスクリア！ すべての違和感を見抜きました。'
          : 'すべての違和感を見つけました。';
      }
    } else {
      resultSymbol.textContent = '×';
      resultSymbol.style.color = 'var(--ng)';
      resultTitle.textContent = 'GAME OVER';
      resultMessage.textContent = `ステージ ${stageIndex + 1} で3回間違えました。`;
    }
  }

  function startCampaign() {
    ensureAudio();
    startBgm();
    playMode = 'campaign';
    stageIndex = 0;
    stageMisses = 0;
    totalMisses = 0;
    solved = false;
    toast.classList.add('hidden');
    setView('game');
    loadStage();
  }

  function startSingleStage(index) {
    ensureAudio();
    startBgm();
    playMode = 'single';
    stageIndex = index;
    stageMisses = 0;
    totalMisses = 0;
    solved = false;
    toast.classList.add('hidden');
    setView('game');
    loadStage();
  }

  function handleTap(event) {
    if (solved || !loading.classList.contains('hidden')) return;
    ensureAudio();
    if (!bgmPlaying && soundEnabled) startBgm();

    const rect = sceneImage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return;

    const t = stages[stageIndex].target;
    const correct = px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h;
    addMarker(px, py, correct);

    if (correct) {
      solved = true;
      playCorrectSound();
      showToast('〇 ピンポン♪ 正解！', 'ok');
      hintText.textContent = '正解！';

      setTimeout(() => {
        if (playMode === 'single') {
          finishGame(true);
          return;
        }
        stageIndex += 1;
        if (stageIndex >= stages.length) {
          finishGame(true);
        } else {
          loadStage();
        }
      }, 850);
      return;
    }

    stageMisses += 1;
    totalMisses += 1;
    playWrongSound();
    showToast('× ブー！ ちがいます', 'ng');
    updateHud();

    if (stageMisses >= 3) {
      solved = true;
      setTimeout(() => finishGame(false), 650);
    }
  }

  function formatTarget(target) {
    const t = normalizeTarget(target);
    return `x: ${t.x.toFixed(3)} / y: ${t.y.toFixed(3)} / w: ${t.w.toFixed(3)} / h: ${t.h.toFixed(3)}`;
  }

  function updateEditorRect() {
    const t = normalizeTarget(stages[editStageIndex].target);
    stages[editStageIndex].target = t;
    editRect.style.left = `${t.x * 100}%`;
    editRect.style.top = `${t.y * 100}%`;
    editRect.style.width = `${t.w * 100}%`;
    editRect.style.height = `${t.h * 100}%`;
    editorValues.textContent = formatTarget(t);
    editorStageLabel.textContent = `STAGE ${editStageIndex + 1} / ${stages.length}`;
  }

  function loadEditorStage() {
    editorLoading.textContent = 'LOADING...';
    editorLoading.classList.remove('hidden');
    editorImage.onload = () => {
      editorLoading.classList.add('hidden');
      updateEditorRect();
    };
    editorImage.onerror = () => {
      editorLoading.textContent = '画像を読み込めませんでした';
    };
    editorImage.src = stages[editStageIndex].src;
    updateEditorRect();
  }

  function openEditor(index = 0) {
    editStageIndex = clamp(index, 0, stages.length - 1);
    setView('editor');
    loadEditorStage();
  }

  function pointToNormalized(event, element) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }

  function beginDraw(event) {
    if (!editorLoading.classList.contains('hidden')) return;
    const point = pointToNormalized(event, editorOverlay);
    if (!point) return;
    editorDrawing = true;
    drawStart = point;
    const target = { x: point.x, y: point.y, w: MIN_SIZE, h: MIN_SIZE };
    stages[editStageIndex].target = normalizeTarget(target);
    updateEditorRect();
    if (editorOverlay.setPointerCapture && event.pointerId != null) {
      editorOverlay.setPointerCapture(event.pointerId);
    }
  }

  function moveDraw(event) {
    if (!editorDrawing || !drawStart) return;
    const point = pointToNormalized(event, editorOverlay);
    if (!point) return;
    const x1 = Math.min(drawStart.x, point.x);
    const y1 = Math.min(drawStart.y, point.y);
    const x2 = Math.max(drawStart.x, point.x);
    const y2 = Math.max(drawStart.y, point.y);
    stages[editStageIndex].target = normalizeTarget({
      x: x1,
      y: y1,
      w: Math.max(MIN_SIZE, x2 - x1),
      h: Math.max(MIN_SIZE, y2 - y1)
    });
    updateEditorRect();
  }

  function endDraw() {
    if (!editorDrawing) return;
    editorDrawing = false;
    drawStart = null;
    saveCustomTargets();
    showToast('当たり判定を保存しました', 'note');
  }

  function tweakTarget(action) {
    const t = { ...stages[editStageIndex].target };
    switch (action) {
      case 'up': t.y -= EDIT_STEP; break;
      case 'down': t.y += EDIT_STEP; break;
      case 'left': t.x -= EDIT_STEP; break;
      case 'right': t.x += EDIT_STEP; break;
      case 'wider':
        t.x -= EDIT_STEP / 2;
        t.w += EDIT_STEP;
        break;
      case 'narrower':
        t.x += EDIT_STEP / 2;
        t.w -= EDIT_STEP;
        break;
      case 'taller':
        t.y -= EDIT_STEP / 2;
        t.h += EDIT_STEP;
        break;
      case 'shorter':
        t.y += EDIT_STEP / 2;
        t.h -= EDIT_STEP;
        break;
      default:
        return;
    }
    stages[editStageIndex].target = normalizeTarget(t);
    updateEditorRect();
    saveCustomTargets();
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', 'readonly');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast(successMessage, 'note');
    } catch (error) {
      console.error(error);
      showToast('コピーに失敗しました', 'ng');
    }
  }

  function currentStageCode(index) {
    const stage = stages[index];
    const t = normalizeTarget(stage.target);
    return `{ src: '${stage.src}', target: { x: ${t.x.toFixed(3)}, y: ${t.y.toFixed(3)}, w: ${t.w.toFixed(3)}, h: ${t.h.toFixed(3)} } }`;
  }

  function allStagesCode() {
    return 'const stages = [\n  ' + stages.map((_, index) => currentStageCode(index)).join(',\n  ') + '\n];';
  }

  function resetCurrentTarget() {
    stages[editStageIndex].target = deepClone(defaultStages[editStageIndex].target);
    stages[editStageIndex].target = normalizeTarget(stages[editStageIndex].target);
    saveCustomTargets();
    updateEditorRect();
    showToast('この画像の当たり判定を初期値に戻しました', 'note');
  }


  function openHiddenEditor(index = 0) {
    stopBgm(true);
    openEditor(clamp(index, 0, stages.length - 1));
    showToast('編集モード', 'note');
  }

  function handleSecretTap() {
    clearTimeout(secretTapTimer);
    secretTapCount += 1;

    if (secretTapCount >= 7) {
      secretTapCount = 0;
      openHiddenEditor(0);
      return;
    }

    secretTapTimer = setTimeout(() => {
      secretTapCount = 0;
    }, 3500);
  }

  if (secretEditorTrigger) {
    secretEditorTrigger.addEventListener('click', handleSecretTap);
  }
  startButton.addEventListener('click', startCampaign);
  retryButton.addEventListener('click', startCampaign);
  stageSelectButton.addEventListener('click', () => setView('select'));
  hitboxEditButton.addEventListener('click', () => openEditor(0));
  stageEditButton.addEventListener('click', () => openEditor(0));
  resultEditButton.addEventListener('click', () => openEditor(stageIndex));
  resultStageSelectButton.addEventListener('click', () => { stopBgm(true); setView('select'); });
  stageBackButton.addEventListener('click', () => { stopBgm(true); setView('start'); });
  quitButton.addEventListener('click', () => { stopBgm(true); setView('start'); });
  imageShell.addEventListener('pointerup', handleTap);

  editorPrevButton.addEventListener('click', () => {
    editStageIndex = (editStageIndex - 1 + stages.length) % stages.length;
    loadEditorStage();
  });
  editorNextButton.addEventListener('click', () => {
    editStageIndex = (editStageIndex + 1) % stages.length;
    loadEditorStage();
  });
  editorBackButton.addEventListener('click', () => { stopBgm(true); setView('start'); });
  editorPlayButton.addEventListener('click', () => startSingleStage(editStageIndex));
  editorResetButton.addEventListener('click', resetCurrentTarget);
  editorCopyCurrentButton.addEventListener('click', () => copyText(currentStageCode(editStageIndex), `ステージ ${editStageIndex + 1} の座標をコピーしました`));
  editorCopyAllButton.addEventListener('click', () => copyText(allStagesCode(), '全画像の座標をコピーしました'));
  editorOverlay.addEventListener('pointerdown', beginDraw);
  editorOverlay.addEventListener('pointermove', moveDraw);
  editorOverlay.addEventListener('pointerup', endDraw);
  editorOverlay.addEventListener('pointercancel', endDraw);
  document.querySelector('.editor-controls-grid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit]');
    if (!button) return;
    tweakTarget(button.dataset.edit);
  });

  window.addEventListener('keydown', (event) => {
    const hiddenEditShortcut =
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'e';

    if (hiddenEditShortcut) {
      event.preventDefault();
      const currentIndex = gamePanel.classList.contains('hidden') ? 0 : stageIndex;
      openHiddenEditor(currentIndex);
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && !startPanel.classList.contains('hidden')) {
      event.preventDefault();
      startCampaign();
      return;
    }

    if (!editorPanel.classList.contains('hidden')) {
      if (event.key === 'ArrowUp') { event.preventDefault(); tweakTarget('up'); }
      if (event.key === 'ArrowDown') { event.preventDefault(); tweakTarget('down'); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); tweakTarget('left'); }
      if (event.key === 'ArrowRight') { event.preventDefault(); tweakTarget('right'); }
    }
  });

  loadCustomTargets();
  buildStageSelect();
})();
