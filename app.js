/* ============================================================
   KÉT BÍ MẬT v3.0 — Multi-Vault + Registration + Settings
   ============================================================ */

const ADMIN_PASSCODE = "0908";
const ADMIN_USERNAME = "admin";
const MAX_LENGTH = 4;
const STORAGE_KEY = "ket_bi_mat_v3";
const SESSION_KEY = "ket_bi_mat_session";

// Simple passcodes to block
const BLOCKED_PASSCODES = [
  "0000","1111","2222","3333","4444","5555","6666","7777","8888","9999",
  "1234","2345","3456","4567","5678","6789","0123",
  "9876","8765","7654","6543","5432","4321","3210"
];

// Random greeting messages
const GREETINGS = [
  "Có gì mới hôm nay? 🌸", "Khám phá két thôi! ✨", "Hôm nay thế nào? 💫",
  "Két bí mật đang chờ bạn 🔐", "Ghi chú gì mới nào! 📝", "Lưu giữ khoảnh khắc 🌷",
  "Hẹn gặp lại nhé! 🎀", "Một ngày tuyệt vời! ☀️", "Bí mật mới nè! 💗",
  "Cập nhật két nào! 🗂️", "Thêm gì vào két nè? 🌟"
];

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const openVaultBtn = $("#openVaultBtn");
const passwordModal = $("#passwordModal");
const registerModal = $("#registerModal");
const vaultPage = $("#vaultPage");
const homePage = $("#homePage");
const lockBtn = $("#lockBtn");
const dialogOverlay = $("#dialogOverlay");
const dialogBox = $("#dialogBox");

// Passcode step 1
const passcodeStep1 = $("#passcodeStep1");
const passcodeStep2 = $("#passcodeStep2");
const passwordInput = $("#passwordInput");
const passcodeDots = $("#passcodeDots");
const passcodeDotItems = passcodeDots.querySelectorAll("span");
const passcodeTitle = $("#passcodeTitle");
const passcodeSubtitle = $("#passcodeSubtitle");
const closeModalBtn = $("#closeModalBtn");
const deletePasswordBtn = $("#deletePasswordBtn");
const goRegisterBtn = $("#goRegisterBtn");

// Passcode step 2
const loginUsername = $("#loginUsername");
const loginBtn = $("#loginBtn");
const backToStep1 = $("#backToStep1");
const usernameSubtitle = $("#usernameSubtitle");

// Register
const closeRegisterBtn = $("#closeRegisterBtn");
const registerBtn = $("#registerBtn");
const regError = $("#regError");

// Vault
const greetingText = $("#greetingText");
const greetingBar = $("#greetingBar");
const greetingNormal = $("#greetingNormal");
const greetingSearch = $("#greetingSearch");
const searchInput = $("#searchInput");
const closeSearchBtn = $("#closeSearchBtn");
const searchResults = $("#searchResults");
const vaultCount = $("#vaultCount");
const vaultSubtitle = $("#vaultSubtitle");

// ===== STATE =====
let currentUsername = null;
let currentVaultData = null;
let currentFavFilter = "like";
let currentFavIcon = "favorite";
let currentFavColor = "";
let currentNoteIcon = "edit_note";
let currentNoteColor = "";
let currentNoteMedia = null;
let currentMoodEmoji = null;
let currentMoodLabel = "";
let currentMoodColor = "";
let matchedPasscode = null; // passcode entered in step 1
let greetingInterval = null;

// ===== LocalStorage =====
function getAllVaults() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
}
function saveAllVaults(v) { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); }
function getVault(username) { return getAllVaults()[username] || null; }
function saveVault(username, data) { const v = getAllVaults(); v[username] = data; saveAllVaults(v); }
function deleteVaultByUsername(username) { const v = getAllVaults(); delete v[username]; saveAllVaults(v); }

function findVaultByPasscode(passcode) {
  const vaults = getAllVaults();
  for (const key in vaults) {
    if (vaults[key].passcode === passcode) return { username: key, vault: vaults[key] };
  }
  return null;
}

function isPasscodeUsed(passcode) {
  const vaults = getAllVaults();
  for (const key in vaults) { if (vaults[key].passcode === passcode) return true; }
  return false;
}

function isUsernameUsed(username) { return !!getAllVaults()[username.toLowerCase()]; }

function createNewVault(username, fullName, passcode) {
  return {
    username: username, fullName: fullName, passcode: passcode,
    role: passcode === ADMIN_PASSCODE ? "admin" : "user",
    createdAt: new Date().toISOString(),
    favorites: { like: [], dislike: [] },
    info: { name: "", birthday: "", zodiac: "", color: "", song: "", movie: "", pet: "", extra: "" },
    notes: [], dates: [], moods: [],
    settings: { darkMode: false, rememberDuration: null }
  };
}

// Init admin
(function initAdmin() {
  const vaults = getAllVaults();
  if (!vaults[ADMIN_USERNAME]) {
    vaults[ADMIN_USERNAME] = createNewVault(ADMIN_USERNAME, "Admin", ADMIN_PASSCODE);
    saveAllVaults(vaults);
  }
})();

// ===== Session (Remember Login) =====
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch(e) { return null; }
}
function saveSession(username, durationMinutes) {
  let expiresAt;
  if (durationMinutes === "permanent") { expiresAt = "permanent"; }
  else { expiresAt = Date.now() + durationMinutes * 60 * 1000; }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, expiresAt }));
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function isSessionValid() {
  const s = getSession();
  if (!s) return null;
  if (s.expiresAt === "permanent") return s.username;
  if (Date.now() < s.expiresAt) return s.username;
  clearSession();
  return null;
}

// Auto-login on load
(function checkAutoLogin() {
  const username = isSessionValid();
  if (username) {
    const vault = getVault(username);
    if (vault) {
      currentUsername = username;
      currentVaultData = vault;
      // Apply dark mode first
      if (vault.settings && vault.settings.darkMode) {
        document.documentElement.setAttribute("data-theme", "dark");
      }
      setTimeout(() => {
        homePage.classList.add("hidden");
        vaultPage.classList.remove("hidden");
        vaultPage.classList.add("vault-enter");
        loadVaultUI();
        setTimeout(() => vaultPage.classList.remove("vault-enter"), 500);
      }, 300);
    }
  }
})();

// ===== Passcode UI =====
function updateDots() {
  const len = passwordInput.value.length;
  passcodeDotItems.forEach((d, i) => {
    d.classList.toggle("filled", i < len);
  });
}

function resetPasscodeUI() {
  passwordInput.value = "";
  updateDots();
  passcodeTitle.textContent = "Nhập mật mã";
  passcodeSubtitle.textContent = "";
  usernameSubtitle.textContent = "";
  loginUsername.value = "";
  matchedPasscode = null;
  passcodeStep1.classList.remove("hidden");
  passcodeStep2.classList.add("hidden");
}

function openPasscodeModal() {
  passwordModal.classList.remove("hidden");
  resetPasscodeUI();
}

function closePasscodeModal() {
  passwordModal.classList.add("hidden");
  resetPasscodeUI();
}

function shakeDots() {
  passcodeDots.classList.add("shake");
  setTimeout(() => { passcodeDots.classList.remove("shake"); passwordInput.value = ""; updateDots(); }, 450);
}

function handlePasscodeComplete() {
  const entered = passwordInput.value;
  const found = findVaultByPasscode(entered);

  if (!found) {
    passcodeSubtitle.textContent = "Bạn chưa có két, hãy đăng ký ngay! 💗";
    shakeDots();
    return;
  }

  // Passcode matched - go to step 2 (username)
  matchedPasscode = entered;
  passcodeStep1.classList.add("hidden");
  passcodeStep2.classList.remove("hidden");
  usernameSubtitle.textContent = "";
  loginUsername.value = "";
  setTimeout(() => loginUsername.focus(), 100);
}

function handleLogin() {
  const enteredUsername = loginUsername.value.trim().toLowerCase();
  if (!enteredUsername) {
    usernameSubtitle.textContent = "Vui lòng nhập tên đăng nhập!";
    return;
  }

  const vault = getVault(enteredUsername);
  if (vault && vault.passcode === matchedPasscode) {
    currentUsername = enteredUsername;
    currentVaultData = vault;

    // Apply dark mode
    if (currentVaultData.settings && currentVaultData.settings.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    enterVault();
  } else {
    usernameSubtitle.textContent = "Tên đăng nhập không đúng!";
    loginUsername.value = "";
  }
}

// ===== Registration =====
function openRegister() {
  passwordModal.classList.add("hidden");
  registerModal.classList.remove("hidden");
  clearRegForm();
}

function closeRegister() {
  registerModal.classList.add("hidden");
  passwordModal.classList.remove("hidden");
  resetPasscodeUI();
}

function clearRegForm() {
  $("#regFullName").value = "";
  $("#regUsername").value = "";
  $("#regPasscode").value = "";
  $("#regPasscodeConfirm").value = "";
  regError.textContent = "";
}

function handleRegister() {
  const fullName = $("#regFullName").value.trim();
  const username = $("#regUsername").value.trim().toLowerCase();
  const passcode = $("#regPasscode").value;
  const confirm = $("#regPasscodeConfirm").value;

  // Validate
  if (!fullName) { regError.textContent = "Vui lòng nhập họ và tên!"; return; }
  if (!username) { regError.textContent = "Vui lòng nhập tên đăng nhập!"; return; }
  if (username.length < 2) { regError.textContent = "Tên đăng nhập phải có ít nhất 2 ký tự!"; return; }
  const usernameTaken = isUsernameUsed(username);
  const passcodeTaken = isPasscodeUsed(passcode);
  if (usernameTaken && passcodeTaken) { regError.textContent = "Tên đăng nhập và mật mã đã được sử dụng. Hãy chọn tên đăng nhập và mật mã khác."; return; }
  if (usernameTaken) { regError.textContent = "Tên đăng nhập đã được sử dụng!"; return; }
  if (passcode.length !== 4 || !/^\d{4}$/.test(passcode)) { regError.textContent = "Mật mã phải là 4 chữ số!"; return; }
  if (BLOCKED_PASSCODES.includes(passcode)) { regError.textContent = "Mật mã quá đơn giản, hãy chọn mật mã khác!"; return; }
  if (passcode !== confirm) { regError.textContent = "Mật mã nhập lại không khớp!"; return; }

  // Create vault
  const vault = createNewVault(username, fullName, passcode);
  saveVault(username, vault);

  // Success — go back to login
  regError.textContent = "";
  registerModal.classList.add("hidden");
  passwordModal.classList.remove("hidden");
  resetPasscodeUI();
  passcodeSubtitle.textContent = "Tạo két thành công! Đăng nhập ngay 💗";
}

// ===== Enter / Exit Vault =====
function enterVault() {
  const screen = $(".phone-screen");
  const heart = document.createElement("div");
  heart.className = "unlock-heart";
  heart.innerHTML = "<span>💗</span>";
  screen.appendChild(heart);

  passwordModal.classList.add("modal-exit");
  homePage.classList.add("home-exit");

  setTimeout(() => {
    passwordModal.classList.add("hidden");
    passwordModal.classList.remove("modal-exit");
    homePage.classList.add("hidden");
    homePage.classList.remove("home-exit");
    vaultPage.classList.remove("hidden");
    vaultPage.classList.add("vault-enter");
    resetPasscodeUI();
    loadVaultUI();
  }, 320);

  setTimeout(() => {
    vaultPage.classList.remove("vault-enter");
    if (heart.parentNode) heart.remove();
  }, 900);
}

function lockVault() {
  if (currentUsername && currentVaultData) saveVault(currentUsername, currentVaultData);

  // Check if remember login is active — if not, clear session
  if (!currentVaultData || !currentVaultData.settings || !currentVaultData.settings.rememberDuration) {
    clearSession();
  }

  vaultPage.classList.add("hidden");
  homePage.classList.remove("hidden");
  passwordModal.classList.add("hidden");
  registerModal.classList.add("hidden");
  dialogOverlay.classList.add("hidden");

  // Reset dark mode to default
  document.documentElement.removeAttribute("data-theme");

  currentUsername = null;
  currentVaultData = null;
  resetPasscodeUI();
  stopGreetingRotation();
  closeSearch();
}

// ===== Load Vault UI =====
function loadVaultUI() {
  if (!currentVaultData) return;

  // Scroll to top
  $(".vault-app").scrollTop = 0;

  // Greeting
  showRandomGreeting();
  startGreetingRotation();

  // Subtitle
  const name = currentVaultData.info && currentVaultData.info.name ? currentVaultData.info.name : currentVaultData.fullName;
  vaultSubtitle.textContent = "Két của " + name;

  // Account info in settings
  $("#accountName").textContent = currentVaultData.fullName;
  $("#accountUsername").textContent = "@" + currentVaultData.username;
  $("#accountPasscode").textContent = currentVaultData.passcode;
  $("#accountRole").textContent = currentVaultData.role === "admin" ? "👑 Admin" : "👤 User";

  // Dark mode toggle
  const toggle = $("#darkModeToggle");
  if (currentVaultData.settings && currentVaultData.settings.darkMode) {
    toggle.classList.add("active");
  } else {
    toggle.classList.remove("active");
  }

  // Admin panel
  if (currentVaultData.role === "admin") {
    $("#adminPanel").classList.remove("hidden");
    renderAdminPanel();
  } else {
    $("#adminPanel").classList.add("hidden");
  }

  // Initial tab
  switchTab("favorites");

  // Render all data
  renderFavorites();
  loadInfoFields();
  renderNotes();
  renderDates();
  renderMoods();
  updateTotalCount();
}

// ===== Greeting Rotation =====
function showRandomGreeting() {
  greetingText.textContent = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}
function startGreetingRotation() {
  stopGreetingRotation();
  greetingInterval = setInterval(showRandomGreeting, 5 * 60 * 1000); // 5 min
}
function stopGreetingRotation() {
  if (greetingInterval) { clearInterval(greetingInterval); greetingInterval = null; }
}

// ===== Search =====
function openSearch() {
  greetingNormal.classList.add("hidden");
  greetingSearch.classList.remove("hidden");
  searchInput.value = "";
  searchInput.focus();
}

function closeSearch() {
  greetingNormal.classList.remove("hidden");
  greetingSearch.classList.add("hidden");
  searchResults.classList.add("hidden");
  searchInput.value = "";
}

function performSearch(query) {
  if (!query.trim() || !currentVaultData) { searchResults.classList.add("hidden"); return; }
  const q = query.toLowerCase();
  const results = [];
  const now = new Date().toLocaleString("vi-VN");

  // Search favorites
  (currentVaultData.favorites.like || []).forEach(f => {
    const text = typeof f === "string" ? f : f.text;
    if (text && text.toLowerCase().includes(q)) results.push({ text, type: "💗 Sở thích", time: now });
  });
  (currentVaultData.favorites.dislike || []).forEach(f => {
    const text = typeof f === "string" ? f : f.text;
    if (text && text.toLowerCase().includes(q)) results.push({ text, type: "🤍 Không thích", time: now });
  });

  // Search info
  const info = currentVaultData.info || {};
  Object.values(info).forEach(val => {
    if (val && val.toLowerCase && val.toLowerCase().includes(q)) results.push({ text: val, type: "📋 Thông tin", time: now });
  });

  // Search notes
  (currentVaultData.notes || []).forEach(n => {
    if (n.text.toLowerCase().includes(q)) results.push({ text: n.text, type: "📝 Ghi chú", time: formatDate(n.createdAt) });
  });

  // Search dates
  (currentVaultData.dates || []).forEach(d => {
    if (d.title.toLowerCase().includes(q)) results.push({ text: d.title, type: "📅 Ngày", time: formatDateShort(d.date) });
  });

  // Render
  searchResults.classList.remove("hidden");
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-empty">Không tìm thấy kết quả nào 😢</div>';
  } else {
    searchResults.innerHTML = results.map(r =>
      '<div class="search-result-item">' +
        '<span class="search-result-text">' + escapeHtml(r.text) + '</span>' +
        '<span class="search-result-meta"><span class="search-result-type">' + r.type + '</span><br>' + r.time + '</span>' +
      '</div>'
    ).join("");
  }
}

// ===== Tab Switching =====
function switchTab(tabName) {
  $$(".tab-content").forEach(c => c.classList.toggle("active", c.dataset.tabContent === tabName));
  $$(".bottom-item").forEach(i => i.classList.toggle("active", i.dataset.nav === tabName));
}

// ===== Count =====
function updateTotalCount() {
  if (!currentVaultData) return;
  const f = (currentVaultData.favorites.like||[]).length + (currentVaultData.favorites.dislike||[]).length;
  const n = (currentVaultData.notes||[]).length;
  const d = (currentVaultData.dates||[]).length;
  const m = (currentVaultData.moods||[]).length;
  vaultCount.textContent = f + n + d + m;
}

// ===== FAVORITES =====
function renderFavorites() {
  const list = $("#favList");
  const label = $("#favSectionLabel");
  const items = currentVaultData.favorites[currentFavFilter] || [];
  list.innerHTML = "";
  label.textContent = currentFavFilter === "like" ? "Những thứ em thích" : "Những thứ em không thích";
  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">favorite_border</i><p>Chưa có gì ở đây cả...</p></div>';
    return;
  }
  items.forEach((item, i) => {
    const data = typeof item === "string" ? { text: item, icon: currentFavFilter === "like" ? "favorite" : "heart_broken", color: "" } : item;
    const card = document.createElement("div");
    card.className = "memory-card-item";
    card.innerHTML =
      '<div class="memory-accent"></div><div class="memory-left"><div class="memory-emoji"' + (data.color ? ' style="color:' + data.color + '"' : '') + '><i class="material-symbols-rounded">' +
      (data.icon || (currentFavFilter === "like" ? "favorite" : "heart_broken")) + '</i></div><div><div class="memory-text">' +
      escapeHtml(data.text) + '</div><div class="memory-meta">' + (currentFavFilter === "like" ? "💗 Thích" : "🤍 Không thích") +
      '</div></div></div><button class="delete-btn" type="button" data-type="fav" data-index="'+i+'"><i class="material-symbols-rounded">close</i></button>';
    list.appendChild(card);
  });
  updateTotalCount();
}

function addFavorite(text) {
  if (!text.trim()||!currentVaultData) return;
  currentVaultData.favorites[currentFavFilter].push({
    text: text.trim(),
    icon: currentFavIcon,
    color: currentFavColor
  });
  saveVault(currentUsername, currentVaultData);
  renderFavorites();
}

function deleteFavorite(i) {
  currentVaultData.favorites[currentFavFilter].splice(i,1);
  saveVault(currentUsername, currentVaultData);
  renderFavorites();
}

// ===== INFO =====
function loadInfoFields() {
  if (!currentVaultData) return;
  const info = currentVaultData.info || {};
  $("#infoName").value = info.name||"";
  $("#infoBirthday").value = info.birthday||"";
  $("#infoZodiac").value = info.zodiac||"";
  $("#infoColor").value = info.color||"";
  $("#infoSong").value = info.song||"";
  $("#infoMovie").value = info.movie||"";
  $("#infoPet").value = info.pet||"";
  $("#infoExtra").value = info.extra||"";
}

function saveInfo() {
  if (!currentVaultData) return;
  currentVaultData.info = {
    name:$("#infoName").value, birthday:$("#infoBirthday").value,
    zodiac:$("#infoZodiac").value, color:$("#infoColor").value,
    song:$("#infoSong").value, movie:$("#infoMovie").value,
    pet:$("#infoPet").value, extra:$("#infoExtra").value
  };
  saveVault(currentUsername, currentVaultData);
  if (currentVaultData.info.name) vaultSubtitle.textContent = "Két của " + currentVaultData.info.name;
  const btn = $("#saveInfoBtn");
  btn.classList.add("saved");
  btn.innerHTML = '<i class="material-symbols-rounded">check</i> Đã lưu! 💗';
  setTimeout(() => { btn.classList.remove("saved"); btn.innerHTML = '<i class="material-symbols-rounded">check</i> Lưu thông tin'; }, 1500);
}

// ===== NOTES =====
function renderNotes() {
  const list = $("#noteList");
  const notes = currentVaultData.notes||[];
  list.innerHTML = "";
  if (!notes.length) { list.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">edit_note</i><p>Chưa có ghi chú nào...</p></div>'; return; }
  notes.forEach((n,i) => {
    const note = typeof n === "string" ? { text: n, icon: currentNoteIcon, color: "", media: null, createdAt: new Date().toISOString() } : n;
    const c = document.createElement("div");
    c.className = "note-card";
    let mediaHtml = "";
    if (note.media) {
      if (note.media.type === "video") {
        mediaHtml = '<div class="note-media"><video src="'+note.media.url+'" controls muted playsinline></video></div>';
      } else {
        mediaHtml = '<div class="note-media"><img src="'+note.media.url+'" alt="Ghi chú" /></div>';
      }
    }
    c.innerHTML =
      '<div class="note-card-left"' + (note.color ? ' style="color:' + note.color + '"' : '') + '>' +
        '<div class="note-card-icon"><i class="material-symbols-rounded">'+(note.icon||'edit_note')+'</i></div>' +
      '</div>' +
      '<div class="note-content">' +
        '<div class="note-text">'+escapeHtml(note.text)+'</div>' +
        (note.label ? '<div class="note-note">'+escapeHtml(note.label)+'</div>' : '') +
        (note.note ? '<div class="note-small">'+escapeHtml(note.note)+'</div>' : '') +
        mediaHtml +
        '<div class="note-time">'+formatDate(note.createdAt)+'</div>' +
      '</div>' +
      '<button class="delete-btn" type="button" data-type="note" data-index="'+i+'"><i class="material-symbols-rounded">close</i></button>';
    list.appendChild(c);
  });
  updateTotalCount();
}
function addNote(text) {
  if (!text.trim() || !currentVaultData) return;
  currentVaultData.notes.unshift({
    text: text.trim(),
    icon: currentNoteIcon,
    color: currentNoteColor,
    note: "",
    label: "",
    media: currentNoteMedia ? { ...currentNoteMedia } : null,
    createdAt: new Date().toISOString()
  });
  saveVault(currentUsername, currentVaultData);
  renderNotes();
  currentNoteMedia = null;
  resetNoteMediaPreview();
}
function deleteNote(i) { currentVaultData.notes.splice(i,1); saveVault(currentUsername,currentVaultData); renderNotes(); }

function resetNoteMediaPreview() {
  const preview = $("#noteMediaPreview");
  const container = $("#noteMediaContainer");
  container.innerHTML = "";
  preview.classList.add("hidden");
  $("#noteFileInput").value = "";
}
function renderNoteMediaPreview(fileType, url) {
  const preview = $("#noteMediaPreview");
  const container = $("#noteMediaContainer");
  container.innerHTML = "";
  if (!url) { preview.classList.add("hidden"); return; }
  if (fileType === "video") {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    container.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Preview";
    container.appendChild(img);
  }
  preview.classList.remove("hidden");
}

// ===== DATES =====
function renderDates() {
  const list = $("#dateList");
  const dates = currentVaultData.dates||[];
  list.innerHTML = "";
  if (!dates.length) { list.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">calendar_month</i><p>Chưa có ngày quan trọng nào...</p></div>'; return; }
  dates.forEach((d,i) => {
    const c = document.createElement("div");
    c.className = "date-card";
    c.innerHTML = '<div class="date-info"><div class="date-title">'+escapeHtml(d.title)+'</div><div class="date-value">'+formatDateShort(d.date)+'</div></div><div class="date-countdown">'+getCountdown(d.date)+'</div><button class="delete-btn" type="button" data-type="date" data-index="'+i+'"><i class="material-symbols-rounded">close</i></button>';
    list.appendChild(c);
  });
  updateTotalCount();
}
function addDate(t,d) { if(!t.trim()||!d||!currentVaultData)return; currentVaultData.dates.push({title:t.trim(),date:d}); saveVault(currentUsername,currentVaultData); renderDates(); }
function deleteDate(i) { currentVaultData.dates.splice(i,1); saveVault(currentUsername,currentVaultData); renderDates(); }
function getCountdown(ds) { const t=new Date(ds),td=new Date(); t.setHours(0,0,0,0); td.setHours(0,0,0,0); const diff=Math.round((t-td)/(864e5)); if(diff===0)return"Hôm nay! 🎉"; return diff>0?"Còn "+diff+" ngày":Math.abs(diff)+" ngày trước"; }

// ===== MOODS =====
function renderMoods() {
  const log = $("#moodLog");
  const moods = currentVaultData.moods||[];
  log.innerHTML = "";
  $$(".mood-btn").forEach(b => b.classList.remove("selected"));
  const today = new Date().toDateString();
  const todayMood = moods.find(m => new Date(m.date).toDateString()===today);
  if (todayMood) $$(".mood-btn").forEach(b => { if(b.dataset.mood===todayMood.emoji) b.classList.add("selected"); });
  if (!moods.length) { log.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">mood</i><p>Chưa có tâm trạng nào...</p></div>'; return; }
  moods.slice(0,30).forEach((m,i) => {
    const c = document.createElement("div");
    c.className = "mood-card";
    c.innerHTML =
      '<div class="mood-card-left"><div class="mood-card-emoji">'+m.emoji+'</div><div><div class="mood-card-date">'+formatDate(m.date)+'</div>' +
      (m.label ? '<div class="mood-card-label">'+escapeHtml(m.label)+'</div>' : '') +
      '</div></div>' +
      '<div class="mood-card-right">' +
        (m.note ? '<div class="mood-card-note">'+escapeHtml(m.note)+'</div>' : '') +
        '<button class="delete-btn" type="button" data-type="mood" data-index="'+i+'"><i class="material-symbols-rounded">close</i></button>' +
      '</div>';
    if (m.color) c.style.setProperty('--mood-card-color', m.color);
    log.appendChild(c);
  });
  updateTotalCount();
}
function addMood(emoji, options = {}) {
  if (!currentVaultData || !emoji) return;
  const today = new Date().toDateString();
  const idx = currentVaultData.moods.findIndex(m => new Date(m.date).toDateString() === today);
  const moodEntry = {
    emoji,
    date: new Date().toISOString(),
    label: options.label || "",
    note: options.note || "",
    color: options.color || ""
  };
  if (idx >= 0) {
    currentVaultData.moods[idx] = { ...currentVaultData.moods[idx], ...moodEntry };
  } else {
    currentVaultData.moods.unshift(moodEntry);
  }
  saveVault(currentUsername, currentVaultData);
  renderMoods();
}
function deleteMood(i) {
  if (!currentVaultData) return;
  currentVaultData.moods.splice(i,1);
  saveVault(currentUsername,currentVaultData);
  renderMoods();
}

// ===== ADMIN PANEL =====
function renderAdminPanel() {
  const container = $("#adminVaultList");
  const vaults = getAllVaults();
  container.innerHTML = "";
  const keys = Object.keys(vaults);
  if (!keys.length) { container.innerHTML = '<div class="empty-state"><p>Chưa có két nào.</p></div>'; return; }
  keys.forEach(key => {
    const v = vaults[key];
    const fc = ((v.favorites&&v.favorites.like)||[]).length + ((v.favorites&&v.favorites.dislike)||[]).length;
    const nc = (v.notes||[]).length, dc = (v.dates||[]).length, mc = (v.moods||[]).length;
    let html =
      '<div class="admin-vault-header"><span class="admin-vault-passcode">'+v.passcode+'</span><span class="admin-vault-role">'+(v.role==="admin"?"👑 Admin":"User")+'</span></div>' +
      '<div class="admin-vault-name">'+escapeHtml(v.fullName)+' (@'+escapeHtml(v.username)+')</div>' +
      '<div class="admin-vault-stats"><span class="admin-stat">❤️ <strong>'+fc+'</strong></span><span class="admin-stat">📝 <strong>'+nc+'</strong></span><span class="admin-stat">📅 <strong>'+dc+'</strong></span><span class="admin-stat">😊 <strong>'+mc+'</strong></span></div>';

    html += '<div class="admin-vault-data">';
    if(v.info&&v.info.name){html+='<div class="admin-data-label">Thông tin</div><div class="admin-data-items">';if(v.info.name)html+='<span class="admin-data-chip">'+escapeHtml(v.info.name)+'</span>';if(v.info.birthday)html+='<span class="admin-data-chip">🎂'+formatDateShort(v.info.birthday)+'</span>';html+='</div>';}
    if(v.favorites&&v.favorites.like&&v.favorites.like.length){html+='<div class="admin-data-label">💗 Thích</div><div class="admin-data-items">'; v.favorites.like.forEach(f=>{html+='<span class="admin-data-chip">'+escapeHtml(f)+'</span>';}); html+='</div>';}
    if(v.favorites&&v.favorites.dislike&&v.favorites.dislike.length){html+='<div class="admin-data-label">🤍 Không thích</div><div class="admin-data-items">'; v.favorites.dislike.forEach(f=>{html+='<span class="admin-data-chip">'+escapeHtml(f)+'</span>';}); html+='</div>';}
    if(v.notes&&v.notes.length){html+='<div class="admin-data-label">📝 Ghi chú</div><div class="admin-data-items">'; v.notes.forEach(n=>{html+='<span class="admin-data-chip">'+escapeHtml(n.text)+'</span>';}); html+='</div>';}
    html += '</div>';

    const card = document.createElement("div");
    card.className = "admin-vault-card";
    card.innerHTML = html;
    card.addEventListener("click", () => showAdminVaultDetails(v));
    container.appendChild(card);
  });
}

function showAdminVaultDetails(vault) {
  let html = '<h3>Thông tin tài khoản</h3>';
  html += '<div class="dialog-info"><strong>Họ và tên:</strong> ' + escapeHtml(vault.fullName) + '</div>';
  html += '<div class="dialog-info"><strong>Tên đăng nhập:</strong> @' + escapeHtml(vault.username) + '</div>';
  html += '<div class="dialog-info"><strong>Mật mã:</strong> ' + escapeHtml(vault.passcode) + '</div>';
  html += '<div class="dialog-info"><strong>Vai trò:</strong> ' + (vault.role === "admin" ? "👑 Admin" : "👤 User") + '</div>';
  html += '<div class="dialog-info"><strong>Ngày tạo:</strong> ' + formatDate(vault.createdAt) + '</div>';
  if (vault.info) {
    html += '<div class="dialog-info"><strong>Thông tin cá nhân:</strong></div>';
    html += '<div class="dialog-smaller">' + (vault.info.name ? 'Tên: ' + escapeHtml(vault.info.name) + '<br>' : '') +
            (vault.info.birthday ? 'Sinh nhật: ' + formatDateShort(vault.info.birthday) + '<br>' : '') +
            (vault.info.zodiac ? 'Cung: ' + escapeHtml(vault.info.zodiac) + '<br>' : '') +
            (vault.info.color ? 'Màu yêu thích: ' + escapeHtml(vault.info.color) + '<br>' : '') +
            (vault.info.song ? 'Bài hát: ' + escapeHtml(vault.info.song) + '<br>' : '') +
            (vault.info.movie ? 'Phim: ' + escapeHtml(vault.info.movie) + '<br>' : '') +
            (vault.info.pet ? 'Thú cưng: ' + escapeHtml(vault.info.pet) + '<br>' : '') +
            (vault.info.extra ? 'Ghi chú: ' + escapeHtml(vault.info.extra) : '') + '</div>';
  }
  const likeItems = (vault.favorites && vault.favorites.like) || [];
  const dislikeItems = (vault.favorites && vault.favorites.dislike) || [];
  html += '<div class="dialog-info"><strong>Thích (' + likeItems.length + '):</strong> ' + (likeItems.length ? escapeHtml(likeItems.slice(0,8).map(i => typeof i==='string'? i : i.text).join(', ')) : 'Không có') + '</div>';
  html += '<div class="dialog-info"><strong>Không thích (' + dislikeItems.length + '):</strong> ' + (dislikeItems.length ? escapeHtml(dislikeItems.slice(0,8).map(i => typeof i==='string'? i : i.text).join(', ')) : 'Không có') + '</div>';
  html += '<div class="dialog-info"><strong>Ghi chú:</strong> ' + ((vault.notes && vault.notes.length) ? vault.notes.length + ' mục' : 'Không có') + '</div>';
  html += '<div class="dialog-info"><strong>Ngày:</strong> ' + ((vault.dates && vault.dates.length) ? vault.dates.length + ' mục' : 'Không có') + '</div>';
  html += '<div class="dialog-info"><strong>Tâm trạng:</strong> ' + ((vault.moods && vault.moods.length) ? vault.moods.length + ' mục' : 'Không có') + '</div>';
  html += '<div class="dialog-actions"><button class="dialog-secondary" id="dlgCloseAdmin">Đóng</button></div>';
  dialogBox.innerHTML = html;
  dialogOverlay.classList.remove("hidden");
  $("#dlgCloseAdmin").onclick = () => dialogOverlay.classList.add("hidden");
}

// ===== SETTINGS: Dark Mode =====
function toggleDarkMode() {
  if (!currentVaultData) return;
  currentVaultData.settings.darkMode = !currentVaultData.settings.darkMode;
  saveVault(currentUsername, currentVaultData);
  const toggle = $("#darkModeToggle");
  toggle.classList.toggle("active");
  if (currentVaultData.settings.darkMode) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

// ===== SETTINGS: Remember Login =====
function showRememberDialog() {
  if (!currentVaultData) return;
  const isActive = currentVaultData.settings.rememberDuration;

  if (isActive) {
    // Already active — ask to turn off
    dialogBox.innerHTML =
      '<h3>Tắt ghi nhớ đăng nhập?</h3>' +
      '<p>Bạn muốn tắt chức năng ghi nhớ đăng nhập?</p>' +
      '<div class="dialog-actions">' +
        '<button class="dialog-primary" id="dlgConfirmOff">Đúng, tắt đi</button>' +
        '<button class="dialog-secondary" id="dlgCancelOff">Không, bấm nhầm</button>' +
      '</div>';
    dialogOverlay.classList.remove("hidden");
    $("#dlgConfirmOff").onclick = () => {
      currentVaultData.settings.rememberDuration = null;
      saveVault(currentUsername, currentVaultData);
      clearSession();
      dialogOverlay.classList.add("hidden");
    };
    $("#dlgCancelOff").onclick = () => dialogOverlay.classList.add("hidden");
  } else {
    // Not active — pick duration
    dialogBox.innerHTML =
      '<h3>Ghi nhớ đăng nhập</h3>' +
      '<p>Bạn cần ghi nhớ đăng nhập trong bao lâu?<br>Điều này có thể thay đổi bất cứ lúc nào.</p>' +
      '<div class="dialog-options">' +
        '<button class="dialog-option-btn" data-dur="5">5 phút</button>' +
        '<button class="dialog-option-btn" data-dur="10">10 phút</button>' +
        '<button class="dialog-option-btn" data-dur="30">30 phút</button>' +
        '<button class="dialog-option-btn" data-dur="60">1 giờ</button>' +
        '<button class="dialog-option-btn" data-dur="1440">24 giờ</button>' +
        '<button class="dialog-option-btn" data-dur="permanent">Vĩnh viễn đến khi bạn tắt</button>' +
      '</div>' +
      '<div class="dialog-actions"><button class="dialog-secondary" id="dlgCancelRemember">Hủy</button></div>';
    dialogOverlay.classList.remove("hidden");

    $$(".dialog-option-btn").forEach(btn => {
      btn.onclick = () => {
        const dur = btn.dataset.dur;
        const durationVal = dur === "permanent" ? "permanent" : parseInt(dur);
        currentVaultData.settings.rememberDuration = durationVal;
        saveVault(currentUsername, currentVaultData);
        saveSession(currentUsername, durationVal);
        dialogOverlay.classList.add("hidden");
      };
    });
    $("#dlgCancelRemember").onclick = () => dialogOverlay.classList.add("hidden");
  }
}

// ===== SETTINGS: Change Passcode =====
function showChangePasscode() {
  dialogBox.innerHTML =
    '<h3>Đổi mật mã</h3>' +
    '<input class="dialog-input" id="dlgOldPass" type="password" placeholder="Mật mã hiện tại" maxlength="4" inputmode="numeric">' +
    '<input class="dialog-input" id="dlgNewPass" type="password" placeholder="Mật mã mới (4 số)" maxlength="4" inputmode="numeric">' +
    '<input class="dialog-input" id="dlgConfirmPass" type="password" placeholder="Nhập lại mật mã mới" maxlength="4" inputmode="numeric">' +
    '<p class="dialog-error" id="dlgPassError"></p>' +
    '<div class="dialog-actions">' +
      '<button class="dialog-primary" id="dlgDoChangePass">Đổi mật mã</button>' +
      '<button class="dialog-secondary" id="dlgCancelChangePass">Hủy</button>' +
    '</div>';
  dialogOverlay.classList.remove("hidden");

  $("#dlgDoChangePass").onclick = () => {
    const old = $("#dlgOldPass").value;
    const nw = $("#dlgNewPass").value;
    const cf = $("#dlgConfirmPass").value;
    const err = $("#dlgPassError");

    if (old !== currentVaultData.passcode) { err.textContent = "Mật mã hiện tại không đúng!"; return; }
    if (nw.length !== 4 || !/^\d{4}$/.test(nw)) { err.textContent = "Mật mã mới phải là 4 chữ số!"; return; }
    if (BLOCKED_PASSCODES.includes(nw)) { err.textContent = "Mật mã quá đơn giản!"; return; }
    if (nw !== cf) { err.textContent = "Mật mã nhập lại không khớp!"; return; }

    currentVaultData.passcode = nw;
    saveVault(currentUsername, currentVaultData);
    $("#accountPasscode").textContent = nw;
    dialogOverlay.classList.add("hidden");
  };
  $("#dlgCancelChangePass").onclick = () => dialogOverlay.classList.add("hidden");
}

// ===== SETTINGS: Change Username =====
function showChangeUsername() {
  dialogBox.innerHTML =
    '<h3>Đổi tên đăng nhập</h3>' +
    '<input class="dialog-input" id="dlgNewUsername" type="text" placeholder="Tên đăng nhập mới" maxlength="20">' +
    '<p class="dialog-error" id="dlgUserError"></p>' +
    '<div class="dialog-actions">' +
      '<button class="dialog-primary" id="dlgDoChangeUser">Đổi tên</button>' +
      '<button class="dialog-secondary" id="dlgCancelChangeUser">Hủy</button>' +
    '</div>';
  dialogOverlay.classList.remove("hidden");

  $("#dlgDoChangeUser").onclick = () => {
    const nw = $("#dlgNewUsername").value.trim().toLowerCase();
    const err = $("#dlgUserError");
    if (!nw || nw.length < 2) { err.textContent = "Tên phải có ít nhất 2 ký tự!"; return; }
    if (nw === currentUsername) { err.textContent = "Đây là tên hiện tại!"; return; }
    if (isUsernameUsed(nw)) { err.textContent = "Tên đăng nhập đã được sử dụng!"; return; }

    // Migrate vault data
    const vaults = getAllVaults();
    const data = vaults[currentUsername];
    data.username = nw;
    delete vaults[currentUsername];
    vaults[nw] = data;
    saveAllVaults(vaults);

    // Update session if active
    const session = getSession();
    if (session && session.username === currentUsername) {
      saveSession(nw, currentVaultData.settings.rememberDuration || 0);
    }

    currentUsername = nw;
    currentVaultData = data;
    $("#accountUsername").textContent = "@" + nw;
    dialogOverlay.classList.add("hidden");
  };
  $("#dlgCancelChangeUser").onclick = () => dialogOverlay.classList.add("hidden");
}

// ===== SETTINGS: Delete Vault =====
function showDeleteVault() {
  dialogBox.innerHTML =
    '<h3>⚠️ Xóa toàn bộ két?</h3>' +
    '<p>Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu trong két của bạn. Không thể hoàn tác!</p>' +
    '<div class="dialog-actions">' +
      '<button class="dialog-danger" id="dlgDoDelete">Xóa vĩnh viễn</button>' +
      '<button class="dialog-secondary" id="dlgCancelDelete">Hủy</button>' +
    '</div>';
  dialogOverlay.classList.remove("hidden");

  $("#dlgDoDelete").onclick = () => {
    if (currentUsername === ADMIN_USERNAME) {
      dialogBox.innerHTML = '<h3>Không thể xóa</h3><p>Két Admin không thể bị xóa!</p><div class="dialog-actions"><button class="dialog-secondary" id="dlgOkAdmin">OK</button></div>';
      $("#dlgOkAdmin").onclick = () => dialogOverlay.classList.add("hidden");
      return;
    }
    deleteVaultByUsername(currentUsername);
    clearSession();
    dialogOverlay.classList.add("hidden");
    lockVault();
  };
  $("#dlgCancelDelete").onclick = () => dialogOverlay.classList.add("hidden");
}

// ===== Utility =====
function escapeHtml(s) { const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
function formatDate(iso) { const d=new Date(iso); return d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})+" — "+d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}); }
function formatDateShort(ds) { const d=new Date(ds); return d.toLocaleDateString("vi-VN",{day:"2-digit",month:"long",year:"numeric"}); }

// ===== EVENT LISTENERS =====

// Open/Close
openVaultBtn.addEventListener("click", openPasscodeModal);
closeModalBtn.addEventListener("click", closePasscodeModal);
lockBtn.addEventListener("click", lockVault);

// Number keys
$$(".num-key[data-number]").forEach(key => {
  key.addEventListener("click", () => {
    if (passwordInput.value.length < MAX_LENGTH) {
      passwordInput.value += key.dataset.number;
      updateDots();
      if (passwordInput.value.length === MAX_LENGTH) setTimeout(handlePasscodeComplete, 300);
    }
  });
});

// Delete key
deletePasswordBtn.addEventListener("click", () => {
  passwordInput.value = passwordInput.value.slice(0,-1);
  updateDots();
});

// Step 2: Login
loginBtn.addEventListener("click", handleLogin);
loginUsername.addEventListener("keydown", e => { if(e.key==="Enter") handleLogin(); });
backToStep1.addEventListener("click", () => {
  passcodeStep1.classList.remove("hidden");
  passcodeStep2.classList.add("hidden");
  matchedPasscode = null;
  resetPasscodeUI();
});

// Register
goRegisterBtn.addEventListener("click", openRegister);
closeRegisterBtn.addEventListener("click", closeRegister);
registerBtn.addEventListener("click", handleRegister);

// Bottom nav
$$(".bottom-item").forEach(item => {
  item.addEventListener("click", () => switchTab(item.dataset.nav));
});

// Favorites switch
$$(".switch-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".switch-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFavFilter = btn.dataset.filter;
    $("#favInput").placeholder = currentFavFilter==="like" ? "Thêm điều em thích..." : "Thêm điều em không thích...";
    renderFavorites();
  });
});

// Add favorite
$("#addFavBtn").addEventListener("click", () => { const i=$("#favInput"); addFavorite(i.value); i.value=""; });
$("#favInput").addEventListener("keydown", e => { if(e.key==="Enter"){addFavorite(e.target.value);e.target.value="";} });

// Quick tags
$("#quickTags").addEventListener("click", e => { const t=e.target.closest(".quick-tag"); if(t) addFavorite(t.dataset.tag); });

// Favorite customization
$("#favCustomizeToggle").addEventListener("click", () => { $("#favCustomize").classList.toggle("hidden"); });
$$("#favIconGrid .icon-opt").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#favIconGrid .icon-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFavIcon = btn.dataset.icon;
  });
});
$$("#favColorGrid .color-dot").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#favColorGrid .color-dot").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFavColor = btn.dataset.color || "";
  });
});

// Save info
$("#saveInfoBtn").addEventListener("click", saveInfo);

// Note customization and media
$("#noteCustomizeToggle").addEventListener("click", () => { $("#noteCustomize").classList.toggle("hidden"); });
$("#noteCameraBtn").addEventListener("click", () => { $("#noteFileInput").click(); });
$("#noteFileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentNoteMedia = {
      type: file.type.startsWith("video") ? "video" : "image",
      url: reader.result
    };
    renderNoteMediaPreview(currentNoteMedia.type, currentNoteMedia.url);
  };
  reader.readAsDataURL(file);
});
$("#removeNoteMedia").addEventListener("click", () => { currentNoteMedia = null; resetNoteMediaPreview(); });
$$("#noteIconGrid .icon-opt").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#noteIconGrid .icon-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentNoteIcon = btn.dataset.icon;
  });
});
$$("#noteColorGrid .color-dot").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#noteColorGrid .color-dot").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentNoteColor = btn.dataset.color || "";
  });
});
$$("#moodColorGrid .color-dot-sm").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#moodColorGrid .color-dot-sm").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMoodColor = btn.dataset.color || "";
  });
});

// Add note
$("#addNoteBtn").addEventListener("click", () => { const i=$("#noteInput"); addNote(i.value); i.value=""; });
$("#noteInput").addEventListener("keydown", e => { if(e.key==="Enter"){addNote(e.target.value);e.target.value="";} });

// Add date
$("#addDateBtn").addEventListener("click", () => { const t=$("#dateTitle"),d=$("#dateValue"); addDate(t.value,d.value); t.value=""; d.value=""; });

// Mood picker
$("#moodPicker").addEventListener("click", e => {
  const b=e.target.closest(".mood-btn");
  if (!b) return;
  currentMoodEmoji = b.dataset.mood;
  $$(".mood-btn").forEach(btn => btn.classList.toggle("selected", btn === b));
  const moods = currentVaultData.moods || [];
  const today = new Date().toDateString();
  const existing = moods.find(m => new Date(m.date).toDateString() === today);
  $("#moodNoteArea").classList.remove("hidden");
  $("#moodNote").value = existing ? existing.note || "" : "";
  $("#moodLabel").value = existing ? existing.label || "" : "";
  currentMoodColor = existing ? existing.color || "" : "";
  $$("#moodColorGrid .color-dot-sm").forEach(dot => dot.classList.toggle("active", dot.dataset.color === currentMoodColor));
});
$("#saveMoodBtn").addEventListener("click", () => {
  if (!currentMoodEmoji || !currentVaultData) return;
  const note = $("#moodNote").value.trim();
  const label = $("#moodLabel").value.trim();
  addMood(currentMoodEmoji, { note, label, color: currentMoodColor });
});

// Delete items (delegated)
document.addEventListener("click", e => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;
  const type=btn.dataset.type, idx=parseInt(btn.dataset.index,10);
  if(type==="fav") deleteFavorite(idx);
  else if(type==="note") deleteNote(idx);
  else if(type==="date") deleteDate(idx);
  else if(type==="mood") deleteMood(idx);
});

// Search
greetingNormal.addEventListener("click", openSearch);
closeSearchBtn.addEventListener("click", closeSearch);
searchInput.addEventListener("input", e => performSearch(e.target.value));

// Settings
$("#settingDarkMode").addEventListener("click", toggleDarkMode);
$("#settingRemember").addEventListener("click", showRememberDialog);
$("#settingChangePasscode").addEventListener("click", showChangePasscode);
$("#settingChangeUsername").addEventListener("click", showChangeUsername);
$("#settingDeleteVault").addEventListener("click", showDeleteVault);

// Dialog overlay - close on backdrop click
dialogOverlay.addEventListener("click", e => { if(e.target===dialogOverlay) dialogOverlay.classList.add("hidden"); });

// Visibility change — auto save
document.addEventListener("visibilitychange", () => {
  if (document.hidden && currentUsername && currentVaultData) {
    saveVault(currentUsername, currentVaultData);
  }
});