const IndexButton    = document.getElementById("btnIndex");
const ViewButton     = document.getElementById("btnView");
const SettingsButton = document.getElementById("btnSettings");
const LogoutButton   = document.getElementById("logoutbutton");
const alertModal      = document.getElementById("custom-alert-modal");
const alertTitle      = document.getElementById("custom-alert-title");
const alertMessage    = document.getElementById("custom-alert-message");
const alertIcon       = document.getElementById("custom-alert-icon");
const alertCancel     = document.getElementById("custom-alert-cancel");
const alertOk         = document.getElementById("custom-alert-ok");
let confirmCallback = null;

function closeCustomAlert() {
    if (alertModal) alertModal.classList.remove("show");
}

function showCustomAlert(message, title = "Notice") {
    if (!alertModal || !alertMessage || !alertTitle || !alertOk) {
        window.alert(message);
        return;
    }

    alertTitle.textContent = title;
    alertMessage.textContent = message;
    if (alertIcon) alertIcon.textContent = "!";
    if (alertCancel) alertCancel.style.display = "none";
    alertOk.textContent = "OK";
    confirmCallback = null;
    alertModal.classList.add("show");
    alertOk.focus();
}

function showCustomConfirm(message, onConfirm) {
    if (!alertModal || !alertMessage || !alertTitle || !alertOk || !alertCancel) {
        onConfirm(false);
        return;
    }

    alertTitle.textContent = "Confirm";
    alertMessage.textContent = message;
    if (alertIcon) alertIcon.textContent = "?";
    alertCancel.style.display = "inline-flex";
    alertOk.textContent = "Yes";
    confirmCallback = onConfirm;
    alertModal.classList.add("show");
    alertCancel.focus();
}

if (alertOk) {
    alertOk.addEventListener("click", () => {
        if (confirmCallback) {
            const callback = confirmCallback;
            confirmCallback = null;
            closeCustomAlert();
            callback(true);
        } else {
            closeCustomAlert();
        }
    });
}

if (alertCancel) {
    alertCancel.addEventListener("click", () => {
        if (confirmCallback) {
            const callback = confirmCallback;
            confirmCallback = null;
            closeCustomAlert();
            callback(false);
        } else {
            closeCustomAlert();
        }
    });
}

if (alertModal) {
    alertModal.addEventListener("click", (event) => {
        if (event.target === alertModal) closeCustomAlert();
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && alertModal?.classList.contains("show")) {
        closeCustomAlert();
    }
});

window.alert = showCustomAlert;

const username = sessionStorage.getItem("username") || "User";
const unit     = sessionStorage.getItem("unit") || "—";
const role     = sessionStorage.getItem("role") || "";

// Populate navbar
const greetEl = document.getElementById("user-greeting");
const unitEl  = document.getElementById("unit-tag");
const badgeEl = document.getElementById("role-badge");
if (greetEl) greetEl.textContent = `Welcome, ${username}`;
if (unitEl)  unitEl.textContent  = `Unit: ${unit}`;

// Show Settings card + Admin badge only for admin role
if (role.toLowerCase() === "admin") {
    if (SettingsButton) SettingsButton.style.display = "flex";
    if (badgeEl) badgeEl.classList.add("visible");
}

// Navigation helpers
function navigate(url) { window.location.href = url; }
function keyNav(e, url) { if (e.key === "Enter" || e.key === " ") navigate(url); }

IndexButton.addEventListener("click",   () => navigate("File_index.html"));
IndexButton.addEventListener("keydown", (e) => keyNav(e, "File_index.html"));

ViewButton.addEventListener("click",   () => navigate("File_view.html"));
ViewButton.addEventListener("keydown", (e) => keyNav(e, "File_view.html"));

SettingsButton.addEventListener("click",   () => navigate("settings.html"));
SettingsButton.addEventListener("keydown", (e) => keyNav(e, "settings.html"));

LogoutButton.addEventListener("click", () => {
    showCustomConfirm("Are you sure you want to log out?", (confirmed) => {
        if (confirmed) {
            sessionStorage.clear();
            navigate("index.html");
        }
    });
});
