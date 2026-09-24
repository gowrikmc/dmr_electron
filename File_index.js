// Radio buttons — update checkbox label dynamically
const radioButtons = document.querySelectorAll('input[name="ptype"]');
const checkboxbtn = document.getElementById("byip");
//const checkboxText = document.getElementById("byipText");
const uhid = document.getElementById("uhid");
const search = document.getElementById("search");
const filecountbadge = document.getElementById("badge");
const selectallbtn = document.getElementById("selectAll");
const inputvalue = document.getElementById("patientId");
const indexbtn = document.getElementById("index");

const alertModal = document.getElementById("custom-alert-modal");
const alertTitle = document.getElementById("custom-alert-title");
const alertMessage = document.getElementById("custom-alert-message");
const alertIcon = document.getElementById("custom-alert-icon");
const alertCancel = document.getElementById("custom-alert-cancel");
const alertOk = document.getElementById("custom-alert-ok");

var radiobtncheck = false;
var radiobtnvalue = "";
var checkboxcheck = false;
var checkboxvalue = "NUMBER";
var selecteddoc = "";
var selectedid = "";

var sp = "";
var dp = "";
var username = sessionStorage.getItem("username");

document.addEventListener("DOMContentLoaded", async () => {
  const docgrid = document.getElementById("d-list");

  if (!docgrid) {
    console.warn("Element #doc-list not found in DOM.");
    return;
  }

  try {
    const pathResponse = await window.FilePathApi.Path();
    if (!pathResponse?.success || !Array.isArray(pathResponse.data) || pathResponse.data.length === 0) {
      showCustomAlert("Upload paths are not configured yet. Please set the source and destination paths first.");
      docgrid.innerHTML = "<p>Upload paths are not configured.</p>";
      return;
    }

    const pathConfig = pathResponse.data[0];
    sp = pathConfig?.sourcepath || "";
    dp = pathConfig?.destinationpath || "";

    if (!sp || !dp) {
      showCustomAlert("Source and destination paths must be configured before uploading files.");
      docgrid.innerHTML = "<p>Upload paths are incomplete.</p>";
      return;
    }

    const Doclist = await window.DocApi.Doc();
    const docarr = Doclist?.data;

    if (!Array.isArray(docarr) || docarr.length === 0) {
      docgrid.innerHTML = "<p>No documents found.</p>";
      return;
    }

    docgrid.innerHTML = docarr
      .map(
        (d) => `<label>
          <input type="checkbox" class="doc-checkbox" value="${d.doc}"> ${d.doc}
      </label>`,
      )
      .join("");

    docgrid.addEventListener("change", (event) => {
      if (selectedid != '') {
        if (event.target.classList.contains("doc-checkbox")) {

          if (event.target.checked) {
            const allCheckboxes = docgrid.querySelectorAll(".doc-checkbox");

            allCheckboxes.forEach((cb) => {
              if (cb !== event.target) {
                cb.checked = false;
              }
            });

            selecteddoc = event.target.value;
          } else {
            selecteddoc = "";
          }
        }
      }
      else {
        
        document.querySelectorAll('#d-list input.doc-checkbox').forEach(cb => cb.checked = false);

        return showCustomAlert("Kindly select patient id");
      }
    });
  } catch (err) {
    console.error("Failed to load documents:", err);
    docgrid.innerHTML = "<p>Error loading documents.</p>";
  }
});

document.getElementById("back").addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

document.getElementById("clear").addEventListener("click", () => {
  window.location.reload();
});


radioButtons.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    radiobtncheck = true;
    radiobtnvalue = event.target.value;
  });
});

// uhid.addEventListener("click", () => {
//   checkboxcheck = true;
//   checkboxvalue = uhid.value;
//   if (!uhid.checked) checkboxcheck = false;
//   if (checkboxbtn.checked) checkboxbtn.checked = false;
// });

// checkboxbtn.addEventListener("click", () => {
//   checkboxcheck = true;
//   if (!checkboxbtn.checked) checkboxcheck = false;
//   if (uhid.checked) uhid.checked = false;
// });

search.addEventListener("click", async () => {
  if (!radiobtncheck) return showCustomAlert("You should select one of the OP/IP/ER");

  if (!sp || !dp) {
    showCustomAlert("Upload paths are not configured. Please set them from settings first.");
    return;
  }

  const fileList = document.getElementById("fileList");
  fileList.innerHTML = '<div class="file-list-loading"><div class="spinner"></div><span>Loading files...</span></div>';
  filecountbadge.textContent = '0 / 0';
  //document.getElementById("filelistcount").textContent = '0';

  const folderPath = await window.electronAPI.selectFolder(sp);
  if (!folderPath || folderPath === sp) {
    showCustomAlert("You must select any folder");
        fileList.innerHTML="";
    return;
  }

  const folderName = folderPath.split(/[\\/]/).pop();

if (!folderName.toUpperCase().startsWith(radiobtnvalue.toUpperCase())) {
    showCustomAlert("The selected folder does not match the selected type "+radiobtnvalue+".");
        fileList.innerHTML="";
    return;
}

  const numbersOnly = radiobtnvalue != 'ER' ? folderName.replace(/\D/g, "") : folderName.split("_")[1];

  const response = await window.dbAPI.callOpPatientdata(radiobtnvalue, checkboxvalue, numbersOnly);
  const pid = document.getElementById("patientid");

  if (response.success) {
    if (!Array.isArray(response.data) || response.data.length === 0) {
      showCustomAlert("No patient records found for the selected folder.");
      fileList.innerHTML = '<p class="no-files">No patient records found.</p>';
      return;
    }

    pid.innerHTML = response.data
      .map((d) => `<label>
                    <input type="checkbox"
                     class="patient-chk"
                     data-name="${d.patient_name}" 
                     data-adate = "${d.registration_date}"
                     data-ddate = "${d.discharge_date == null ? "--/--/----" : d.discharge_date}"
                      data-filecount = "${d.filecount || 0}"
                     value="${d.num}"> ${d.num}</label>`)
      .join("");

    const result = await window.electronAPI.getImagesFromFolder(folderPath);
    if (!result.success) {
      console.error("Failed to read folder:", result.error);
      fileList.innerHTML = '<p class="no-files">Unable to load files from this folder.</p>';
      return;
    }

    displayFileList(result.images);
  } else {
    fileList.innerHTML = '<p class="no-files">No patient records found.</p>';
    showCustomAlert(response.error);
  }
});

document.getElementById("patientid").addEventListener("click", (event) => {
  if (event.target && event.target.classList.contains("patient-chk")) {
    if (event.target.checked) {
      selectedid = event.target.value;
      const allPatientCheckboxes =
        document.getElementById("patientid").querySelectorAll(".patient-chk");

      allPatientCheckboxes.forEach((checkbox) => {
        if (checkbox !== event.target) {
          checkbox.checked = false;
        }
      });
      document.getElementById("name").textContent = event.target.dataset.name;
      document.getElementById("a-date").textContent = event.target.dataset.adate;
      document.getElementById("d-date").textContent = event.target.dataset.ddate == null ? "--/--/----" : event.target.dataset.ddate;
      //document.getElementById("indexedCount").textContent = event.target.dataset.filecount || "0";
    }
    else {
      selectedid = "";
      document.getElementById("name").textContent = "--";
      document.getElementById("a-date").textContent = "--/--/----";
      document.getElementById("d-date").textContent = "--/--/----";
      //document.getElementById("indexedCount").textContent = "0";
    }
  }
});

function displayFileList(images) {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";
  filecountbadge.textContent = `0 / ${images.length}`;
  //document.getElementById("filelistcount").textContent = images.length;
  if (images.length === 0) {
    fileList.innerHTML =
      '<p class="no-files">No images found in this folder.</p>';
    return;
  }

  images.forEach((image, index) => {
    const item = document.createElement("div");
    item.classList.add("file-item");
    item.textContent = image.name;
    item.dataset.path = image.path;
    item.dataset.filename = image.name;

    item.addEventListener("click", () => {
      item.classList.toggle("active");

      let totalactivefilecount = document.querySelectorAll(".active").length;
      filecountbadge.textContent = `${totalactivefilecount} / ${images.length}`;

      if (item.classList.contains("active")) {
        showImagePreview(image.path, image.name);
      }
      if (selectallbtn.checked) selectallbtn.checked = false;
    });

    fileList.appendChild(item);
  });
}

async function showImagePreview(imagePath, imageName) {
  const preview = document.getElementById("imagePreview");
  const ext = (imageName.split('.').pop() || '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tif', 'tiff'].includes(ext);
  const isPdf = ext === 'pdf';

  if (isImage && ['tif', 'tiff'].includes(ext)) {
    preview.innerHTML = '<p class="preview-placeholder">Preparing preview...</p>';
    const result = await window.electronAPI.getFilePreview(imagePath, imageName);
    if (result.success) {
      preview.innerHTML = `
        <img 
            src="data:${result.mime};base64,${result.data}" 
            alt="${imageName}"
            onerror="this.parentElement.innerHTML='<p class=preview-error>Image could not be loaded.</p>'"
        />
        <p class="preview-label">${imageName}</p>
      `;
    } else {
      preview.innerHTML = `<p class="preview-error">Preview could not be generated.</p><p class="preview-label">${imageName}</p>`;
    }
    return;
  }

  if (isImage) {
    preview.innerHTML = `
        <img 
            src="file:///${imagePath}" 
            alt="${imageName}"
            onerror="this.parentElement.innerHTML='<p class=preview-error>Image could not be loaded.</p>'"
        />
        <p class="preview-label">${imageName}</p>
    `;
  } else if (isPdf) {
    preview.innerHTML = `
        <embed src="file:///${imagePath}" type="application/pdf" class="preview-pdf" />
        <p class="preview-label">${imageName}</p>
    `;
  } else {
    preview.innerHTML = `<p class="preview-error">Preview is not available for this file type.</p><p class="preview-label">${imageName}</p>`;
  }
}

selectallbtn.addEventListener("click", async () => {
  let totalfilecont = document.querySelectorAll(".file-item").length;
  if (selectallbtn.checked) {
    document
      .querySelectorAll(".file-item")
      .forEach((el) => el.classList.add("active"));
  } else {
    document
      .querySelectorAll(".file-item")
      .forEach((el) => el.classList.remove("active"));
  }
  let totalactivefilecount = document.querySelectorAll(".active").length;
  filecountbadge.textContent = `${totalactivefilecount} / ${totalfilecont}`;
});

// Modal Element DOM caching
const statusModal = document.getElementById("statusModal");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const progressCount = document.getElementById("progressCount");
const fileStatusList = document.getElementById("fileStatusList");
const closeStatusModal = document.getElementById("closeStatusModal");

// Close button on completion
closeStatusModal.addEventListener("click", () => {
  statusModal.classList.remove("show");
});

function initStatusModal(files) {
  fileStatusList.innerHTML = "";
  progressBar.style.width = "0%";
  progressPercent.textContent = "0%";
  progressCount.textContent = `Moving 0 of ${files.length} files...`;
  closeStatusModal.style.display = "none";

  files.forEach(file => {
    const item = document.createElement("div");
    item.classList.add("file-status-item");
    item.id = `status-item-${encodeURIComponent(file.textContent)}`;
    item.innerHTML = `
      <span class="file-name" title="${file.textContent}">${file.textContent}</span>
      <span class="file-state state-pending">
        <svg style="width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 4;" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" />
        </svg>
        <span>Pending</span>
      </span>
    `;
    fileStatusList.appendChild(item);
  });

  statusModal.classList.add("show");
}

function updateFileStatus(filename, state, details = "") {
  const item = document.getElementById(`status-item-${encodeURIComponent(filename)}`);
  if (!item) return;

  const stateSpan = item.querySelector(".file-state");
  stateSpan.className = `file-state state-${state}`;

  if (state === "moving") {
    stateSpan.innerHTML = `
      <svg style="width: 12px; height: 12px; animation: spin 1s linear infinite;" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-linecap="round" />
      </svg>
      <span>Moving...</span>
    `;
  } else if (state === "success") {
    stateSpan.innerHTML = `
      <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <span>Success</span>
    `;
  } else if (state === "error") {
    stateSpan.innerHTML = `
      <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      <span title="${details}">Failed</span>
    `;
  }
}

// Add animation keyframes dynamically if not present
if (!document.getElementById("spin-animation-style")) {
  const spinStyle = document.createElement("style");
  spinStyle.id = "spin-animation-style";
  spinStyle.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinStyle);
}

function updateOverallProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  if (current === total) {
    progressCount.textContent = `Completed! ${total} files indexed.`;
    closeStatusModal.style.display = "block";
  } else {
    progressCount.textContent = `Moving ${current} of ${total} files...`;
  }
}

async function animateFlyingFile(fileItem) {
  if (!fileItem) return;

  // Clone element position
  const rect = fileItem.getBoundingClientRect();
  const flyingEl = document.createElement("div");
  flyingEl.classList.add("flying-file");
  flyingEl.textContent = fileItem.textContent;

  // Add mini file icon
  flyingEl.insertAdjacentHTML("afterbegin", `
    <svg style="width:12px; height:12px; fill:currentColor;" viewBox="0 0 24 24">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
  `);

  flyingEl.style.left = `${rect.left}px`;
  flyingEl.style.top = `${rect.top}px`;
  flyingEl.style.width = `${rect.width}px`;
  flyingEl.style.height = `${rect.height}px`;

  document.body.appendChild(flyingEl);

  // Target coordinates
  // const target = document.getElementById("indexedCount");
  // const targetRect = target.getBoundingClientRect();

  // Force reflow
  flyingEl.offsetHeight;

  // Transition properties to fly to destination
  // flyingEl.style.left = `${targetRect.left + (targetRect.width / 2) - 50}px`;
  // flyingEl.style.top = `${targetRect.top + (targetRect.height / 2) - 15}px`;
  flyingEl.style.width = "100px";
  flyingEl.style.height = "30px";
  flyingEl.style.transform = "scale(0.2) rotate(45deg)";
  flyingEl.style.opacity = "0.2";

  flyingEl.addEventListener("transitionend", async () => {
    flyingEl.remove();

    // Add physics bump impact effect
    target.classList.add("bump-effect");

    setTimeout(() => {
      target.classList.remove("bump-effect");
    }, 300);
  });
}

function removeFileItemWithAnimation(fileItem) {
  if (!fileItem) return;
  fileItem.classList.add("collapsing-item");
  fileItem.style.height = `${fileItem.offsetHeight}px`;

  // Force layout
  fileItem.offsetHeight;

  fileItem.style.height = "0px";
  fileItem.style.paddingTop = "0px";
  fileItem.style.paddingBottom = "0px";
  fileItem.style.borderBottom = "none";

  setTimeout(() => {
    fileItem.remove();
  }, 400);
}

indexbtn.addEventListener("click", async () => {
  if (selectedid == '') return alert("Kindly select patient id");
  if (selecteddoc == '') return alert("Kindly select Document type");

  const activeFiles = document.getElementsByClassName('file-item active');
  const filesArray = Array.from(activeFiles);
  if (filesArray.length === 0) return alert("Kindly select at least one file to index");

  const folderpath = dp + "\\" + selectedid + "\\index";
  indexbtn.disabled = true;

  try {
    var dmrindexid = await window.IndexAPI.index(username, selectedid, selecteddoc);

    let processedCount = 0;
    const totalFiles = filesArray.length;
    initStatusModal(filesArray);
    var filecount  = 0;
    for (const fileItem of filesArray) {
      const filename = fileItem.textContent;
      updateFileStatus(filename, "moving");
      filecount++;
      try {
        var fileid = await window.IndexAPI.fileindex(
          dmrindexid.id,
          filecount,          
          filename,
          folderpath
        );
        if (fileid.success) {
          var filestatus = await window.fileAPI.moveFile(fileItem.dataset.path, folderpath, filename);
          if (filestatus.success) {
            updateFileStatus(filename, "success");

            // Capture and trigger flying particle animation immediately
            animateFlyingFile(fileItem);
            // Collapse the source list item immediately
            removeFileItemWithAnimation(fileItem);

            const preview = document.getElementById("imagePreview");
            const img = preview.querySelector("img");
            if (img && img.alt === filename) {
              preview.innerHTML = '<p class="preview-placeholder">Select a file to preview</p>';
            }

            // Update modal progress immediately
            processedCount++;
            updateOverallProgress(processedCount, totalFiles);

            // Update counts immediately excluding collapsing elements
            let totalactivefilecount = document.querySelectorAll(".file-item.active:not(.collapsing-item)").length;
            let totalfilecont = document.querySelectorAll(".file-item:not(.collapsing-item)").length;

            filecountbadge.textContent = `${totalactivefilecount} / ${totalfilecont}`;
            //document.getElementById("filelistcount").textContent = totalfilecont;

            // Show "no files" message if file list is fully cleared
            if (totalfilecont === 0) {
              setTimeout(() => {
                const fileList = document.getElementById('fileList');
                if (fileList.querySelectorAll(".file-item").length === 0) {
                  fileList.innerHTML = '<p class="no-files">No images found in this folder.</p>';
                }
              }, 500);
            }

          } else {
            updateFileStatus(filename, "error", filestatus.error || "Move failed");
            processedCount++;
            updateOverallProgress(processedCount, totalFiles);
          }
        } else {
          updateFileStatus(filename, "error", fileid.error || "Database indexing failed");
          processedCount++;
          updateOverallProgress(processedCount, totalFiles);
        }
      } catch (fileErr) {
        console.error(`Failed to index file ${fileItem.id}:`, fileErr);
        updateFileStatus(filename, "error", fileErr.message || "Unknown error");
        processedCount++;
        updateOverallProgress(processedCount, totalFiles);
      }
    }

    // Uncheck select all check box on completion
    selectallbtn.checked = false;
    // getindexedCount();

  } catch (err) {
    console.error("Indexing failed:", err);
    alert("Indexing failed. Please try again.");
    statusModal.classList.remove("show");
  } finally {
    indexbtn.disabled = false;
  }
});

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
function closeCustomAlert() {
  if (alertModal) alertModal.classList.remove("show");
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