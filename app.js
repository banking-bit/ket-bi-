/* ============================================================
   KÉT BÍ MẬT — Multi-Vault System with LocalStorage
   ============================================================ */

const ADMIN_PASSCODE = "1004";
const MAX_LENGTH = 4;
const STORAGE_KEY = "ket_bi_mat_vaults";

// ===== DOM Elements =====
const openVaultBtn = document.getElementById("openVaultBtn");
const passwordModal = document.getElementById("passwordModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const passwordInput = document.getElementById("passwordInput");
const passcodeDots = document.getElementById("passcodeDots");
const passcodeDotItems = passcodeDots.querySelectorAll("span");
const numberKeys = document.querySelectorAll(".num-key[data-number]");
const deletePasswordBtn = document.getElementById("deletePasswordBtn");
const passcodeTitle = document.getElementById("passcodeTitle");
const passcodeSubtitle = document.getElementById("passcodeSubtitle");
const vaultPage = document.getElementById("vaultPage");
const lockBtn = document.getElementById("lockBtn");
const homePage = document.getElementById("homePage");
const greetingText = document.getElementById("greetingText");
const vaultCount = document.getElementById("vaultCount");
const vaultSubtitle = document.getElementById("vaultSubtitle");

// ===== State =====
let currentPasscode = null;
let currentVaultData = null;
let isCreatingNewVault = false;
let pendingNewPasscode = null;
let currentFavFilter = "like"; // "like" or "dislike"

// ===== LocalStorage Helpers =====
function getAllVaults() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function saveAllVaults(vaults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vaults));
}

function getVault(passcode) {
  const vaults = getAllVaults();
  return vaults[passcode] || null;
}

function saveVault(passcode, data) {
  const vaults = getAllVaults();
  vaults[passcode] = data;
  saveAllVaults(vaults);
}

function createNewVault(passcode) {
  const isAdmin = passcode === ADMIN_PASSCODE;
  return {
    role: isAdmin ? "admin" : "user",
    createdAt: new Date().toISOString(),
    favorites: { like: [], dislike: [] },
    info: { name: "", birthday: "", zodiac: "", color: "", song: "", movie: "", pet: "", extra: "" },
    notes: [],
    dates: [],
    moods: []
  };
}

// Ensure admin vault exists
(function initAdminVault() {
  const vaults = getAllVaults();
  if (!vaults[ADMIN_PASSCODE]) {
    vaults[ADMIN_PASSCODE] = createNewVault(ADMIN_PASSCODE);
    saveAllVaults(vaults);
  }
})();

// ===== Passcode UI =====
function updatePasscodeDots() {
  const length = passwordInput.value.length;
  passcodeDotItems.forEach(function (dot, index) {
    if (index < length) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });
}

function resetPasswordInput() {
  passwordInput.value = "";
  updatePasscodeDots();
}

function resetPasscodeState() {
  isCreatingNewVault = false;
  pendingNewPasscode = null;
  passcodeTitle.textContent = "Nhập mật mã";
  passcodeSubtitle.textContent = "";
  resetPasswordInput();
}

function openModal() {
  passwordModal.classList.remove("hidden");
  resetPasscodeState();
}

function closeModal() {
  passwordModal.classList.add("hidden");
  resetPasscodeState();
}

// ===== Auto-Check Passcode Logic =====
function handlePasscodeEntry() {
  const entered = passwordInput.value;

  if (isCreatingNewVault) {
    // Step 2: Confirm new passcode
    if (entered === pendingNewPasscode) {
      // Match! Create new vault
      const newVaultData = createNewVault(entered);
      saveVault(entered, newVaultData);
      currentPasscode = entered;
      currentVaultData = newVaultData;
      enterVault();
    } else {
      // Mismatch
      passcodeSubtitle.textContent = "Không khớp! Thử lại nhé 💗";
      shakeDots();
      setTimeout(function () {
        isCreatingNewVault = false;
        pendingNewPasscode = null;
        passcodeTitle.textContent = "Nhập mật mã";
        passcodeSubtitle.textContent = "";
      }, 1200);
    }
  } else {
    // Step 1: Check if passcode exists
    const vault = getVault(entered);
    if (vault) {
      // Exists — unlock!
      currentPasscode = entered;
      currentVaultData = vault;
      enterVault();
    } else {
      // New passcode — ask to confirm
      isCreatingNewVault = true;
      pendingNewPasscode = entered;
      passcodeTitle.textContent = "Mật mã mới!";
      passcodeSubtitle.textContent = "Nhập lại để tạo Két của riêng bạn 💗";
      resetPasswordInput();
    }
  }
}

function shakeDots() {
  passcodeDots.classList.add("shake");
  setTimeout(function () {
    passcodeDots.classList.remove("shake");
    resetPasswordInput();
  }, 450);
}

// ===== Enter / Exit Vault =====
function enterVault() {
  var phoneScreen = document.querySelector(".phone-screen");

  var heartLayer = document.createElement("div");
  heartLayer.className = "unlock-heart";
  heartLayer.innerHTML = "<span>💗</span>";
  phoneScreen.appendChild(heartLayer);

  passwordModal.classList.add("modal-exit");
  homePage.classList.add("home-exit");

  setTimeout(function () {
    passwordModal.classList.add("hidden");
    passwordModal.classList.remove("modal-exit");
    homePage.classList.add("hidden");
    homePage.classList.remove("home-exit");
    vaultPage.classList.remove("hidden");
    vaultPage.classList.add("vault-enter");
    resetPasscodeState();
    loadVaultUI();
  }, 320);

  setTimeout(function () {
    vaultPage.classList.remove("vault-enter");
    if (heartLayer.parentNode) heartLayer.remove();
  }, 900);
}

function lockVault() {
  // Save before locking
  if (currentPasscode && currentVaultData) {
    saveVault(currentPasscode, currentVaultData);
  }
  vaultPage.classList.add("hidden");
  homePage.classList.remove("hidden");
  passwordModal.classList.add("hidden");
  currentPasscode = null;
  currentVaultData = null;
  resetPasscodeState();
}

function forceLockWhenAppHidden() {
  if (currentPasscode && currentVaultData) {
    saveVault(currentPasscode, currentVaultData);
  }
  lockVault();
}

// ===== Load Vault UI =====
function loadVaultUI() {
  if (!currentVaultData) return;

  // Greeting
  const hour = new Date().getHours();
  let greeting = "Chào cưng, hôm nay có gì mới?";
  if (hour < 12) greeting = "Chào buổi sáng cưng! ☀️";
  else if (hour < 18) greeting = "Buổi chiều vui vẻ nha! 🌸";
  else greeting = "Chào buổi tối cưng! 🌙";
  greetingText.textContent = greeting;

  // Show admin panel if admin
  const adminPanel = document.getElementById("adminPanel");
  const currentRole = document.getElementById("currentRole");
  const currentPasscodeEl = document.getElementById("currentPasscode");

  currentPasscodeEl.textContent = currentPasscode;
  currentRole.textContent = currentPasscode === ADMIN_PASSCODE ? "👑 Admin" : "User";

  if (currentPasscode === ADMIN_PASSCODE) {
    adminPanel.classList.remove("hidden");
    renderAdminPanel();
  } else {
    adminPanel.classList.add("hidden");
  }

  // Set initial tab
  switchTab("favorites");
  switchBottomNav("favorites");

  // Render all
  renderFavorites();
  loadInfoFields();
  renderNotes();
  renderDates();
  renderMoods();
  updateTotalCount();
}

// ===== Count =====
function updateTotalCount() {
  if (!currentVaultData) return;
  const fav = (currentVaultData.favorites.like || []).length + (currentVaultData.favorites.dislike || []).length;
  const notes = (currentVaultData.notes || []).length;
  const dates = (currentVaultData.dates || []).length;
  const moods = (currentVaultData.moods || []).length;
  vaultCount.textContent = fav + notes + dates + moods;
}

// ===== Tab Switching =====
function switchTab(tabName) {
  // Vault tabs
  document.querySelectorAll(".vault-tab").forEach(function (tab) {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  // Tab contents
  document.querySelectorAll(".tab-content").forEach(function (content) {
    content.classList.toggle("active", content.dataset.tabContent === tabName);
  });
}

function switchBottomNav(navName) {
  document.querySelectorAll(".bottom-item").forEach(function (item) {
    item.classList.toggle("active", item.dataset.nav === navName);
  });
  switchTab(navName);
}

// ===== FAVORITES =====
function renderFavorites() {
  const list = document.getElementById("favList");
  const label = document.getElementById("favSectionLabel");
  const items = currentVaultData.favorites[currentFavFilter] || [];

  list.innerHTML = "";
  label.textContent = currentFavFilter === "like" ? "Những thứ em thích" : "Những thứ em không thích";

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">favorite_border</i><p>Chưa có gì ở đây cả...</p></div>';
    return;
  }

  items.forEach(function (item, index) {
    var card = document.createElement("div");
    card.className = "memory-card-item";
    card.innerHTML =
      '<div class="memory-accent"></div>' +
      '<div class="memory-left">' +
        '<div class="memory-emoji"><i class="material-symbols-rounded">' + (currentFavFilter === "like" ? "favorite" : "heart_broken") + '</i></div>' +
        '<div>' +
          '<div class="memory-text">' + escapeHtml(item) + '</div>' +
          '<div class="memory-meta">' + (currentFavFilter === "like" ? "💗 Thích" : "🤍 Không thích") + '</div>' +
        '</div>' +
      '</div>' +
      '<button class="delete-btn" type="button" data-type="fav" data-index="' + index + '" aria-label="Xóa"><i class="material-symbols-rounded">close</i></button>';
    list.appendChild(card);
  });

  updateTotalCount();
}

function addFavorite(text) {
  if (!text.trim() || !currentVaultData) return;
  currentVaultData.favorites[currentFavFilter].push(text.trim());
  saveVault(currentPasscode, currentVaultData);
  renderFavorites();
}

function deleteFavorite(index) {
  currentVaultData.favorites[currentFavFilter].splice(index, 1);
  saveVault(currentPasscode, currentVaultData);
  renderFavorites();
}

// ===== INFO =====
function loadInfoFields() {
  if (!currentVaultData) return;
  var info = currentVaultData.info || {};
  document.getElementById("infoName").value = info.name || "";
  document.getElementById("infoBirthday").value = info.birthday || "";
  document.getElementById("infoZodiac").value = info.zodiac || "";
  document.getElementById("infoColor").value = info.color || "";
  document.getElementById("infoSong").value = info.song || "";
  document.getElementById("infoMovie").value = info.movie || "";
  document.getElementById("infoPet").value = info.pet || "";
  document.getElementById("infoExtra").value = info.extra || "";
}

function saveInfo() {
  if (!currentVaultData) return;
  currentVaultData.info = {
    name: document.getElementById("infoName").value,
    birthday: document.getElementById("infoBirthday").value,
    zodiac: document.getElementById("infoZodiac").value,
    color: document.getElementById("infoColor").value,
    song: document.getElementById("infoSong").value,
    movie: document.getElementById("infoMovie").value,
    pet: document.getElementById("infoPet").value,
    extra: document.getElementById("infoExtra").value
  };
  saveVault(currentPasscode, currentVaultData);

  // Update subtitle with name
  if (currentVaultData.info.name) {
    vaultSubtitle.textContent = "Bí mật về " + currentVaultData.info.name;
  }

  // Visual feedback
  var btn = document.getElementById("saveInfoBtn");
  btn.classList.add("saved");
  btn.innerHTML = '<i class="material-symbols-rounded">check</i> Đã lưu! 💗';
  setTimeout(function () {
    btn.classList.remove("saved");
    btn.innerHTML = '<i class="material-symbols-rounded">check</i> Lưu thông tin';
  }, 1500);
}

// ===== NOTES =====
function renderNotes() {
  var list = document.getElementById("noteList");
  var notes = currentVaultData.notes || [];
  list.innerHTML = "";

  if (notes.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">edit_note</i><p>Chưa có ghi chú nào...</p></div>';
    return;
  }

  notes.forEach(function (note, index) {
    var card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML =
      '<div class="note-content">' +
        '<div class="note-text">' + escapeHtml(note.text) + '</div>' +
        '<div class="note-time">' + formatDate(note.createdAt) + '</div>' +
      '</div>' +
      '<button class="delete-btn" type="button" data-type="note" data-index="' + index + '" aria-label="Xóa"><i class="material-symbols-rounded">close</i></button>';
    list.appendChild(card);
  });

  updateTotalCount();
}

function addNote(text) {
  if (!text.trim() || !currentVaultData) return;
  currentVaultData.notes.unshift({ text: text.trim(), createdAt: new Date().toISOString() });
  saveVault(currentPasscode, currentVaultData);
  renderNotes();
}

function deleteNote(index) {
  currentVaultData.notes.splice(index, 1);
  saveVault(currentPasscode, currentVaultData);
  renderNotes();
}

// ===== DATES =====
function renderDates() {
  var list = document.getElementById("dateList");
  var dates = currentVaultData.dates || [];
  list.innerHTML = "";

  if (dates.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">calendar_month</i><p>Chưa có ngày quan trọng nào...</p></div>';
    return;
  }

  dates.forEach(function (d, index) {
    var countdown = getCountdown(d.date);
    var card = document.createElement("div");
    card.className = "date-card";
    card.innerHTML =
      '<div class="date-info">' +
        '<div class="date-title">' + escapeHtml(d.title) + '</div>' +
        '<div class="date-value">' + formatDateShort(d.date) + '</div>' +
      '</div>' +
      '<div class="date-countdown">' + countdown + '</div>' +
      '<button class="delete-btn" type="button" data-type="date" data-index="' + index + '" aria-label="Xóa"><i class="material-symbols-rounded">close</i></button>';
    list.appendChild(card);
  });

  updateTotalCount();
}

function addDate(title, date) {
  if (!title.trim() || !date || !currentVaultData) return;
  currentVaultData.dates.push({ title: title.trim(), date: date });
  saveVault(currentPasscode, currentVaultData);
  renderDates();
}

function deleteDate(index) {
  currentVaultData.dates.splice(index, 1);
  saveVault(currentPasscode, currentVaultData);
  renderDates();
}

function getCountdown(dateStr) {
  var target = new Date(dateStr);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  var diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hôm nay! 🎉";
  if (diff > 0) return "Còn " + diff + " ngày";
  return Math.abs(diff) + " ngày trước";
}

// ===== MOODS =====
function renderMoods() {
  var log = document.getElementById("moodLog");
  var moods = currentVaultData.moods || [];
  log.innerHTML = "";

  // Reset selected state on picker
  document.querySelectorAll(".mood-btn").forEach(function (btn) {
    btn.classList.remove("selected");
  });

  // Check if already logged today
  var today = new Date().toDateString();
  var todayMood = moods.find(function (m) {
    return new Date(m.date).toDateString() === today;
  });
  if (todayMood) {
    document.querySelectorAll(".mood-btn").forEach(function (btn) {
      if (btn.dataset.mood === todayMood.emoji) {
        btn.classList.add("selected");
      }
    });
  }

  if (moods.length === 0) {
    log.innerHTML = '<div class="empty-state"><i class="material-symbols-rounded">mood</i><p>Chưa có tâm trạng nào được ghi...</p></div>';
    return;
  }

  moods.slice(0, 30).forEach(function (mood) {
    var card = document.createElement("div");
    card.className = "mood-card";
    card.innerHTML =
      '<div class="mood-card-left">' +
        '<div class="mood-card-emoji">' + mood.emoji + '</div>' +
        '<div>' +
          '<div class="mood-card-date">' + formatDate(mood.date) + '</div>' +
        '</div>' +
      '</div>';
    log.appendChild(card);
  });

  updateTotalCount();
}

function addMood(emoji) {
  if (!currentVaultData) return;
  var today = new Date().toDateString();

  // Replace if already logged today
  var existingIndex = -1;
  currentVaultData.moods.forEach(function (m, i) {
    if (new Date(m.date).toDateString() === today) existingIndex = i;
  });

  if (existingIndex >= 0) {
    currentVaultData.moods[existingIndex].emoji = emoji;
  } else {
    currentVaultData.moods.unshift({ emoji: emoji, date: new Date().toISOString() });
  }

  saveVault(currentPasscode, currentVaultData);
  renderMoods();
}

// ===== ADMIN PANEL =====
function renderAdminPanel() {
  var container = document.getElementById("adminVaultList");
  var vaults = getAllVaults();
  container.innerHTML = "";

  var passcodes = Object.keys(vaults);
  if (passcodes.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Chưa có két nào trên thiết bị này.</p></div>';
    return;
  }

  passcodes.forEach(function (code) {
    var v = vaults[code];
    var favCount = (v.favorites && v.favorites.like ? v.favorites.like.length : 0) + (v.favorites && v.favorites.dislike ? v.favorites.dislike.length : 0);
    var noteCount = v.notes ? v.notes.length : 0;
    var dateCount = v.dates ? v.dates.length : 0;
    var moodCount = v.moods ? v.moods.length : 0;

    var card = document.createElement("div");
    card.className = "admin-vault-card";

    var html =
      '<div class="admin-vault-header">' +
        '<span class="admin-vault-passcode">' + code + '</span>' +
        '<span class="admin-vault-role">' + (v.role === "admin" ? "👑 Admin" : "User") + '</span>' +
      '</div>' +
      '<div class="admin-vault-stats">' +
        '<span class="admin-stat">❤️ <strong>' + favCount + '</strong> sở thích</span>' +
        '<span class="admin-stat">📝 <strong>' + noteCount + '</strong> ghi chú</span>' +
        '<span class="admin-stat">📅 <strong>' + dateCount + '</strong> ngày</span>' +
        '<span class="admin-stat">😊 <strong>' + moodCount + '</strong> tâm trạng</span>' +
      '</div>';

    // Show data details
    html += '<div class="admin-vault-data">';

    // Info
    if (v.info && v.info.name) {
      html += '<div class="admin-data-label">Thông tin</div>';
      html += '<div class="admin-data-items">';
      if (v.info.name) html += '<span class="admin-data-chip">Tên: ' + escapeHtml(v.info.name) + '</span>';
      if (v.info.birthday) html += '<span class="admin-data-chip">🎂 ' + formatDateShort(v.info.birthday) + '</span>';
      if (v.info.zodiac) html += '<span class="admin-data-chip">⭐ ' + escapeHtml(v.info.zodiac) + '</span>';
      html += '</div>';
    }

    // Likes
    if (v.favorites && v.favorites.like && v.favorites.like.length > 0) {
      html += '<div class="admin-data-label">💗 Thích</div>';
      html += '<div class="admin-data-items">';
      v.favorites.like.forEach(function (f) {
        html += '<span class="admin-data-chip">' + escapeHtml(f) + '</span>';
      });
      html += '</div>';
    }

    // Dislikes
    if (v.favorites && v.favorites.dislike && v.favorites.dislike.length > 0) {
      html += '<div class="admin-data-label">🤍 Không thích</div>';
      html += '<div class="admin-data-items">';
      v.favorites.dislike.forEach(function (f) {
        html += '<span class="admin-data-chip">' + escapeHtml(f) + '</span>';
      });
      html += '</div>';
    }

    // Notes
    if (v.notes && v.notes.length > 0) {
      html += '<div class="admin-data-label">📝 Ghi chú</div>';
      html += '<div class="admin-data-items">';
      v.notes.forEach(function (n) {
        html += '<span class="admin-data-chip">' + escapeHtml(n.text) + '</span>';
      });
      html += '</div>';
    }

    // Dates
    if (v.dates && v.dates.length > 0) {
      html += '<div class="admin-data-label">📅 Ngày</div>';
      html += '<div class="admin-data-items">';
      v.dates.forEach(function (d) {
        html += '<span class="admin-data-chip">' + escapeHtml(d.title) + ': ' + formatDateShort(d.date) + '</span>';
      });
      html += '</div>';
    }

    html += '</div>';
    card.innerHTML = html;
    container.appendChild(card);
  });
}

// ===== Utility =====
function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoStr) {
  var d = new Date(isoStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " — " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

// ===== EVENT LISTENERS =====

// Open/close modal
openVaultBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
lockBtn.addEventListener("click", lockVault);

// Number keys
numberKeys.forEach(function (key) {
  key.addEventListener("click", function () {
    if (passwordInput.value.length < MAX_LENGTH) {
      passwordInput.value += key.dataset.number;
      updatePasscodeDots();

      // Auto-check when 4 digits entered
      if (passwordInput.value.length === MAX_LENGTH) {
        setTimeout(handlePasscodeEntry, 300);
      }
    }
  });
});

// Delete key
deletePasswordBtn.addEventListener("click", function () {
  passwordInput.value = passwordInput.value.slice(0, -1);
  updatePasscodeDots();
});

// Vault tabs
document.querySelectorAll(".vault-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    switchTab(tab.dataset.tab);
    // Also sync bottom nav
    document.querySelectorAll(".bottom-item").forEach(function (item) {
      item.classList.toggle("active", item.dataset.nav === tab.dataset.tab);
    });
  });
});

// Bottom nav
document.querySelectorAll(".bottom-item").forEach(function (item) {
  item.addEventListener("click", function () {
    switchBottomNav(item.dataset.nav);
    // Sync vault tabs
    document.querySelectorAll(".vault-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.tab === item.dataset.nav);
    });
  });
});

// Favorites: Switch Thích/Không thích
document.querySelectorAll(".switch-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".switch-btn").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    currentFavFilter = btn.dataset.filter;

    // Update placeholder
    var input = document.getElementById("favInput");
    input.placeholder = currentFavFilter === "like" ? "Thêm điều em thích..." : "Thêm điều em không thích...";

    renderFavorites();
  });
});

// Add favorite
document.getElementById("addFavBtn").addEventListener("click", function () {
  var input = document.getElementById("favInput");
  addFavorite(input.value);
  input.value = "";
});

document.getElementById("favInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    addFavorite(this.value);
    this.value = "";
  }
});

// Quick tags
document.getElementById("quickTags").addEventListener("click", function (e) {
  var tag = e.target.closest(".quick-tag");
  if (tag) {
    addFavorite(tag.dataset.tag);
  }
});

// Save info
document.getElementById("saveInfoBtn").addEventListener("click", saveInfo);

// Add note
document.getElementById("addNoteBtn").addEventListener("click", function () {
  var input = document.getElementById("noteInput");
  addNote(input.value);
  input.value = "";
});

document.getElementById("noteInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    addNote(this.value);
    this.value = "";
  }
});

// Add date
document.getElementById("addDateBtn").addEventListener("click", function () {
  var title = document.getElementById("dateTitle");
  var date = document.getElementById("dateValue");
  addDate(title.value, date.value);
  title.value = "";
  date.value = "";
});

// Mood picker
document.getElementById("moodPicker").addEventListener("click", function (e) {
  var btn = e.target.closest(".mood-btn");
  if (btn) {
    addMood(btn.dataset.mood);
  }
});

// Delete items (delegated)
document.addEventListener("click", function (e) {
  var deleteBtn = e.target.closest(".delete-btn");
  if (!deleteBtn) return;

  var type = deleteBtn.dataset.type;
  var index = parseInt(deleteBtn.dataset.index, 10);

  if (type === "fav") deleteFavorite(index);
  else if (type === "note") deleteNote(index);
  else if (type === "date") deleteDate(index);
});

// Visibility change — auto-lock
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    forceLockWhenAppHidden();
  }
});

window.addEventListener("pagehide", function () {
  forceLockWhenAppHidden();
});