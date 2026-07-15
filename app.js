// app.js - Teaching App Controller

let currentUnit = null;
let currentSectionIdx = 0;
let currentQIdx = 0;
let reviewQuestions = [];
let reviewQIdx = 0;
let reviewScore = 0;
let reviewTotal = 0;

// Centralized mapping of Section IDs to metadata, to dynamically render names & icons without encoding issues
const SECTION_INFO = {
  'vocab-match': { name: '詞彙配合題', icon: '🔤', prefix: '一、' },
  'phrase-match': { name: '片語配合題', icon: '🔗', prefix: '二、' },
  'vocab-choice': { name: '詞彙選擇題', icon: '📝', prefix: '三、' },
  'vocab-usage': { name: '詞彙用法選擇題', icon: '🎯', prefix: '四、' },
  'phrase-choice': { name: '片語選擇題', icon: '🔵', prefix: '五、' },
  'grammar': { name: '文法選擇題', icon: '📐', prefix: '六、' },
  'word-class': { name: '詞類選擇題', icon: '🔠', prefix: '七、' }
};

// Formatting utility for questions to render underlines correctly
function formatQuestionText(text) {
  if (!text) return '';
  // Match underlines (e.g. "___" or " ___ ") and replace with styled span
  return text.replace(/\s*___\s*/g, ' <span class="blank-underline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> ');
}

// ---- HOME ----
function renderHome() {
  const grid = document.getElementById('unit-grid');
  if (!grid) return;
  grid.innerHTML = UNITS.map((u, i) => {
    // Collect tags from sections using SECTION_INFO
    const tagsHtml = u.sections.map(s => {
      const info = SECTION_INFO[s.id] || { name: s.id, icon: '' };
      return `<span class="tag">${info.icon} ${info.name}</span>`;
    }).join('');
    
    return `
      <div class="unit-card" onclick="openUnit(${i})">
        <div class="unit-num">第 ${u.id} 回</div>
        <div class="unit-title">${u.title}</div>
        <div class="unit-range">📌 ${u.range || 'p. ' + (u.id * 20 - 12) + ' ~ ' + (u.id * 20 - 1)}</div>
        <div class="unit-tags">${tagsHtml}</div>
        <div class="unit-arrow">→</div>
      </div>
    `;
  }).join('');
  document.getElementById('back-btn').onclick = goHome;
}

function goHome() { showPage('home-page'); }

// ---- UNIT ----
function openUnit(idx) {
  currentUnit = UNITS[idx];
  currentSectionIdx = 0;
  currentQIdx = 0;
  document.getElementById('top-bar-title').textContent = `第 ${currentUnit.id} 回 — ${currentUnit.title}`;
  renderSectionNav();
  renderCurrentSection();
  showPage('unit-page');
}

function renderSectionNav() {
  const nav = document.getElementById('section-nav');
  nav.innerHTML = currentUnit.sections.map((s, i) => {
    const info = SECTION_INFO[s.id] || { name: s.id, prefix: '' };
    return `<button class="sec-btn ${i===currentSectionIdx?'active':''}" onclick="jumpToSection(${i})">${info.prefix}${info.name}</button>`;
  }).join('') + `<button class="sec-btn" onclick="startReview()">🎮 複習遊戲</button>`;
}

function jumpToSection(idx) {
  currentSectionIdx = idx;
  currentQIdx = 0;
  renderSectionNav();
  renderCurrentSection();
}

function renderCurrentSection() {
  const s = currentUnit.sections[currentSectionIdx];
  if (s.id === 'vocab-match' || s.type === 'vocab-match') renderVocabMatchSlide(s);
  else if (s.id === 'phrase-match' || s.type === 'phrase-match') renderPhraseMatchSlide(s);
  else renderMCSlide(s);
}

// ---- MC SLIDE ----
function renderMCSlide(s) {
  const q = s.questions[currentQIdx];
  const total = s.questions.length;
  const pct = Math.round(((currentQIdx+1)/total)*100);
  const info = SECTION_INFO[s.id] || { name: s.id, icon: '', prefix: '' };
  
  const optHtml = q.options.map((opt, i) => `
    <button class="option-btn" id="opt-${i}" onclick="selectOption(${i})">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt.replace(/^\([A-Z]\)\s*/,'')}</span>
    </button>`).join('');
    
  const ansLetter = String.fromCharCode(65+q.answer);
  const ansText = q.options[q.answer].replace(/^\([A-Z]\)\s*/,'');

  document.getElementById('slide-container').innerHTML = `
    <div class="slide-area">
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="slide-header">
        <div class="slide-section-label">${info.icon} ${info.prefix}${info.name}</div>
        <div class="slide-progress-badge">${currentQIdx+1} / ${total}</div>
      </div>
      <div class="question-card">
        <div class="q-number-badge">${q.num || (currentQIdx+1)}</div>
        <div class="q-text">${formatQuestionText(q.text)}</div>
        <div class="options-grid">${optHtml}</div>
      </div>
      <div class="answer-panel" id="ans-panel">
        <div class="ans-label">✅ 正確答案</div>
        <div class="ans-correct">(${ansLetter}) ${ansText}</div>
        <div class="ans-explain">${(q.explanation || '').replace(/\n/g,'<br>')}</div>
        ${q.vocab ? `<div class="vocab-note">📚 ${q.vocab}</div>` : ''}
      </div>
      <div class="slide-nav">
        <button class="nav-btn" onclick="prevQ()" ${currentQIdx===0?'disabled':''}>← 上一題</button>
        <button class="reveal-btn" id="rev-btn" onclick="revealAnswer()">💡 顯示詳解</button>
        <button class="nav-btn primary" onclick="nextQ()">下一題 →</button>
      </div>
    </div>`;
}

// ---- VOCAB MATCH SLIDE ----
function renderVocabMatchSlide(s) {
  const q = s.questions[currentQIdx];
  const total = s.questions.length;
  const pct = Math.round(((currentQIdx+1)/total)*100);
  const info = SECTION_INFO[s.id] || { name: s.id, icon: '', prefix: '' };
  
  const optHtml = q.options.map((opt, i) => `
    <button class="option-btn" id="opt-${i}" onclick="selectOption(${i})">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt}</span>
    </button>`).join('');
    
  const ansLetter = String.fromCharCode(65+q.answer);

  document.getElementById('slide-container').innerHTML = `
    <div class="slide-area">
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="slide-header">
        <div class="slide-section-label">${info.icon} ${info.prefix}${info.name}</div>
        <div class="slide-progress-badge">${currentQIdx+1} / ${total}</div>
      </div>
      <div class="question-card">
        <div class="q-number-badge">${currentQIdx+1}</div>
        <div class="q-text" style="font-size:1.6em;font-weight:800;color:#60a5fa;letter-spacing:1px;">${q.en}</div>
        <div class="options-grid">${optHtml}</div>
      </div>
      <div class="answer-panel" id="ans-panel">
        <div class="ans-label">✅ 正確答案</div>
        <div class="ans-correct">(${ansLetter}) ${q.zh}</div>
        <div class="ans-explain"><b>${q.en}</b> = ${q.zh}</div>
      </div>
      <div class="slide-nav">
        <button class="nav-btn" onclick="prevQ()" ${currentQIdx===0?'disabled':''}>← 上一題</button>
        <button class="reveal-btn" id="rev-btn" onclick="revealAnswer()">💡 顯示答案</button>
        <button class="nav-btn primary" onclick="nextQ()">下一題 →</button>
      </div>
    </div>`;
}

// ---- PHRASE MATCH SLIDE ----
function renderPhraseMatchSlide(s) {
  const q = s.questions[currentQIdx];
  const total = s.questions.length;
  const pct = Math.round(((currentQIdx+1)/total)*100);
  const info = SECTION_INFO[s.id] || { name: s.id, icon: '', prefix: '' };
  
  const optHtml = q.options.map((opt, i) => `
    <button class="option-btn" id="opt-${i}" onclick="selectOption(${i})">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt}</span>
    </button>`).join('');
    
  const ansLetter = String.fromCharCode(65+q.answer);

  document.getElementById('slide-container').innerHTML = `
    <div class="slide-area">
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="slide-header">
        <div class="slide-section-label">${info.icon} ${info.prefix}${info.name}</div>
        <div class="slide-progress-badge">${currentQIdx+1} / ${total}</div>
      </div>
      <div class="question-card">
        <div class="q-number-badge">${currentQIdx+1}</div>
        <div class="q-text" style="font-size:1.5em;font-weight:700;color:#60a5fa;">${q.phrase}</div>
        <div class="options-grid">${optHtml}</div>
      </div>
      <div class="answer-panel" id="ans-panel">
        <div class="ans-label">✅ 正確答案</div>
        <div class="ans-correct">(${ansLetter}) ${q.meaning}</div>
        <div class="ans-explain"><b>${q.phrase}</b> = ${q.meaning}</div>
      </div>
      <div class="slide-nav">
        <button class="nav-btn" onclick="prevQ()" ${currentQIdx===0?'disabled':''}>← 上一題</button>
        <button class="reveal-btn" id="rev-btn" onclick="revealAnswer()">💡 顯示答案</button>
        <button class="nav-btn primary" onclick="nextQ()">下一題 →</button>
      </div>
    </div>`;
}

// ---- INTERACTIONS ----
function selectOption(idx) {
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById(`opt-${idx}`);
  if (btn) btn.classList.add('selected');
}

function revealAnswer() {
  const s = currentUnit.sections[currentSectionIdx];
  const q = s.questions[currentQIdx];
  const panel = document.getElementById('ans-panel');
  const revBtn = document.getElementById('rev-btn');
  if (panel) { panel.classList.add('show'); }
  if (revBtn) { revBtn.style.display = 'none'; }
  
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.onclick = null;
    if (i === q.answer) { btn.classList.add('correct'); }
    else if (btn.classList.contains('selected')) { btn.classList.add('wrong'); }
  });
}

function prevQ() {
  if (currentQIdx > 0) { currentQIdx--; renderCurrentSection(); }
}

function nextQ() {
  const s = currentUnit.sections[currentSectionIdx];
  if (currentQIdx < s.questions.length - 1) { currentQIdx++; renderCurrentSection(); }
  else { showSectionComplete(); }
}

function showSectionComplete() {
  const s = currentUnit.sections[currentSectionIdx];
  const info = SECTION_INFO[s.id] || { name: s.id };
  const nextSecIdx = currentSectionIdx + 1;
  const hasNext = nextSecIdx < currentUnit.sections.length;
  
  document.getElementById('slide-container').innerHTML = `
    <div class="slide-area">
      <div class="section-complete">
        <div class="icon">🎉</div>
        <h2>「${info.name}」完成！</h2>
        <p>恭喜完成本大題全部 ${s.questions.length} 題！<br>可進入下一大題或開始複習遊戲。</p>
        <div class="btn-row">
          ${hasNext ? `<button class="nav-btn primary" onclick="jumpToSection(${nextSecIdx})">下一大題 →</button>` : ''}
          <button class="reveal-btn" onclick="startReview()">🎮 複習遊戲</button>
          <button class="nav-btn" onclick="goHome()">🏠 首頁</button>
        </div>
      </div>
    </div>`;
}

// ---- REVIEW GAME ----
function startReview() {
  let pool = [];
  currentUnit.sections.forEach(sec => {
    if (!sec.questions) return;
    sec.questions.forEach(q => {
      if (q.options && q.answer !== undefined) {
        pool.push({
          ...q,
          _secId: sec.id
        });
      }
    });
  });
  
  reviewQuestions = shuffle(pool).slice(0, Math.min(10, pool.length));
  reviewQIdx = 0; reviewScore = 0; reviewTotal = reviewQuestions.length;
  renderSectionNav();
  renderReviewQuestion();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderReviewQuestion() {
  if (reviewQIdx >= reviewTotal) { renderFinish(); return; }
  const q = reviewQuestions[reviewQIdx];
  const pct = Math.round((reviewQIdx / reviewTotal) * 100);
  const info = SECTION_INFO[q._secId] || { name: '', icon: '' };

  const origIndices = [...Array(q.options.length).keys()];
  const shuffled = shuffle(origIndices);
  const correctShuffled = shuffled.indexOf(q.answer);

  const optHtml = shuffled.map((origIdx, i) => `
    <button class="game-opt" id="gopt-${i}" onclick="checkGameAnswer(${i},${correctShuffled})">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <span>${q.options[origIdx].replace(/^\([A-Z]\)\s*/,'')}</span>
    </button>`).join('');

  document.getElementById('slide-container').innerHTML = `
    <div class="review-area">
      <div class="game-hero">
        <div class="game-title">🎮 互動複習遊戲</div>
        <div class="score-row">
          <div class="score-box"><div class="score-val">${reviewQIdx+1}/${reviewTotal}</div><div class="score-lbl">進度</div></div>
          <div class="score-box"><div class="score-val" id="g-score">${reviewScore}</div><div class="score-lbl">得分</div></div>
        </div>
        <div class="progress-bar-track" style="margin-top:16px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="game-card">
        <div class="game-section-tag">${info.icon} ${info.name}</div>
        <div class="game-question">${formatQuestionText(q.text || q.en || q.phrase || '')}</div>
        <div class="game-options">${optHtml}</div>
        <div id="g-feedback"></div>
      </div>
    </div>`;
}

function checkGameAnswer(selIdx, corrIdx) {
  const opts = document.querySelectorAll('.game-opt');
  opts.forEach(b => { b.disabled = true; b.onclick = null; });
  const fb = document.getElementById('g-feedback');
  if (selIdx === corrIdx) {
    opts[selIdx].classList.add('correct');
    reviewScore++;
    if (fb) fb.innerHTML = `<div class="game-feedback fb-correct">🎉 答對了！+1 分</div>`;
  } else {
    opts[selIdx].classList.add('wrong');
    opts[corrIdx].classList.add('correct');
    if (fb) fb.innerHTML = `<div class="game-feedback fb-wrong">❌ 答錯了！正確是選項 ${String.fromCharCode(65+corrIdx)}</div>`;
  }
  setTimeout(() => { reviewQIdx++; renderReviewQuestion(); }, 1600);
}

function renderFinish() {
  const pct = Math.round((reviewScore / reviewTotal) * 100);
  const trophy = pct >= 80 ? '🏆' : pct >= 60 ? '🥈' : '📖';
  const msg = pct >= 80 ? '太棒了！掌握得很好！' : pct >= 60 ? '不錯！繼續加油！' : '再複習一次吧！';
  document.getElementById('slide-container').innerHTML = `
    <div class="review-area">
      <div class="finish-screen">
        <div class="finish-trophy">${trophy}</div>
        <div class="finish-h2">複習完成！</div>
        <div class="final-score">${reviewScore} / ${reviewTotal}</div>
        <div class="finish-msg">${msg}</div>
        <div class="finish-pct">正確率：${pct}%</div>
        <div class="btn-row">
          <button class="replay-btn" onclick="startReview()">🔄 再玩一次</button>
          <button class="nav-btn" style="padding:15px 28px;" onclick="jumpToSection(0)">📖 回到題目</button>
          <button class="nav-btn" style="padding:15px 28px;" onclick="goHome()">🏠 首頁</button>
        </div>
      </div>
    </div>`;
}

// ---- UTILS ----
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function showToast(msg, dur=2200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ---- BATTLE MULTIPLAYER ----
let peer = null;
let conn = null;
let isHost = false;
let battleQuestions = [];
let battleQIdx = 0;
let myBattleScore = 0;
let oppBattleScore = 0;
let hasAnsweredCurrent = false;
let myAnswerStatus = null;
let oppAnswerStatus = null;
let rematchVotes = { me: false, opp: false };

function loadPeerJS(callback) {
  if (window.Peer) {
    callback();
    return;
  }
  showToast("⏳ 正在加載連線模組...", 1500);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
  script.onload = () => {
    showToast("✅ 連線模組加載完成", 1500);
    callback();
  };
  script.onerror = () => {
    showToast("❌ 無法載入連線模組，請檢查網路連線", 3000);
  };
  document.body.appendChild(script);
}

function startBattle() {
  loadPeerJS(() => {
    showPage('battle-page');
    document.getElementById('battle-setup').style.display = 'block';
    document.getElementById('battle-game').style.display = 'none';
    document.getElementById('battle-result').style.display = 'none';
    
    document.getElementById('room-id-box').style.display = 'none';
    document.getElementById('waiting-msg').style.display = 'none';
    document.getElementById('opponent-room-id').value = '';
    document.getElementById('join-status').style.display = 'none';
    
    document.getElementById('btn-create-room').disabled = false;
    document.getElementById('btn-join-room').disabled = false;
    
    cleanupPeer();
  });
}

function createBattleRoom() {
  document.getElementById('btn-create-room').disabled = true;
  document.getElementById('waiting-msg').style.display = 'block';
  document.getElementById('waiting-msg').textContent = '🔑 正在向伺服器註冊房號...';
  
  isHost = true;
  cleanupPeer();
  
  const rId = 'nani-' + Math.floor(1000 + Math.random() * 9000);
  peer = new Peer(rId);
  
  peer.on('open', (id) => {
    document.getElementById('room-id-box').style.display = 'flex';
    document.getElementById('my-room-id').textContent = id;
    document.getElementById('waiting-msg').textContent = '⏳ 房號註冊成功！等待對手加入中...';
  });
  
  peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
  });
  
  peer.on('error', (err) => {
    console.error(err);
    document.getElementById('waiting-msg').textContent = '❌ 建立房間失敗，可能房號已被佔用，請重新嘗試。';
    document.getElementById('btn-create-room').disabled = false;
  });
}

function joinBattleRoom() {
  const roomInput = document.getElementById('opponent-room-id').value.trim();
  if (!roomInput) {
    showToast("⚠️ 請輸入對手的房間 ID");
    return;
  }
  
  document.getElementById('btn-join-room').disabled = true;
  const statusEl = document.getElementById('join-status');
  statusEl.style.display = 'block';
  statusEl.className = 'status-msg';
  statusEl.textContent = '⚡ 正在連線至對手房間...';
  
  isHost = false;
  cleanupPeer();
  
  peer = new Peer();
  
  peer.on('open', (id) => {
    conn = peer.connect(roomInput);
    setupConnection();
  });
  
  peer.on('error', (err) => {
    console.error(err);
    statusEl.className = 'status-msg error';
    statusEl.textContent = '❌ 連線失敗，請確認房間 ID 是否輸入正確，且對方在線上。';
    document.getElementById('btn-join-room').disabled = false;
  });
}

function setupConnection() {
  conn.on('open', () => {
    showToast("🎉 連線成功！對戰即將開始...", 2000);
    
    myBattleScore = 0;
    oppBattleScore = 0;
    battleQIdx = 0;
    rematchVotes = { me: false, opp: false };
    
    document.getElementById('my-battle-score').textContent = '0';
    document.getElementById('opp-battle-score').textContent = '0';
    
    if (isHost) {
      let pool = [];
      currentUnit.sections.forEach(sec => {
        if (!sec.questions) return;
        sec.questions.forEach(q => {
          if (q.options && q.answer !== undefined) {
            pool.push({
              text: q.text || q.en || q.phrase || '',
              options: q.options,
              answer: q.answer,
              vocab: q.vocab || '',
              explanation: q.explanation || '',
              _secId: sec.id
            });
          }
        });
      });
      
      let shuffled = shuffle(pool).slice(0, Math.min(10, pool.length));
      battleQuestions = shuffled;
      
      conn.send({
        type: 'START_GAME',
        questions: battleQuestions
      });
      
      enterBattleGame();
    }
  });
  
  conn.on('data', (data) => {
    if (data.type === 'START_GAME') {
      battleQuestions = data.questions;
      enterBattleGame();
    } else if (data.type === 'ANSWER_SUBMITTED') {
      oppAnswerStatus = data.isCorrect ? 'correct' : 'wrong';
      if (data.isCorrect) {
        oppBattleScore++;
        document.getElementById('opp-battle-score').textContent = oppBattleScore;
      }
      checkRoundProgress();
    } else if (data.type === 'NEXT_ROUND') {
      goToNextRound();
    } else if (data.type === 'REMATCH_VOTE') {
      rematchVotes.opp = true;
      checkRematchStatus();
    } else if (data.type === 'PEER_DISCONNECTED') {
      showToast("⚠️ 對手已中斷連線");
      exitBattle();
    }
  });
  
  conn.on('close', () => {
    showToast("🔌 連線已關閉");
    exitBattle();
  });
  
  conn.on('error', (err) => {
    showToast("❌ 連線錯誤: " + err);
    exitBattle();
  });
}

function enterBattleGame() {
  document.getElementById('battle-setup').style.display = 'none';
  document.getElementById('battle-result').style.display = 'none';
  document.getElementById('battle-game').style.display = 'block';
  
  renderBattleQuestion();
}

function renderBattleQuestion() {
  hasAnsweredCurrent = false;
  myAnswerStatus = null;
  oppAnswerStatus = null;
  
  document.getElementById('battle-q-idx').textContent = battleQIdx + 1;
  document.getElementById('battle-feedback').textContent = '';
  document.getElementById('battle-feedback').className = 'battle-feedback';
  
  const q = battleQuestions[battleQIdx];
  const qTextEl = document.getElementById('battle-q-text');
  qTextEl.innerHTML = formatQuestionText(q.text || q.en || q.phrase || '');
  
  const optGrid = document.getElementById('battle-options-grid');
  optGrid.innerHTML = q.options.map((opt, i) => `
    <button class="option-btn" id="bopt-${i}" onclick="selectBattleOption(${i})">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt.replace(/^\([A-Z]\)\s*/,'')}</span>
    </button>`).join('');
}

function selectBattleOption(selIdx) {
  if (hasAnsweredCurrent) return;
  hasAnsweredCurrent = true;
  
  const q = battleQuestions[battleQIdx];
  const isCorrect = (selIdx === q.answer);
  myAnswerStatus = isCorrect ? 'correct' : 'wrong';
  
  document.querySelectorAll('#battle-options-grid .option-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) {
      btn.classList.add('correct');
    } else if (i === selIdx) {
      btn.classList.add('wrong');
    }
  });
  
  const feedbackEl = document.getElementById('battle-feedback');
  if (isCorrect) {
    myBattleScore++;
    document.getElementById('my-battle-score').textContent = myBattleScore;
    feedbackEl.textContent = '🎉 答對了！+1 分';
    feedbackEl.className = 'battle-feedback correct';
  } else {
    feedbackEl.textContent = `❌ 答錯了！正確是選項 ${String.fromCharCode(65+q.answer)}`;
    feedbackEl.className = 'battle-feedback wrong';
  }
  
  conn.send({
    type: 'ANSWER_SUBMITTED',
    isCorrect: isCorrect
  });
  
  checkRoundProgress();
}

function checkRoundProgress() {
  if (myAnswerStatus !== null && oppAnswerStatus !== null) {
    setTimeout(() => {
      if (isHost) {
        goToNextRound();
        conn.send({ type: 'NEXT_ROUND' });
      }
    }, 1800);
  }
}

function goToNextRound() {
  battleQIdx++;
  if (battleQIdx < battleQuestions.length) {
    renderBattleQuestion();
  } else {
    showBattleResult();
  }
}

function showBattleResult() {
  document.getElementById('battle-game').style.display = 'none';
  document.getElementById('battle-result').style.display = 'block';
  
  document.getElementById('final-my-score').textContent = myBattleScore;
  document.getElementById('final-opp-score').textContent = oppBattleScore;
  
  const iconEl = document.getElementById('battle-result-icon');
  const titleEl = document.getElementById('battle-result-title');
  const msgEl = document.getElementById('battle-result-msg');
  
  if (myBattleScore > oppBattleScore) {
    iconEl.textContent = '🏆';
    titleEl.textContent = '你贏了！';
    msgEl.textContent = '表現卓越！太厲害了，掌握得非常完美！';
  } else if (myBattleScore < oppBattleScore) {
    iconEl.textContent = '💪';
    titleEl.textContent = '你輸了！';
    msgEl.textContent = '差了一點點，再加把勁，下次一定能贏！';
  } else {
    iconEl.textContent = '🤝';
    titleEl.textContent = '平手！';
    msgEl.textContent = '雙方勢均力敵，實力不分軒輊！';
  }
}

function rematchBattle() {
  if (rematchVotes.me) return;
  rematchVotes.me = true;
  showToast("⏳ 已發送再戰邀請，等待對手同意...");
  conn.send({ type: 'REMATCH_VOTE' });
  checkRematchStatus();
}

function checkRematchStatus() {
  if (rematchVotes.me && rematchVotes.opp) {
    showToast("⚔️ 雙方已同意，開始下一局對戰！", 1500);
    myBattleScore = 0;
    oppBattleScore = 0;
    battleQIdx = 0;
    rematchVotes = { me: false, opp: false };
    
    document.getElementById('my-battle-score').textContent = '0';
    document.getElementById('opp-battle-score').textContent = '0';
    
    if (isHost) {
      let pool = [];
      currentUnit.sections.forEach(sec => {
        if (!sec.questions) return;
        sec.questions.forEach(q => {
          if (q.options && q.answer !== undefined) {
            pool.push({
              text: q.text || q.en || q.phrase || '',
              options: q.options,
              answer: q.answer,
              vocab: q.vocab || '',
              explanation: q.explanation || '',
              _secId: sec.id
            });
          }
        });
      });
      battleQuestions = shuffle(pool).slice(0, Math.min(10, pool.length));
      conn.send({
        type: 'START_GAME',
        questions: battleQuestions
      });
      enterBattleGame();
    }
  }
}

function cleanupPeer() {
  if (conn) {
    try {
      conn.send({ type: 'PEER_DISCONNECTED' });
      conn.close();
    } catch(e) {}
    conn = null;
  }
  if (peer) {
    try { peer.destroy(); } catch(e) {}
    peer = null;
  }
}

function exitBattle() {
  cleanupPeer();
  showPage('unit-page');
}

function copyRoomId() {
  const rId = document.getElementById('my-room-id').textContent;
  if (!rId) return;
  
  navigator.clipboard.writeText(rId).then(() => {
    showToast("📋 房間 ID 已複製到剪貼簿！");
  }).catch(err => {
    console.error('Copy failed', err);
    showToast("📋 請手動複製房間 ID");
  });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('back-btn').onclick = goHome;
  renderHome();
});