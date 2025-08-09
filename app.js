// Japanese Playland — all-in-one JS
// Data packs: each item has {jp, romaji, en, type}
// Types can be 'kana', 'word', 'phrase' (for future filtering if needed)
const PACKS = {
  "Hiragana (a–to)": [
    {jp:"あ", romaji:"a", en:"a", type:"kana"},
    {jp:"い", romaji:"i", en:"i", type:"kana"},
    {jp:"う", romaji:"u", en:"u", type:"kana"},
    {jp:"え", romaji:"e", en:"e", type:"kana"},
    {jp:"お", romaji:"o", en:"o", type:"kana"},
    {jp:"か", romaji:"ka", en:"ka", type:"kana"},
    {jp:"き", romaji:"ki", en:"ki", type:"kana"},
    {jp:"く", romaji:"ku", en:"ku", type:"kana"},
    {jp:"け", romaji:"ke", en:"ke", type:"kana"},
    {jp:"こ", romaji:"ko", en:"ko", type:"kana"},
    {jp:"さ", romaji:"sa", en:"sa", type:"kana"},
    {jp:"し", romaji:"shi", en:"shi", type:"kana"},
    {jp:"す", romaji:"su", en:"su", type:"kana"},
    {jp:"せ", romaji:"se", en:"se", type:"kana"},
    {jp:"そ", romaji:"so", en:"so", type:"kana"},
  ],
  "Numbers & Colors": [
    {jp:"いち", romaji:"ichi", en:"one", type:"word"},
    {jp:"に", romaji:"ni", en:"two", type:"word"},
    {jp:"さん", romaji:"san", en:"three", type:"word"},
    {jp:"あか", romaji:"aka", en:"red", type:"word"},
    {jp:"あお", romaji:"ao", en:"blue", type:"word"},
    {jp:"きいろ", romaji:"kiiro", en:"yellow", type:"word"},
    {jp:"みどり", romaji:"midori", en:"green", type:"word"},
    {jp:"しろ", romaji:"shiro", en:"white", type:"word"},
    {jp:"くろ", romaji:"kuro", en:"black", type:"word"}
  ],
  "Animals (Fox • Cat • Unicorn!)": [
    {jp:"きつね", romaji:"kitsune", en:"fox", type:"word"},
    {jp:"ねこ", romaji:"neko", en:"cat", type:"word"},
    {jp:"ユニコーン", romaji:"yunikōn", en:"unicorn", type:"word"},
    {jp:"いぬ", romaji:"inu", en:"dog", type:"word"},
    {jp:"とり", romaji:"tori", en:"bird", type:"word"},
    {jp:"さかな", romaji:"sakana", en:"fish", type:"word"}
  ],
  "Friendly Phrases": [
    {jp:"こんにちは", romaji:"konnichiwa", en:"hello", type:"phrase"},
    {jp:"ありがとう", romaji:"arigatō", en:"thank you", type:"phrase"},
    {jp:"さようなら", romaji:"sayōnara", en:"goodbye", type:"phrase"},
    {jp:"おはよう", romaji:"ohayō", en:"good morning", type:"phrase"},
    {jp:"おねがいします", romaji:"onegaishimasu", en:"please", type:"phrase"},
    {jp:"ごめんなさい", romaji:"gomen nasai", en:"sorry", type:"phrase"}
  ]
};

// Simple sticker set (emojis themed to fox/cat/unicorn & friends)
const STICKERS = ["🦊","🐱","🦄","🌈","🎏","🍡","🎌","🍙","⭐️","🌟","💮","🎐"];

// --- State & helpers
const $ = (q, root=document)=>root.querySelector(q);
const $$ = (q, root=document)=>[...root.querySelectorAll(q)];

const state = {
  currentView: "home",
  flash: { packName: Object.keys(PACKS)[0], index: 0, flipped:false },
  match: { packName: Object.keys(PACKS)[0], solved:0, total:0 },
  listen: { packName: Object.keys(PACKS)[0], answer:null },
  voices: [],
  voiceId: null,
  rate: 0.9,
  autoSpeak: true,
  bigText: false,
  stickers: JSON.parse(localStorage.getItem("jp_playland_stickers")||"[]")
};

function saveSettings(){
  localStorage.setItem("jp_playland_voice", state.voiceId ?? "");
  localStorage.setItem("jp_playland_rate", String(state.rate));
  localStorage.setItem("jp_playland_auto", JSON.stringify(state.autoSpeak));
  localStorage.setItem("jp_playland_bigtext", JSON.stringify(state.bigText));
  localStorage.setItem("jp_playland_stickers", JSON.stringify(state.stickers));
}

// --- Router
function show(viewId){
  $$(".view").forEach(v=>v.classList.remove("view--active"));
  const view = $("#"+viewId);
  if(view){ view.classList.add("view--active"); state.currentView=viewId; }
}

// --- Populate pack selects
function fillPackSelects(){
  const packNames = Object.keys(PACKS);
  for(const id of ["flashPack","matchPack","listenPack"]){
    const sel = $("#"+id);
    sel.innerHTML = packNames.map(n=>`<option value="${n}">${n}</option>`).join("");
  }
  $("#flashPack").value = state.flash.packName;
  $("#matchPack").value = state.match.packName;
  $("#listenPack").value = state.listen.packName;
}

// --- TTS
function loadVoices(){
  const all = speechSynthesis.getVoices();
  // Prefer Japanese voices
  state.voices = all.filter(v=>v.lang && v.lang.toLowerCase().startsWith("ja"));
  const voiceSelect = $("#voiceSelect");
  voiceSelect.innerHTML = state.voices.length
    ? state.voices.map((v,i)=>`<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join("")
    : `<option value="">No Japanese voice found</option>`;

  const savedId = localStorage.getItem("jp_playland_voice");
  if(savedId){
    const found = state.voices.find(v=>v.voiceURI===savedId);
    if(found){ state.voiceId = found.voiceURI; voiceSelect.value = found.voiceURI; }
  }else if(state.voices[0]){
    state.voiceId = state.voices[0].voiceURI;
    voiceSelect.value = state.voiceId;
  }
}

function speak(text){
  if(!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  const rate = parseFloat(localStorage.getItem("jp_playland_rate")||state.rate);
  u.rate = rate;
  const vid = localStorage.getItem("jp_playland_voice") || state.voiceId;
  const chosen = state.voices.find(v=>v.voiceURI===vid);
  if(chosen){ u.voice = chosen; }
  speechSynthesis.cancel(); // ensure clean start
  speechSynthesis.speak(u);
}

// --- Flashcards
function renderFlashCard(){
  const pack = PACKS[state.flash.packName];
  const item = pack[state.flash.index % pack.length];
  const front = $(".flash__face--front");
  const back = $(".flash__face--back");
  front.innerHTML = `
    <p class="flash__word" aria-label="Japanese">${item.jp}</p>
    <p class="flash__romaji">${item.romaji}</p>
    <p class="flash__english">${item.en}</p>
  `;
  back.innerHTML = `
    <p class="flash__word" aria-label="Japanese back">${item.jp}</p>
    <p class="flash__romaji">${item.romaji}</p>
    <p class="flash__english">${item.en}</p>
  `;
  const card = $("#card");
  card.classList.toggle("is-flipped", state.flipped);
  if(state.autoSpeak) speak(item.jp);
}

function nextCard(delta){
  const pack = PACKS[state.flash.packName];
  state.flash.index = (state.flash.index + delta + pack.length) % pack.length;
  state.flipped = false;
  renderFlashCard();
}

function shufflePack(){
  const pack = PACKS[state.flash.packName];
  for(let i=pack.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [pack[i],pack[j]]=[pack[j],pack[i]];
  }
  state.flash.index = 0;
  state.flipped = false;
  renderFlashCard();
}

// --- Matching
function newMatchPuzzle(){
  const items = PACKS[state.match.packName].slice();
  const sample = items.sort(()=>Math.random()-0.5).slice(0, Math.min(6, items.length));
  const left = sample.map(s=>({key:s.jp, label:s.jp}));
  const right = sample.map(s=>({key:s.jp, label:s.en})).sort(()=>Math.random()-0.5);

  const board = $("#matchBoard");
  board.innerHTML = "";
  const leftCol = document.createElement("div");
  const rightCol = document.createElement("div");
  leftCol.style.display = rightCol.style.display = "grid";
  leftCol.style.gap = rightCol.style.gap = "12px";
  leftCol.style.gridTemplateColumns = rightCol.style.gridTemplateColumns = "1fr";

  left.forEach(item=>{
    const div = document.createElement("div");
    div.className="tile"; div.textContent=item.label;
    div.setAttribute("data-key", item.key);
    div.setAttribute("draggable","true");
    leftCol.appendChild(div);
  });

  right.forEach(item=>{
    const div = document.createElement("div");
    div.className="tile"; div.textContent=item.label;
    div.setAttribute("data-key", item.key);
    rightCol.appendChild(div);
  });

  board.appendChild(leftCol);
  board.appendChild(rightCol);

  // DnD
  let dragging = null;
  board.addEventListener("dragstart", (e)=>{
    const t = e.target.closest(".tile[draggable='true']");
    if(!t) return;
    dragging = t; t.classList.add("dragging");
    e.dataTransfer.setData("text/plain", t.getAttribute("data-key"));
  });
  board.addEventListener("dragend", ()=> dragging && dragging.classList.remove("dragging"));

  $$(".tile", rightCol).forEach(tile=>{
    tile.addEventListener("dragover", (e)=>{ e.preventDefault(); tile.classList.add("drop-target"); });
    tile.addEventListener("dragleave", ()=> tile.classList.remove("drop-target"));
    tile.addEventListener("drop", (e)=>{
      e.preventDefault();
      tile.classList.remove("drop-target");
      const leftKey = dragging?.getAttribute("data-key");
      const rightKey = tile.getAttribute("data-key");
      if(leftKey && rightKey && leftKey===rightKey){
        tile.textContent = "✅ " + tile.textContent;
        dragging.textContent = "🦊 Great!";
        dragging.setAttribute("draggable","false");
        dragging.style.opacity = .6;
        state.match.solved++;
        $("#matchStatus").textContent = `Matches: ${state.match.solved}/${sample.length}`;
        // reward when finished
        if(state.match.solved===sample.length){
          rewardSticker();
          $("#matchStatus").textContent += " — All matched! Sticker earned!";
        }
      }else{
        $("#matchStatus").textContent = "Not a match. Try again!";
      }
    });
  });

  state.match.solved = 0;
  state.match.total = sample.length;
  $("#matchStatus").textContent = `Matches: 0/${sample.length}`;
}

// --- Listening
function newListeningRound(){
  const items = PACKS[state.listen.packName];
  const choices = [...items].sort(()=>Math.random()-0.5).slice(0, Math.min(4, items.length));
  const answer = choices[Math.floor(Math.random()*choices.length)];
  state.listen.answer = answer;
  const wrap = $("#listenChoices");
  wrap.innerHTML = "";
  choices.forEach(c=>{
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = `${c.en}\n(${c.romaji})`;
    btn.addEventListener("click", ()=>{
      if(c.jp===state.listen.answer.jp){
        btn.classList.add("correct");
        $("#listenStatus").textContent = "Correct! 🎉";
        rewardSticker();
        setTimeout(()=>{ newListeningRound(); $("#listenStatus").textContent="New word!"; }, 900);
      }else{
        btn.classList.add("wrong");
        $("#listenStatus").textContent = "Oops, try again!";
      }
    });
    wrap.appendChild(btn);
  });
}

function playListening(){
  const a = state.listen.answer;
  if(!a){ newListeningRound(); }
  speak((a||state.listen.answer).jp);
}

// --- Stickers
function renderStickerWall(){
  const wall = $("#stickerWall");
  wall.innerHTML = state.stickers.map(s=>`<div class="sticker" title="Sticker">${s}</div>`).join("") || "<p>No stickers yet — play a game to earn one!</p>";
}

function rewardSticker(){
  const s = STICKERS[Math.floor(Math.random()*STICKERS.length)];
  state.stickers.push(s);
  saveSettings();
  renderStickerWall();
}

// --- Settings
function applyBigText(on){
  document.body.classList.toggle("bigtext", !!on);
}

// --- Init
function init(){
  fillPackSelects();
  // Restore settings
  state.autoSpeak = JSON.parse(localStorage.getItem("jp_playland_auto")||"true");
  state.bigText = JSON.parse(localStorage.getItem("jp_playland_bigtext")||"false");
  state.rate = parseFloat(localStorage.getItem("jp_playland_rate")||"0.9");
  $("#autoSpeakToggle").checked = state.autoSpeak;
  $("#bigTextToggle").checked = state.bigText;
  $("#rateRange").value = state.rate;
  applyBigText(state.bigText);

  // Views
  $$(".cardbtn").forEach(b=> b.addEventListener("click", ()=> show(b.dataset.view)));
  $$(".btn--back").forEach(b=> b.addEventListener("click", ()=> show("home")));

  // Settings
  const dlg = $("#settingsDlg");
  $("#btnSettings").addEventListener("click", ()=> dlg.showModal());
  $("#bigTextToggle").addEventListener("change", (e)=>{ state.bigText = e.target.checked; applyBigText(state.bigText); saveSettings(); });
  $("#autoSpeakToggle").addEventListener("change", (e)=>{ state.autoSpeak = e.target.checked; saveSettings(); });

  // Voice setup
  loadVoices();
  if (typeof speechSynthesis !== "undefined"){
    if(speechSynthesis.onvoiceschanged !== undefined){
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  $("#voiceSelect").addEventListener("change", (e)=>{
    state.voiceId = e.target.value || null;
    saveSettings();
  });
  $("#rateRange").addEventListener("input", (e)=>{
    state.rate = parseFloat(e.target.value);
    saveSettings();
  });

  // Flashcards wiring
  $("#flashPack").addEventListener("change", (e)=>{
    state.flash.packName = e.target.value; state.flash.index=0; state.flipped=false; renderFlashCard();
  });
  $("#card").addEventListener("click", ()=>{
    state.flipped = !state.flipped;
    $("#card").classList.toggle("is-flipped", state.flipped);
    if(state.autoSpeak){
      const pack = PACKS[state.flash.packName];
      const item = pack[state.flash.index % pack.length];
      speak(item.jp);
    }
  });
  $("#prevCard").addEventListener("click", ()=> nextCard(-1));
  $("#nextCard").addEventListener("click", ()=> nextCard(1));
  $("#speakCard").addEventListener("click", ()=>{
    const pack = PACKS[state.flash.packName];
    const item = pack[state.flash.index % pack.length];
    speak(item.jp);
  });
  $("#shuffleFlash").addEventListener("click", shufflePack);
  renderFlashCard();

  // Matching wiring
  $("#matchPack").addEventListener("change", (e)=>{ state.match.packName=e.target.value; newMatchPuzzle(); });
  $("#newMatch").addEventListener("click", newMatchPuzzle);
  newMatchPuzzle();

  // Listening wiring
  $("#listenPack").addEventListener("change", (e)=>{ state.listen.packName=e.target.value; newListeningRound(); });
  $("#playPrompt").addEventListener("click", playListening);
  newListeningRound();

  // Stickers
  renderStickerWall();
}

document.addEventListener("DOMContentLoaded", init);
