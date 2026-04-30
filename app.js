const CORRECT_PASSWORD = "09082009";

const openVaultBtn = document.getElementById("openVaultBtn");
const passwordModal = document.getElementById("passwordModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const passwordInput = document.getElementById("passwordInput");
const passcodeDots = document.getElementById("passcodeDots");
const passcodeDotItems = passcodeDots.querySelectorAll("span");
const unlockBtn = document.getElementById("unlockBtn");
const numberKeys = document.querySelectorAll(".num-key[data-number]");
const clearPasswordBtn = document.getElementById("clearPasswordBtn");
const deletePasswordBtn = document.getElementById("deletePasswordBtn");
const errorMessage = document.getElementById("errorMessage");
const vaultPage = document.getElementById("vaultPage");
const lockBtn = document.getElementById("lockBtn");
const homePage = document.getElementById("homePage");

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
  errorMessage.textContent = "";
  updatePasscodeDots();
}

function openModal() {
  passwordModal.classList.remove("hidden");
  resetPasswordInput();
}

function closeModal() {
  passwordModal.classList.add("hidden");
  resetPasswordInput();
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

    setTimeout(function () {
      passwordModal.classList.add("hidden");
      passwordModal.classList.remove("modal-exit");

      homePage.classList.add("hidden");
      homePage.classList.remove("home-exit");

      vaultPage.classList.remove("hidden");
      vaultPage.classList.add("vault-enter");

      resetPasswordInput();
    }, 320);

    setTimeout(function () {
      vaultPage.classList.remove("vault-enter");

      if (heartLayer.parentNode) {
        heartLayer.remove();
      }
    }, 900);
  } else {
    errorMessage.textContent = "Sai mật khẩu rồi cưng ơi 💗";
    passwordInput.value = "";
    updatePasscodeDots();

    const passcodeDisplay = document.querySelector(".passcode-display");
    passcodeDisplay.classList.add("shake");

    setTimeout(function () {
      passcodeDisplay.classList.remove("shake");
    }, 400);
  }
}

function lockVault() {
  vaultPage.classList.add("hidden");
  homePage.classList.remove("hidden");
  passwordModal.classList.add("hidden");
  resetPasswordInput();
}

function forceLockWhenAppHidden() {
  vaultPage.classList.add("hidden");
  homePage.classList.remove("hidden");
  passwordModal.classList.add("hidden");
  resetPasswordInput();
}

openVaultBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
unlockBtn.addEventListener("click", unlockVault);
lockBtn.addEventListener("click", lockVault);

numberKeys.forEach(function (key) {
  key.addEventListener("click", function () {
    if (passwordInput.value.length < 8) {
      passwordInput.value += key.dataset.number;
      errorMessage.textContent = "";
      updatePasscodeDots();
    }
  });
});

clearPasswordBtn.addEventListener("click", function () {
  resetPasswordInput();
});

deletePasswordBtn.addEventListener("click", function () {
  passwordInput.value = passwordInput.value.slice(0, -1);
  errorMessage.textContent = "";
  updatePasscodeDots();
});

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    forceLockWhenAppHidden();
  }
});

window.addEventListener("pagehide", function () {
  forceLockWhenAppHidden();
});