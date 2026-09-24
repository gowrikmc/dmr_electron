var username = sessionStorage.getItem("username");

// ── Back button ──
document.getElementById("back").addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

// ── DOM refs ──
const opipList      = document.getElementById("opip-list");
const documentListItems = document.getElementById("document-list-items");
const documentSectionTitle = document.getElementById("document-section-title");
const fileListItems = document.getElementById("file-list-items");
const fileSectionTitle = document.getElementById("file-section-title");
const viewerContent = document.getElementById("viewer-content");
const viewerFilename = document.getElementById("viewer-filename");
const viewerPlaceholder = document.getElementById("viewer-placeholder");
const loadingSpinner    = document.getElementById("loading-spinner");
const errorMsg          = document.getElementById("error-msg");

// ── Helpers ──
function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (["jpg","jpeg","png","gif","bmp","webp","tif","tiff"].includes(ext)) return "🖼️";
    if (ext === "pdf") return "📄";
    if (["doc","docx"].includes(ext)) return "📝";
    if (["xls","xlsx"].includes(ext)) return "📊";
    return "📁";
}

function getMime(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const map = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        bmp: "image/bmp",
        webp: "image/webp",
        tif: "image/tiff",
        tiff: "image/tiff",
        pdf: "application/pdf"
    };
    return map[ext] || null;
}

function showLoading() {
    viewerPlaceholder.style.display = "none";
    loadingSpinner.classList.add("visible");
    errorMsg.classList.remove("visible");
    // Remove any previous viewer element
    const prev = viewerContent.querySelector(".viewer-el");
    if (prev) prev.remove();
}

function showError(msg) {
    loadingSpinner.classList.remove("visible");
    errorMsg.textContent = "⚠️ " + msg;
    errorMsg.classList.add("visible");
}

function resetViewer() {
    viewerFilename.textContent = "No file selected";
    viewerPlaceholder.style.display = "block";
    loadingSpinner.classList.remove("visible");
    errorMsg.classList.remove("visible");
    const prev = viewerContent.querySelector(".viewer-el");
    if (prev) prev.remove();
}

function renderFile(base64, filename, mimeOverride = null) {
    loadingSpinner.classList.remove("visible");
    const prev = viewerContent.querySelector(".viewer-el");
    if (prev) prev.remove();

    const mime = mimeOverride || getMime(filename);
    const ext  = filename.split(".").pop().toLowerCase();
    const dataUrl = `data:${mime};base64,${base64}`;

    if (!mime) {
        errorMsg.textContent = `⚠️ Cannot preview "${ext}" files in-app.`;
        errorMsg.classList.add("visible");
        return;
    }

    if (["jpg","jpeg","png","gif","bmp","webp","tif","tiff"].includes(ext)) {
        const img = document.createElement("img");
        img.src = dataUrl;
        img.className = "viewer-el";
        img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;";
        viewerContent.appendChild(img);
    } else if (ext === "pdf") {
        const embed = document.createElement("embed");
        embed.src = dataUrl;
        embed.type = "application/pdf";
        embed.className = "viewer-el";
        embed.style.cssText = "width:100%;height:100%;min-height:500px;border:none;";
        viewerContent.appendChild(embed);
    }
}

// ── Load data and build left panel ──
document.addEventListener("DOMContentLoaded", async () => {
    // Add search input event listener
    const searchInput = document.getElementById("search-opip");
    if (searchInput) {
        searchInput.addEventListener("input", searchOpipno);
    }

    const response = await window.getfile.viewfile(username);

    if (!response.success) {
        opipList.innerHTML = `<div style="padding:16px;color:red;font-size:13px;">Error: ${response.error}</div>`;
        return;
    }

    // Group rows by opipno and then by document description
    const grouped = {};
    for (const row of response.data) {
        const opipno = row.opipno || "Unknown";
        const docName = (row.documentdescription || "Unspecified").trim() || "Unspecified";

        if (!grouped[opipno]) grouped[opipno] = {};
        if (!grouped[opipno][docName]) grouped[opipno][docName] = [];
        grouped[opipno][docName].push(row);
    }

    // Build opipno list
    opipList.innerHTML = "";
    let firstKey = null;

    Object.entries(grouped).forEach(([opipno, documents], idx) => {
        if (idx === 0) firstKey = opipno;
        const item = document.createElement("div");
        item.className = "opip-item";
        item.dataset.opipno = opipno;
        const totalFiles = Object.values(documents).reduce((sum, files) => sum + files.length, 0);
        item.innerHTML = `
            <span>${opipno}</span>
            <span class="badge">${totalFiles}</span>
        `;
        debugger;
        item.addEventListener("click", () => selectOpip(opipno, documents, item));
        opipList.appendChild(item);
    });

    // Auto-select first opipno
    if (firstKey) {
        const firstItem = opipList.querySelector(".opip-item");
        selectOpip(firstKey, grouped[firstKey], firstItem);
    }
});

function searchOpipno(){
    const searchInput = document.getElementById("search-opip").value.toLowerCase().trim();
    const opipItems = document.querySelectorAll(".opip-item");

    // If search is empty, show all items
    if (searchInput === "") {
        opipItems.forEach(item => {
            item.style.display = "flex";
        });
        return;
    }

    // Filter items based on search input
    opipItems.forEach(item => {
        const opipno = item.dataset.opipno.toLowerCase();
        if (opipno.includes(searchInput)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

// ── Select an opipno → show document list on right ──
function selectOpip(opipno, documents, itemEl) {
   
    document.querySelectorAll(".opip-item").forEach(el => el.classList.remove("active"));
    itemEl.classList.add("active");

    documentSectionTitle.textContent = `Documents for ${opipno} (${Object.keys(documents).length})`;
    documentListItems.innerHTML = "";

    const documentNames = Object.entries(documents);
    if (documentNames.length === 0) {
        documentListItems.innerHTML = `<li style="padding:14px 18px; color:#9ca3af; font-size:13px;">No documents found</li>`;
        fileSectionTitle.textContent = `Files for ${opipno}`;
        fileListItems.innerHTML = `<li style="padding:14px 18px; color:#9ca3af; font-size:13px;">No files found for this IP/OP number</li>`;
    } else {
        documentNames.forEach(([docName, files], idx) => {
            const li = document.createElement("li");
            li.className = "document-item";
            li.innerHTML = `
                <span>${docName}</span>
                <span class="badge">${files.length}</span>
            `;
            li.addEventListener("click", () => selectDocument(opipno, docName, files, li));
            documentListItems.appendChild(li);
        });

        const firstDoc = documentListItems.querySelector(".document-item");
        if (firstDoc) {
            selectDocument(opipno, documentNames[0][0], documentNames[0][1], firstDoc);
        }
    }

    // Reset viewer when changing IP/OP selection
    resetViewer();
}

// ── Select a document → show its files on the right ──
function selectDocument(opipno, docName, files, itemEl) {
    document.querySelectorAll(".document-item").forEach(el => el.classList.remove("active"));
    itemEl.classList.add("active");

    fileSectionTitle.textContent = `Files for ${opipno} / ${docName} (${files.length})`;
    fileListItems.innerHTML = "";

    // Clear any previous preview when switching documents
    resetViewer();

    if (files.length === 0) {
        fileListItems.innerHTML = `<li style="padding:14px 18px; color:#9ca3af; font-size:13px;">No files found for this document</li>`;
        return;
    }

    files.forEach(f => {
        const li = document.createElement("li");
        li.className = "file-item";
        li.innerHTML = `<span class="file-icon">${getFileIcon(f.filename)}</span>${f.filename}`;
        li.addEventListener("click", () => openFileInApp(f, li));
        fileListItems.appendChild(li);
    });
}

// ── Click file → read and render in-app ──
async function openFileInApp(fileRow, liEl) {
    // Mark active
   
    document.querySelectorAll(".file-item").forEach(el => el.classList.remove("active"));
    liEl.classList.add("active");

    viewerFilename.textContent = fileRow.filename;
    showLoading();

    const result = await window.getfile.readFile(fileRow.filelocation, fileRow.filename);
    if (!result.success) {
        showError(result.error);
        return;
    }
    renderFile(result.data, fileRow.filename, result.mime || null);
}
