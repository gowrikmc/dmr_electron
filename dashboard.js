const IndexButton    = document.getElementById("btnIndex");
const ViewButton     = document.getElementById("btnView");
const SettingsButton = document.getElementById("btnSettings");
const IndexTotalCard = document.getElementById("btnIndexTotal");
const LogoutButton   = document.getElementById("logoutbutton");
const indexLogsModal = document.getElementById("index-logs-modal");
const indexLogsClose = document.getElementById("index-logs-close");
const indexLogsList = document.getElementById("index-logs-list");
const indexLogsEmpty = document.getElementById("index-logs-empty");
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
const indexTotalEl = document.getElementById("index-total");

async function loadIndexTotal() {
    if (!indexTotalEl || !window.dbAPI?.GetUserIndexCount) return;

    try {
        const result = await window.dbAPI.GetUserIndexCount(username);
        if (result?.success) indexTotalEl.textContent = Number(result.data).toLocaleString();
        else indexTotalEl.textContent = "—";
    } catch (error) {
        console.error("Unable to load completed index total:", error);
        indexTotalEl.textContent = "—";
    }
}

function closeIndexLogs() {
    indexLogsModal?.classList.remove("show");
}

function addLogCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "—";
    row.appendChild(cell);
}

async function showIndexLogs() {
    if (!indexLogsModal || !indexLogsList || !window.dbAPI?.GetUserIndexLogs) return;

    indexLogsList.replaceChildren();
    indexLogsEmpty.hidden = true;
    indexLogsModal.classList.add("show");

    try {
        const result = await window.dbAPI.GetUserIndexLogs(username);
        if (!result?.success || !result.data?.length) {
            indexLogsEmpty.hidden = false;
            return;
        }

        result.data.forEach((log) => {
            const row = document.createElement("tr");
            addLogCell(row, log.opipno);
            addLogCell(row, log.documents);
            addLogCell(row, Number(log.file_count).toLocaleString());
            indexLogsList.appendChild(row);
        });
    } catch (error) {
        console.error("Unable to load completed index logs:", error);
        indexLogsEmpty.textContent = "Unable to load completed index logs.";
        indexLogsEmpty.hidden = false;
    }
}

loadIndexTotal();

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

IndexTotalCard.addEventListener("click", showIndexLogs);
IndexTotalCard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") showIndexLogs();
});
indexLogsClose.addEventListener("click", closeIndexLogs);
indexLogsModal.addEventListener("click", (event) => {
    if (event.target === indexLogsModal) closeIndexLogs();
});

LogoutButton.addEventListener("click", () => {
    showCustomConfirm("Are you sure you want to log out?", (confirmed) => {
        if (confirmed) {
            sessionStorage.clear();
            navigate("index.html");
        }
    });
});
