// ── Admin gate — FIRST thing that runs ──
const role     = sessionStorage.getItem("role") || "";
const username = sessionStorage.getItem("username") || "Admin";
console.log(username);
if (role.toLowerCase() !== "admin") {
    document.getElementById("access-denied").classList.add("show");
    // hide the rest of the page
    document.querySelector("header").style.display = "none";
    document.querySelector(".layout").style.display = "none";
}

// ── Back button ──
document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

// ── Sidebar navigation ──
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        // update nav
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");
        // update panels
        const target = item.dataset.panel;
        document.querySelectorAll(".settings-panel").forEach(p => p.classList.remove("active"));
        document.getElementById(`panel-${target}`).classList.add("active");
    });
});

// ── System info ──
document.getElementById("sys-admin").value = username;
document.getElementById("sys-time").value  = new Date().toLocaleString();

// ── Toast helper ──
let toastTimer;
function showToast(msg, isError = false) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ""; }, 3000);
}

// ══════════════════════════════════════════
//  USER MANAGEMENT
// ══════════════════════════════════════════

async function loadUsers() {
    const tbody = document.getElementById("user-table-body");
    try {
        const result = await window.settingsAPI.getUsers();
        debugger;
        if (!result.success || !result.data.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="color:#475569;text-align:center;padding:20px;">No users found.</td></tr>`;
            return;
        }
        tbody.innerHTML = result.data.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.password || '—'}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>                
                <td><span class="badge ${u.active === 'T' ? 'badge-active' : 'badge-inactive'}">${u.active === 'T' ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn-danger" style="padding:5px 14px;font-size:12px;"
                        onclick="toggleUserStatus('${u.username}','${u.active}')">
                        ${u.active === 'T' ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:#f87171;padding:20px;">Error: ${err.message}</td></tr>`;
    }
}

async function addUser() {
    const uname  = document.getElementById("new-username").value.trim();
    const pwd    = document.getElementById("new-password").value.trim();
    const urole  = document.getElementById("new-role").value;
    const status = document.getElementById("new-status").value;

    if (!uname || !pwd) {
        showToast("Username and password are required.", true);
        return;
    }

    const result = await window.settingsAPI.addUser(uname, pwd, urole, status);
    if (result.success) {
        showToast(`✅ User "${uname}" added successfully.`);
        clearUserForm();
        loadUsers();
    } else {
        showToast("❌ " + result.error, true);
    }
}

async function toggleUserStatus(uname, currentActive) {
    const newActive = currentActive === 'T' ? 'F' : 'T';
    const result = await window.settingsAPI.updateUserStatus({ username: uname, active: newActive });
    if (result.success) {
        showToast(`User "${uname}" ${newActive === 'T' ? 'activated' : 'deactivated'}.`);
        loadUsers();
    } else {
        showToast("❌ " + result.error, true);
    }
}

function clearUserForm() {
    document.getElementById("new-username").value = "";
    document.getElementById("new-password").value = "";
    document.getElementById("new-role").value = "user";
    document.getElementById("new-status").value = "T";
}

// ══════════════════════════════════════════
//  UNIT MANAGEMENT
// ══════════════════════════════════════════

async function loadUnits() {
    const tbody = document.getElementById("unit-table-body");
    try {
        const result = await window.settingsAPI.getUnits();
        if (!result.success || !result.data.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="color:#475569;text-align:center;padding:20px;">No units found.</td></tr>`;
            return;
        }
        tbody.innerHTML = result.data.map(u => `
            <tr>
                <td>${u.unit_shot}</td>
                <td>${u.unit_full || '—'}</td>
                <td><span class="badge ${u.active === 'T' ? 'badge-active' : 'badge-inactive'}">${u.active === 'T' ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn-danger" style="padding:5px 14px;font-size:12px;"
                        onclick="toggleUnitStatus('${u.unit_shot}','${u.active}')">
                        ${u.active === 'T' ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:#f87171;padding:20px;">Error: ${err.message}</td></tr>`;
    }
}

async function addUnit() {
    const shortName = document.getElementById("new-unit-short").value.trim();
    const fullName  = document.getElementById("new-unit-full").value.trim();

    if (!shortName) {
        showToast("Unit short name is required.", true);
        return;
    }

    const result = await window.settingsAPI.addUnit({ unit_shot: shortName, unit_full: fullName });
    if (result.success) {
        showToast(`✅ Unit "${shortName}" added.`);
        document.getElementById("new-unit-short").value = "";
        document.getElementById("new-unit-full").value  = "";
        loadUnits();
    } else {
        showToast("❌ " + result.error, true);
    }
}

async function toggleUnitStatus(unitShot, currentActive) {
    const newActive = currentActive === 'T' ? 'F' : 'T';
    const result = await window.settingsAPI.updateUnitStatus({ unit_shot: unitShot, active: newActive });
    if (result.success) {
        showToast(`Unit "${unitShot}" ${newActive === 'T' ? 'activated' : 'deactivated'}.`);
        loadUnits();
    } else {
        showToast("❌ " + result.error, true);
    }
}

// ══════════════════════════════════════════
//  PATH MANAGEMENT
// ══════════════════════════════════════════

async function loadPaths() {
    const dataInput = document.getElementById("c-source-path");
    const backupInput = document.getElementById("c-destination-path");

    if (!dataInput || !backupInput) return;

    try {
        const result = await window.pathAPI.getPaths();
        const rows = Array.isArray(result?.data) ? result.data : Array.isArray(result?.path) ? result.path : [];

        if (rows.length) {
            const first = rows[0];
            dataInput.value = first.sourcepath || first.sp || "";
            backupInput.value = first.destinationpath || first.dp || "";
        } else {
            dataInput.value = "";
            backupInput.value = "";
        }
    } catch (err) {
        showToast("❌ Unable to load paths: " + err.message, true);
    }
}

async function savePaths() {    
    const dataPath = document.getElementById("data-path").value.trim();
    const backupPath = document.getElementById("backup-path").value.trim();
    console.log(dataPath);
    console.log(backupPath);
    if (!dataPath && !backupPath) {
        showToast("Both paths are required.", true);
        return;
    }

    try {
        const result = await window.pathAPI.savePaths(dataPath, backupPath);
        if (result.success) {
            showToast("✅ Paths saved successfully.");
            loadPaths();
        } else {
            showToast("❌ " + (result.error || "Unable to save paths."), true);
        }
    } catch (err) {
        showToast("❌ " + err.message, true);
    }
}

// ── Initial data load (admin only) ──
if (role.toLowerCase() === "admin") {
    loadUsers();
    loadUnits();
    loadPaths();
}
