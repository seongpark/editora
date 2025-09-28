function createEditor(container) {
  container.classList.add("editor-wrapper");
  // Editor HTML structure
  container.innerHTML = `
    <div class="editor-toolbar p-2 rounded-top">
      <!-- Format Picker -->
      <div class="format-picker me-2">
        <button type="button" class="btn btn-light" id="format-button">본문</button>
        <div class="format-dropdown" id="formatDropdown"></div>
      </div>

      <div class="divider"></div>

      <!-- Toolbar Buttons -->
      <button type="button" class="btn btn-light me-2" data-command="bold"><i class="fas fa-bold"></i></button>
      <button type="button" class="btn btn-light me-2" data-command="italic"><i class="fas fa-italic"></i></button>
      <button type="button" class="btn btn-light me-2" data-command="underline"><i class="fas fa-underline"></i></button>
      <button type="button" class="btn btn-light me-2" data-command="strikeThrough"><i class="fas fa-strikethrough"></i></button>
      <div class="link-picker me-2">
        <button type="button" class="btn btn-light"><i class="fas fa-link"></i></button>
        <div class="link-dropdown" id="linkDropdown">
          <input type="text" class="form-control form-control-sm" placeholder="URL 입력" id="linkUrlInput" />
          <button type="button" class="btn btn-primary btn-sm ms-2" id="confirmLinkButton">확인</button>
        </div>
      </div>
      <div class="color-picker me-2">
        <button type="button" class="btn btn-light"><i class="fas fa-palette"></i></button>
        <div class="color-dropdown" id="colorDropdown"></div>
      </div>

      <div class="divider"></div>

      <button type="button" class="btn btn-light me-2" data-command="insertHorizontalRule"><i class="fas fa-minus"></i></button>

      <button type="button" class="btn btn-light me-2" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
      <button type="button" class="btn btn-light me-2" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>

      <button type="button" class="btn btn-light me-2" data-command="justifyLeft"><i class="fas fa-align-left"></i></button>
      <button type="button" class="btn btn-light me-2" data-command="justifyCenter"><i class="fas fa-align-center"></i></button>
      <button type="button" class="btn btn-light me-2" data-command="justifyRight"><i class="fas fa-align-right"></i></button>

      <div class="divider"></div>

      <div class="table-picker me-2">
        <button type="button" class="btn btn-light"><i class="fas fa-table"></i></button>
        <div class="table-dropdown" id="tableDropdown">
          <div class="grid-selector" id="gridSelector"></div>
          <p class="text-center mt-2" id="dimensionText">0 x 0</p>
        </div>
      </div>
      <div class="youtube-picker me-2">
        <button type="button" class="btn btn-light"><i class="fab fa-youtube"></i></button>
        <div class="youtube-dropdown" id="youtubeDropdown">
          <input type="text" class="form-control form-control-sm" placeholder="유튜브 URL 입력" id="youtubeUrlInput" />
          <button type="button" class="btn btn-primary btn-sm ms-2" id="confirmYouTubeButton">삽입</button>
        </div>
      </div>
    </div>
    <div id="editor" class="form-control" contenteditable="true">
      <p>여기에 내용을 입력하세요.</p>
    </div>
  `;

  const editor = container.querySelector("#editor");
  const hiddenTextarea = document.getElementById("hiddenTextarea");
  let savedRange = null;

  if (hiddenTextarea) {
    // Sync editor content to hidden textarea on input
    editor.addEventListener("input", () => {
      hiddenTextarea.value = editor.innerHTML;
    });
    hiddenTextarea.value = editor.innerHTML;
  }

  // -------------------- Dropdown Handling --------------------
  function hideDropdown(dropdown) {
    if (
      !dropdown ||
      dropdown.style.display === "none" ||
      dropdown.style.display === ""
    )
      return;
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

  function toggleDropdown(dropdown, displayType = "block") {
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

  // 새로운 정렬 함수 - 더 단순하고 확실한 방법
  function applyAlignment(alignmentType) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // 에디터에 포커스
    editor.focus();

    // 현재 선택된 범위 가져오기
    const range = selection.getRangeAt(0);

    // 선택된 텍스트의 부모 블록 요소 찾기
    let blockElement = range.commonAncestorContainer;

    // 텍스트 노드인 경우 부모 요소로
    if (blockElement.nodeType === Node.TEXT_NODE) {
      blockElement = blockElement.parentElement;
    }

    // 블록 요소가 아니면 가장 가까운 블록 요소 찾기
    while (
      blockElement &&
      blockElement !== editor &&
      !isBlockLevelElement(blockElement)
    ) {
      blockElement = blockElement.parentElement;
    }

    // 적절한 블록 요소를 찾지 못한 경우 새로운 p 태그로 감싸기
    if (!blockElement || blockElement === editor) {
      document.execCommand("formatBlock", false, "p");
      // 다시 시도
      const newSelection = window.getSelection();
      if (newSelection.rangeCount) {
        const newRange = newSelection.getRangeAt(0);
        blockElement = newRange.commonAncestorContainer;
        if (blockElement.nodeType === Node.TEXT_NODE) {
          blockElement = blockElement.parentElement;
        }
      }
    }

    if (blockElement && blockElement !== editor) {
      // 정렬 스타일 적용
      const currentAlign = blockElement.style.textAlign;

      if (currentAlign === alignmentType) {
        // 이미 같은 정렬이면 제거 (기본값으로)
        blockElement.style.textAlign = "";
      } else {
        // 새로운 정렬 적용
        blockElement.style.textAlign = alignmentType;
      }
    }

    // 툴바 업데이트
    updateToolbar();
  }

  // 블록 레벨 요소인지 확인하는 함수 개선
  function isBlockLevelElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    const blockTags = [
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "DIV",
      "BLOCKQUOTE",
      "PRE",
      "UL",
      "OL",
      "LI",
      "TD",
      "TH",
      "TR",
      "TABLE",
    ];

    return (
      blockTags.includes(element.tagName) ||
      window.getComputedStyle(element).display === "block"
    );
  }

  function isBlockElement(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const display = window.getComputedStyle(node).display;
    return (
      display === "block" || display === "list-item" || display === "table-cell"
    );
  }

  function insertNodeAtCursor(node) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);

    if (
      node.tagName === "TABLE" ||
      node.classList.contains("youtube-video-container")
    ) {
      const newParagraph = document.createElement("p");
      newParagraph.innerHTML = "<br>";
      node.insertAdjacentElement("afterend", newParagraph);

      const newRange = document.createRange();
      newRange.setStart(newParagraph, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  // -------------------- Toolbar Update --------------------
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
    ];
    commands.forEach((command) => {
      const button = container.querySelector(
        `button[data-command="${command}"]`
      );
      if (button) {
        button.classList.toggle("active", document.queryCommandState(command));
      }
    });

    // 정렬 버튼 활성 상태 업데이트 - 개선된 로직
    updateAlignmentButtons();

    const formatButton = container.querySelector("#format-button");
    if (formatButton) {
      let blockTag = document.queryCommandValue("formatBlock");
      if (blockTag === "" || blockTag === "div") blockTag = "p";
      const formatName = formats[blockTag] || "본문";
      formatButton.textContent = formatName;
    }
  }

  // 정렬 버튼 상태 업데이트 함수
  function updateAlignmentButtons() {
    const selection = window.getSelection();
    let currentAlign = "";

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;

      // 텍스트 노드인 경우 부모 요소로
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }

      // 블록 요소 찾기
      while (element && element !== editor && !isBlockLevelElement(element)) {
        element = element.parentElement;
      }

      if (element && element !== editor) {
        currentAlign = element.style.textAlign || "";
      }
    }

    // 버튼 상태 업데이트
    const alignButtons = {
      justifyLeft: "left",
      justifyCenter: "center",
      justifyRight: "right",
    };

    Object.entries(alignButtons).forEach(([command, alignValue]) => {
      const button = container.querySelector(
        `button[data-command="${command}"]`
      );
      if (button) {
        button.classList.toggle("active", currentAlign === alignValue);
      }
    });
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

  // -------------------- Button Events --------------------
  container.querySelectorAll("button[data-command]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const command = button.dataset.command;

      // 정렬 명령어 처리
      if (command === "justifyLeft") {
        applyAlignment("left");
      } else if (command === "justifyCenter") {
        applyAlignment("center");
      } else if (command === "justifyRight") {
        applyAlignment("right");
      } else {
        // 기타 명령어
        execCmd(command);
      }
    });
  });

  // -------------------- Pickers --------------------
  const formatPicker = container.querySelector(".format-picker");
  const formatDropdown = container.querySelector("#formatDropdown");
  const formatButton = container.querySelector("#format-button");

  const linkPicker = container.querySelector(".link-picker");
  const linkDropdown = container.querySelector("#linkDropdown");
  const linkUrlInput = container.querySelector("#linkUrlInput");
  const confirmLinkButton = container.querySelector("#confirmLinkButton");

  const youtubePicker = container.querySelector(".youtube-picker");
  const youtubeDropdown = container.querySelector("#youtubeDropdown");
  const youtubeUrlInput = container.querySelector("#youtubeUrlInput");
  const confirmYouTubeButton = container.querySelector("#confirmYouTubeButton");

  const colorPicker = container.querySelector(".color-picker");
  const colorDropdown = container.querySelector("#colorDropdown");

  const tablePicker = container.querySelector(".table-picker");
  const tableDropdown = container.querySelector("#tableDropdown");

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
  if (linkPicker) {
    linkPicker.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      saveSelection();
      toggleDropdown(linkDropdown, "flex");
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
  }

  // YouTube Picker
  function getYouTubeVideoId(url) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  youtubePicker.querySelector("button").addEventListener("click", (e) => {
    e.stopPropagation();
    saveSelection();
    toggleDropdown(youtubeDropdown, "flex");
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
      const videoContainer = document.createElement("div");
      videoContainer.className = "youtube-video-container";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.title = "YouTube video player";
      iframe.frameBorder = "0";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      videoContainer.appendChild(iframe);
      insertNodeAtCursor(videoContainer);
    }
    hideDropdown(youtubeDropdown);
    youtubeUrlInput.value = "";
  });

  // Table Picker
  tablePicker.querySelector("button").addEventListener("click", (e) => {
    e.stopPropagation();
    saveSelection();
    toggleDropdown(tableDropdown, "block");
  });

  const gridSelector = container.querySelector("#gridSelector");
  const dimensionText = container.querySelector("#dimensionText");
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
      restoreSelection();
      createTable(rows, cols);
    }
  });

  // Color Picker
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
    toggleDropdown(colorDropdown, "grid");
  });

  // -------------------- Global Click Listener --------------------
  document.addEventListener("click", (e) => {
    if (!formatPicker.contains(e.target)) hideDropdown(formatDropdown);
    if (!linkPicker.contains(e.target)) hideDropdown(linkDropdown);
    if (!youtubePicker.contains(e.target)) hideDropdown(youtubeDropdown);
    if (!colorPicker.contains(e.target)) hideDropdown(colorDropdown);
    if (!tablePicker.contains(e.target)) hideDropdown(tableDropdown);
  });

  return {
    editorElement: editor,
    getContent: function () {
      return editor.innerHTML;
    },
  };
}
