const editor = document.getElementById("editor");
let savedRange = null;

// -------------------- Dropdown Handling --------------------
function hideDropdown(dropdown) {
  if (!dropdown || (dropdown.style.display === "none" || dropdown.style.display === "")) return;

  dropdown.classList.add("hiding");
  dropdown.addEventListener(
    "animationend",
    () => {
      dropdown.style.display = "none";
      dropdown.classList.remove("hiding");
    },
    { once: true }
  );
}

function toggleDropdown(dropdown, displayType = 'block') {
  if (dropdown.style.display === "none" || dropdown.style.display === "") {
    dropdown.style.display = displayType;
  } else {
    hideDropdown(dropdown);
  }
}

// -------------------- Editor Basic Functions --------------------
function execCmd(command, value = null) {
  document.execCommand(command, false, value);
  updateToolbar();
}

function insertNodeAtCursor(node) {
  restoreSelection();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);

  if (node.tagName === 'TABLE' || node.classList.contains('youtube-video-container')) {
    const newParagraph = document.createElement('p');
    newParagraph.innerHTML = '<br>';
    node.insertAdjacentElement('afterend', newParagraph);

    const newRange = document.createRange();
    newRange.setStart(newParagraph, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  } else {
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// -------------------- Link & Media Functions --------------------
function getYouTubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// -------------------- Toolbar Update & Selection Handling --------------------
editor.addEventListener("keyup", updateToolbar);
editor.addEventListener("mouseup", updateToolbar);
editor.addEventListener("focus", updateToolbar);
editor.addEventListener("touchend", updateToolbar);

function updateToolbar() {
  const commands = [
    "bold",
    "italic",
    "underline",
    "strikeThrough",
    "insertUnorderedList",
    "insertOrderedList",
    "justifyLeft",
    "justifyCenter",
    "justifyRight",
  ];
  commands.forEach((command) => {
    const button = document.querySelector(`button[onclick*="${command}"]`);
    if (button) {
      button.classList.toggle("active", document.queryCommandState(command));
    }
  });

  const formatButton = document.getElementById("format-button");
  if (formatButton) {
    let blockTag = document.queryCommandValue("formatBlock");
    if (blockTag === "" || blockTag === "div") {
      blockTag = "p";
    }
    const formatName = formats[blockTag] || "본문";
    formatButton.textContent = formatName;
  }
}

function saveSelection() {
  const sel = window.getSelection();
  if (sel.getRangeAt && sel.rangeCount) {
    savedRange = sel.getRangeAt(0);
  }
}

function restoreSelection() {
  editor.focus();
  if (savedRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }
}

// -------------------- Pickers & Dropdowns --------------------
const formatPicker = document.querySelector(".format-picker");
const formatDropdown = document.getElementById("formatDropdown");
const formatButton = document.getElementById("format-button");

const linkPicker = document.querySelector(".link-picker");
const linkDropdown = document.getElementById("linkDropdown");
const linkUrlInput = document.getElementById("linkUrlInput");
const confirmLinkButton = document.getElementById("confirmLinkButton");

const youtubePicker = document.querySelector(".youtube-picker");
const youtubeDropdown = document.getElementById("youtubeDropdown");
const youtubeUrlInput = document.getElementById("youtubeUrlInput");
const confirmYouTubeButton = document.getElementById("confirmYouTubeButton");

const colorPicker = document.querySelector(".color-picker");
const colorDropdown = document.getElementById("colorDropdown");

const tablePicker = document.querySelector(".table-picker");
const tableDropdown = document.getElementById("tableDropdown");

// Format Picker
const formats = {
  p: "본문",
  h1: "제목 1",
  h2: "제목 2",
  h3: "제목 3",
  h4: "제목 4",
  h5: "제목 5",
  h6: "제목 6",
};

Object.entries(formats).forEach(([tag, name]) => {
  const option = document.createElement("div");
  option.className = "format-option";
  option.textContent = name;
  option.addEventListener("mousedown", (e) => {
    e.preventDefault();
    execCmd("formatBlock", tag);
    hideDropdown(formatDropdown);
  });
  formatDropdown.appendChild(option);
});

formatButton.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown(formatDropdown);
});

// Link Picker
linkPicker.querySelector("button").addEventListener("click", (e) => {
  e.stopPropagation();
  saveSelection();
  toggleDropdown(linkDropdown, 'flex');
});

confirmLinkButton.addEventListener("click", (e) => {
  e.stopPropagation();
  restoreSelection();
  if (linkUrlInput.value) {
    execCmd("createLink", linkUrlInput.value);
  }
  hideDropdown(linkDropdown);
  linkUrlInput.value = "";
});

// YouTube Picker
youtubePicker.querySelector("button").addEventListener("click", (e) => {
  e.stopPropagation();
  saveSelection();
  toggleDropdown(youtubeDropdown, 'flex');
});

confirmYouTubeButton.addEventListener("click", (e) => {
  e.stopPropagation();
  restoreSelection();
  const url = youtubeUrlInput.value;
  if (!url) {
    hideDropdown(youtubeDropdown);
    return;
  }

  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    alert("유효하지 않은 유튜브 URL입니다.");
  } else {
    const container = document.createElement("div");
    container.className = "youtube-video-container";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.title = "YouTube video player";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    insertNodeAtCursor(container);
  }
  hideDropdown(youtubeDropdown);
  youtubeUrlInput.value = "";
});

// Table Picker
tablePicker.querySelector("button").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown(tableDropdown, 'grid');
});

// Table Creation
const gridSelector = document.getElementById("gridSelector");
const dimensionText = document.getElementById("dimensionText");
const maxRows = 10,
  maxCols = 10;

function createTable(rows, cols) {
  const table = document.createElement("table");
  table.className = "table table-bordered";
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < cols; j++) {
      const td = document.createElement("td");
      td.innerHTML = "&nbsp;";
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  insertNodeAtCursor(table);
  hideDropdown(tableDropdown);
}

for (let i = 0; i < maxRows * maxCols; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  gridSelector.appendChild(cell);
}

const cells = Array.from(gridSelector.children);

function highlightCells(rows, cols) {
  cells.forEach((cell, i) => {
    const r = Math.floor(i / maxCols) + 1;
    const c = (i % maxCols) + 1;
    cell.classList.toggle("active", r <= rows && c <= cols);
  });
}

gridSelector.addEventListener("mouseover", (e) => {
  if (e.target.classList.contains("cell")) {
    const index = parseInt(e.target.dataset.index, 10);
    const rows = Math.floor(index / maxCols) + 1;
    const cols = (index % maxCols) + 1;
    highlightCells(rows, cols);
    dimensionText.textContent = `${rows} x ${cols}`;
  }
});

gridSelector.addEventListener("click", (e) => {
  if (e.target.classList.contains("cell")) {
    const index = parseInt(e.target.dataset.index, 10);
    const rows = Math.floor(index / maxCols) + 1;
    const cols = (index % maxCols) + 1;
    createTable(rows, cols);
  }
});

// Color Palette
const colors = [
  "#4285F4",
  "#34A853",
  "#FBBC04",
  "#EA4335",
  "#F0F2F5",
  "#CED4DA",
  "#495057",
  "#212529",
  "#A0B0D0",
  "#8BC34A",
  "#FFC107",
  "#FF5722",
  "#673AB7",
  "#00BCD4",
  "#E91E63",
  "#795548",
];

colors.forEach((c) => {
  const div = document.createElement("div");
  div.style.backgroundColor = c;
  div.addEventListener("mousedown", (e) => {
    e.preventDefault();
    restoreSelection();
    execCmd("foreColor", c);
    hideDropdown(colorDropdown);
  });
  colorDropdown.appendChild(div);
});

colorPicker.querySelector("button").addEventListener("click", (e) => {
  e.stopPropagation();
  saveSelection();
  toggleDropdown(colorDropdown, 'grid');
});

// -------------------- Global Click Listener --------------------
document.addEventListener("click", (e) => {
  if (!formatPicker.contains(e.target)) hideDropdown(formatDropdown);
  if (!linkPicker.contains(e.target)) hideDropdown(linkDropdown);
  if (!youtubePicker.contains(e.target)) hideDropdown(youtubeDropdown);
  if (!colorPicker.contains(e.target)) hideDropdown(colorDropdown);
  if (!tablePicker.contains(e.target)) hideDropdown(tableDropdown);
});