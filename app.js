const CORRECT_PASSWORD = "09082009";

const openVaultBtn = document.getElementById("openVaultBtn");
const passwordModal = document.getElementById("passwordModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const passwordInput = document.getElementById("passwordInput");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const unlockBtn = document.getElementById("unlockBtn");
const numberKeys = document.querySelectorAll(".num-key[data-number]");
const clearPasswordBtn = document.getElementById("clearPasswordBtn");
const deletePasswordBtn = document.getElementById("deletePasswordBtn");
const errorMessage = document.getElementById("errorMessage");
const vaultPage = document.getElementById("vaultPage");
const lockBtn = document.getElementById("lockBtn");
const homePage = document.getElementById("homePage");

function openModal() {
  passwordModal.classList.remove("hidden");
  errorMessage.textContent = "";
  passwordInput.value = "";
  passwordInput.type = "password";
  togglePasswordBtn.textContent = "👁️";

  setTimeout(() => {
    passwordInput.focus();
  }, 200);
}

function closeModal() {
  passwordModal.classList.add("hidden");
  errorMessage.textContent = "";
  passwordInput.value = "";
}

function unlockVault() {
  const password = passwordInput.value.trim();

  if (password === CORRECT_PASSWORD) {
    const phoneScreen = document.querySelector(".phone-screen");

    const heartLayer = document.createElement("div");
    heartLayer.className = "unlock-heart";
    heartLayer.innerHTML = "<span>💗</span>";
    phoneScreen.appendChild(heartLayer);

    passwordModal.classList.add("modal-exit");
    homePage.classList.add("home-exit");

    setTimeout(() => {
      passwordModal.classList.add("hidden");
      passwordModal.classList.remove("modal-exit");

      homePage.classList.add("hidden");
      homePage.classList.remove("home-exit");

      vaultPage.classList.remove("hidden");
      vaultPage.classList.add("vault-enter");

      passwordInput.value = "";
      errorMessage.textContent = "";
    }, 320);

    setTimeout(() => {
      vaultPage.classList.remove("vault-enter");
      heartLayer.remove();
    }, 900);
  } else {
    errorMessage.textContent = "Sai mật khẩu rồi cưng ơi 💗";
    passwordInput.value = "";
    passwordInput.focus();

    const modalContent = document.querySelector(".modal-content");
    modalContent.classList.add("shake");

    setTimeout(() => {
      modalContent.classList.remove("shake");
    }, 400);
  }
}

function lockVault() {
  vaultPage.classList.add("hidden");
  homePage.classList.remove("hidden");
  passwordModal.classList.add("hidden");

  passwordInput.value = "";
  errorMessage.textContent = "";
}

function forceLockWhenAppHidden() {
  vaultPage.classList.add("hidden");
  homePage.classList.remove("hidden");
  passwordModal.classList.add("hidden");

  passwordInput.value = "";
  errorMessage.textContent = "";
  passwordInput.type = "password";
  togglePasswordBtn.textContent = "👁️";
}

openVaultBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
unlockBtn.addEventListener("click", unlockVault);
lockBtn.addEventListener("click", lockVault);

passwordInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    unlockVault();
  }
});

togglePasswordBtn.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.textContent = "👁️";
  }
});
numberKeys.forEach(function (key) {
  key.addEventListener("click", function () {
    if (passwordInput.value.length < 12) {
      passwordInput.value += key.dataset.number;
      errorMessage.textContent = "";
    }
  });
});

clearPasswordBtn.addEventListener("click", function () {
  passwordInput.value = "";
  errorMessage.textContent = "";
});

deletePasswordBtn.addEventListener("click", function () {
  passwordInput.value = passwordInput.value.slice(0, -1);
  errorMessage.textContent = "";
});
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    forceLockWhenAppHidden();
  }
});

window.addEventListener("pagehide", function () {
  forceLockWhenAppHidden();
});