import { createDemoPages, icon, sampleImage } from "./demo-data.js";

const $ = (id) => document.getElementById(id);
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const state = {
  pages: createDemoPages(),
  page: 1,
  panel: 1,
  editing: false,
  view: "script",
  running: false,
  changed: new Set(),
  title: "森林里的来信",
  style: "水彩风格",
  source: "demo",
  reviewFailed: false,
  failNext: false,
  zoom: 1,
  story:
    "一个关于来信与重逢的故事。以安静的森林为背景，通过镜头和留白表现情绪。",
  cover: false,
  reference: null,
  version: "latest",
};
let toastTimer;
let dialogOpener;
const statusLabels = {
  done: "已成图",
  pending: "待生成",
  running: "生成中",
  failed: "生成失败",
};

function toast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 4000);
}

function updateSaveStatus() {
  $("save-status").textContent =
    state.source === "comicbrain"
      ? state.reviewFailed
        ? "review 草稿保存失败 · 演示"
        : "review 草稿已保存 · 演示"
      : state.changed.size
        ? "已修改 · 演示"
        : "";
}

function renderPages() {
  $("page-select").innerHTML = state.pages
    .map(
      (page, index) =>
        `<option value="${index}">第 ${index + 1} / ${state.pages.length} 页 · ${statusLabels[page.status]}</option>`,
    )
    .join("");
  $("page-select").value = String(state.page);
  $("page-select").disabled = state.running;
}

function renderCanvas() {
  const page = state.pages[state.page];
  $("script-view").setAttribute("aria-pressed", state.view === "script");
  $("image-view").setAttribute("aria-pressed", state.view === "image");
  const sheet = $("comic-sheet");
  sheet.style.width = `min(100%, ${490 * state.zoom}px)`;
  if (state.view === "script") {
    sheet.innerHTML = `<div class="sheet-heading"><h2>${escapeHTML(state.title)}</h2></div><div class="panels">${page.panels.map((text, index) => `<button class="comic-panel ${state.editing && state.panel === index ? "selected" : ""}" data-panel="${index}" aria-pressed="${state.editing && state.panel === index}" aria-label="编辑第 ${index + 1} 格"><span class="panel-kicker"><span>第 ${String(index + 1).padStart(2, "0")} 格</span><span>${state.editing && state.panel === index ? "编辑中" : ""}</span></span><span class="panel-copy">${escapeHTML(text)}</span></button>`).join("")}</div><div class="sheet-footer">点击分镜即可编辑</div>`;
  } else if (page.status === "done") {
    sheet.innerHTML = `<div class="image-preview"><div class="version-selector"><label for="version">图片版本</label><select id="version"><option value="latest">当前版本 · 演示</option><option value="previous">上一版本 · 演示</option></select></div><img src="${sampleImage}" alt="仓库现有的中文漫画示例，用于演示成图预览"><div class="modal-note">这里使用仓库已有示例图演示预览；并非当前分镜生成的图片。两个版本入口复用同一素材。</div>${state.changed.has(state.page) ? '<div class="modal-note">分镜已修改，成图可能未同步。旧图保留供参考。</div>' : ""}</div>`;
    $("version").value = state.version;
    $("version").addEventListener("change", (event) => {
      state.version = event.target.value;
      toast("已切换演示版本；本原型复用同一张示例素材。");
    });
  } else {
    sheet.innerHTML = `<div class="empty-image">${icon("image")}<h2>${page.status === "running" ? "正在演示生成流程" : page.status === "failed" ? "这一页尚未生成成功" : "画面，等待故事发生"}</h2><p>${page.status === "failed" ? "已完成的页面会保留，可以单独重试这一页。" : "分镜准备好后，就可以把文字变成画面。"}</p><span class="field-help">使用右上角“${page.status === "failed" ? "重试本页" : "生成本页"}”</span></div>`;
  }
}

function renderInspector() {
  const text = state.pages[state.page].panels[state.panel];
  $("inspector-page").textContent = String(state.page + 1).padStart(2, "0");
  $("panel-heading").textContent =
    `第 ${String(state.panel + 1).padStart(2, "0")} 格`;
  $("panel-text").value = text;
  $("panel-text").disabled = state.running;
  $("character-count").textContent = `${Array.from(text).length} 字`;
  $("editor-note").innerHTML =
    state.source === "comicbrain" && state.reviewFailed
      ? `${icon("info")}<div><p>review 草稿保存失败（演示）。<br>修改仍保留在当前页面。</p><button class="quiet-button" data-action="retry-review">重试保存</button></div>`
      : state.changed.has(state.page) &&
          state.pages[state.page].status === "done"
        ? "<p>分镜已修改，成图尚未更新。</p>"
        : "";
  $("editor-note").hidden = !$("editor-note").textContent;
}

function renderTask() {
  const completed = state.pages.filter((page) => page.status === "done").length;
  const remaining = state.pages.length - completed;
  const failed = state.pages.filter((page) => page.status === "failed").length;
  const runningIndex = state.pages.findIndex(
    (page) => page.status === "running",
  );
  document.body.classList.toggle("running", state.running);
  $("task-title").textContent = state.running
    ? `正在生成第 ${runningIndex + 1} 页 · 演示`
    : failed
      ? `${failed} 页生成失败，已完成页面已保留`
      : remaining
        ? "让故事，从分镜走向画面"
        : "所有页面已完成 · 演示";
  $("task-description").textContent = state.running
    ? `已完成 ${completed} / ${state.pages.length} · 生成期间暂不可切页或编辑`
    : `${completed} 页已成图${remaining ? `，${remaining} 页待生成` : " · 可以查看成图或制作封面"}`;
  document.querySelector(".taskbar").hidden =
    !state.running && !failed && !state.reviewFailed;
  if (state.reviewFailed && !state.running && !failed) {
    $("task-title").textContent = "草稿保存失败，修改仍保留在当前演示";
    $("task-description").innerHTML =
      '<button class="quiet-button" data-action="retry-review">重试保存</button>';
  }
  if (failed && !state.running) {
    $("task-description").innerHTML =
      '<button class="quiet-button" data-action="resume">重试未完成页面</button>';
  }
  $("generate-page").disabled = state.running;
  $("generate-label").textContent =
    state.pages[state.page].status === "done"
      ? "重新生成本页"
      : state.pages[state.page].status === "failed"
        ? "重试本页"
        : "生成本页";
  $("previous-page").disabled = state.running || state.page === 0;
  $("next-page").disabled =
    state.running || state.page === state.pages.length - 1;
}

function render() {
  const page = state.pages[state.page];
  $("project-name").textContent = state.title;
  $("page-subtitle").textContent = page.title;
  updateSaveStatus();
  renderPages();
  renderCanvas();
  renderInspector();
  renderTask();
}

function setPage(index) {
  if (state.running || index < 0 || index >= state.pages.length) return;
  state.page = index;
  state.panel = 0;
  state.version = "latest";
  render();
  $("canvas-area").scrollTop = 0;
  closeEditor(false);
}

function openDialog(title, content, onReady) {
  dialogOpener = document.activeElement;
  $("dialog-title").textContent = title;
  $("dialog-content").innerHTML = content;
  if (!$("workspace-dialog").open) $("workspace-dialog").showModal();
  onReady?.();
}
function closeDialog() {
  $("workspace-dialog").close();
}
function modalActions(label) {
  return `<div class="dialog-actions"><button type="button" class="quiet-button" data-action="close">取消</button><button type="submit" class="primary-button">${label}</button></div>`;
}
function guardGeneration(action) {
  if (state.running) {
    toast("演示任务进行中。为避免结果写入错误作品，请完成后再操作。");
    return;
  }
  action();
}

async function generate(batch, reset = false) {
  if (state.running) return;
  if (reset) {
    state.pages.forEach((page) => {
      page.status = "pending";
    });
    state.changed.clear();
  }
  const targets = batch
    ? state.pages
        .map((page, index) => (page.status !== "done" ? index : -1))
        .filter((index) => index !== -1)
    : [state.page];
  if (!targets.length) return;
  state.running = true;
  for (const index of targets) {
    state.pages[index].status = "running";
    render();
    await new Promise((resolve) => setTimeout(resolve, 850));
    if (state.failNext) {
      state.pages[index].status = "failed";
      state.failNext = false;
    } else {
      state.pages[index].status = "done";
      state.changed.delete(index);
    }
  }
  state.running = false;
  render();
  toast(
    state.pages.some((page) => page.status === "failed")
      ? "演示：生成失败。其余结果已保留，可点击“生成剩余”继续。"
      : "演示流程完成。成图视图使用仓库现有示例，未调用 AI。",
  );
}

function newProject() {
  openDialog(
    "开始一个新故事",
    `<form id="new-form" class="dialog-body"><p>先写下故事，再把它展开成一页页分镜。</p><label>作品名称<input name="title" required maxlength="60" placeholder="给你的故事起个名字" value="未命名作品"></label><label>故事描述<textarea id="new-story" name="story" rows="4" required placeholder="描述角色、场景和发生的事情……"></textarea></label><div class="form-row"><label>漫画风格<select name="style"><option>水彩风格</option><option>美式漫画</option><option>日式少年漫画</option></select></label><label>漫画语言<select><option>中文</option><option>English</option></select></label><label>页数<select name="count"><option>3</option><option>6</option></select></label></div><details><summary>更多设置</summary><label>每页行数<select><option>3</option><option>4</option></select></label><p>布局参数仅作视觉演示，不改变示例分镜。</p></details><div class="modal-note">演示将载入示例分镜，不根据描述调用 AI。原有作品和会话不受影响。快捷键：Ctrl / ⌘ + Enter。</div>${modalActions("生成分镜（演示）")}</form>`,
    () => {
      $("new-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        state.title = String(data.get("title")).trim() || "未命名作品";
        state.story = String(data.get("story"));
        state.style = String(data.get("style"));
        state.pages = createDemoPages()
          .slice(0, Number(data.get("count")))
          .map((page) => ({ ...page, status: "pending" }));
        state.page = 0;
        state.panel = 0;
        state.view = "script";
        state.source = "demo";
        state.reviewFailed = false;
        state.changed.clear();
        closeEditor(false);
        state.cover = false;
        closeDialog();
        render();
        toast("已载入示例分镜，仅保留在当前原型中。");
      });
      $("new-story").addEventListener("keydown", (event) => {
        if (event.isComposing || event.keyCode === 229) return;
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          $("new-form").requestSubmit();
        }
      });
    },
  );
}

function storyDialog() {
  openDialog(
    "故事与设定",
    `<form id="story-form" class="dialog-body"><label>原始故事<textarea name="story" rows="4">${escapeHTML(state.story)}</textarea></label><div class="form-row"><label>漫画风格<select name="style"><option>水彩风格</option><option>美式漫画</option><option>日式少年漫画</option></select></label><label>漫画语言<select><option>中文</option><option>English</option></select></label></div><label>参考图片<input id="reference-file" type="file" accept="image/png,image/jpeg,image/webp"></label><div id="reference-container">${state.reference ? `<img class="reference-preview" src="${state.reference}" alt="本次演示上传的参考图">` : "<p>仅在当前原型内预览，不上传到服务器。</p>"}</div><button type="button" class="outline-button" id="optimize-story">查看优化建议（演示）</button><div id="optimization"></div><div class="modal-note">设置只在本次演示内保留；改变语言或风格不会自动生成图片。</div>${modalActions("保存演示设定")}</form>`,
    () => {
      $("story-form").elements.style.value = state.style;
      $("reference-file").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 10 * 1024 * 1024
        ) {
          toast("请选取不超过 10MB 的 PNG、JPEG 或 WebP 图片。");
          return;
        }
        if (state.reference) URL.revokeObjectURL(state.reference);
        state.reference = URL.createObjectURL(file);
        $("reference-container").innerHTML =
          `<img class="reference-preview" src="${state.reference}" alt="本次演示上传的参考图">`;
      });
      $("optimize-story").addEventListener("click", () => {
        const current = $("story-form").elements.story.value;
        $("optimization").innerHTML =
          `<div class="modal-note"><strong>优化建议 · 非 AI 输出</strong><p>补充场景、角色动作和对白，有助于把故事展开成分镜。原文不会自动覆盖。</p><button type="button" id="apply-optimization" class="quiet-button">采用示例补充</button></div>`;
        $("apply-optimization").addEventListener("click", () => {
          $("story-form").elements.story.value =
            `${current}\n镜头要求：交代环境，突出角色动作，预留对白空间。`;
          toast("已采用示例补充，你仍可以继续编辑。");
        });
      });
      $("story-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        state.story = String(data.get("story"));
        state.style = String(data.get("style"));
        closeDialog();
        render();
        toast("设定已在演示内更新。");
      });
    },
  );
}

function importDialog() {
  openDialog(
    "从 ComicBrain 导入",
    `<form id="import-form" class="dialog-body"><p>选择章节，直接进入分镜编辑，无需重新生成脚本。</p><div class="section-heading"><h2>可导入章节</h2><button type="button" class="quiet-button" id="refresh-import">刷新</button></div><label class="dialog-item active"><span>${icon("book")}</span><div><strong>示例系列 / 示例章节</strong><small>6 页分镜 · 包含封面描述 · 演示数据</small></div></label><label class="checkbox-label"><input name="failure" type="checkbox">演示 review 草稿保存失败状态</label><div class="modal-note">这是虚构的导入列表，不读取 ComicBrain。正式接入后，修改仅保存为 review 草稿，不自动写回正史。</div>${modalActions("载入示例分镜")}</form>`,
    () => {
      $("refresh-import").addEventListener("click", () =>
        toast("演示列表已刷新；没有请求工作区。"),
      );
      $("import-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        state.source = "comicbrain";
        state.reviewFailed = data.has("failure");
        state.title = "示例章节 · ComicBrain";
        state.pages = createDemoPages();
        state.page = 1;
        state.panel = 1;
        state.changed.clear();
        state.view = "script";
        closeDialog();
        render();
        toast(
          state.reviewFailed
            ? "演示：review 保存失败，可在右侧重试。"
            : "已载入示例章节。没有读取或改写 ComicBrain。",
        );
      });
    },
  );
}

function settingsDialog() {
  openDialog(
    "模型与界面设置",
    `<form id="settings-form" class="dialog-body"><p>模型配置集中在这里，让画布只关注创作。</p><label>模型来源<select id="provider"><option value="google">Google Gemini</option><option value="openai">OpenAI / 兼容接口</option><option value="codex">Codex（仅本地）</option></select></label><div id="provider-help" class="modal-note">原型不读取或保存任何凭据；正式配置沿用现有控制台。</div><div class="form-row"><label>文本模型<select><option>文本模型 · 示例</option></select></label><label>图片模型<select><option>图片模型 · 示例</option></select></label></div><details><summary>高级参数</summary><label>Temperature<input type="number" value="0.7" min="0" max="2" step="0.1"></label><p>仅演示设置布局，不影响生成。</p></details><div class="form-row"><label>界面主题<select><option>浅色 · 本稿</option></select></label><label>界面语言<select><option>中文 · 本稿</option></select></label></div><div class="dialog-actions"><button type="submit" class="primary-button">完成</button></div></form>`,
    () => {
      $("provider").addEventListener("change", (event) => {
        $("provider-help").textContent =
          event.target.value === "codex"
            ? "Codex 依赖本机凭据，仅限 localhost 请求；云端原型不能使用。"
            : "原型不读取或保存任何凭据；正式配置沿用现有控制台。";
      });
      $("settings-form").addEventListener("submit", (event) => {
        event.preventDefault();
        closeDialog();
        toast("原型不保存模型配置。");
      });
    },
  );
}

function coverDialog() {
  openDialog(
    "作品封面",
    `<form id="cover-form" class="dialog-body"><label>封面标题<input maxlength="60" value="${escapeHTML(state.title)}"></label><label>封面要求<textarea rows="3" placeholder="补充构图、标题位置和想突出的视觉内容……"></textarea></label><div class="modal-note">正式接入后会沿用默认封面描述及自定义要求；原型仅演示操作路径。</div><div id="cover-result">${state.cover ? `<img class="cover-art" src="${sampleImage}" alt="用于演示封面结果的仓库示例图"><p>这是已有示例漫画，不是实际生成的封面。</p>` : ""}</div><div class="dialog-actions"><button type="submit" class="primary-button">生成封面（演示）</button></div></form>`,
    () => {
      $("cover-form").addEventListener("submit", (event) => {
        event.preventDefault();
        state.cover = true;
        $("cover-result").innerHTML =
          `<img class="cover-art" src="${sampleImage}" alt="用于演示封面结果的仓库示例图"><p>已有素材用于演示完成状态；未生成新封面。</p>`;
        toast("封面结果演示已就绪。");
      });
    },
  );
}

function socialDialog() {
  openDialog(
    "社媒文案",
    `<div class="dialog-body"><label for="social-copy">可编辑的示例文案</label><textarea id="social-copy" rows="7">${escapeHTML(state.title)}\n\n从故事到分镜，再到画面。记录这一次创作的过程。\n\n#漫画创作 #分镜 #ComicPerfect\n\n（原型演示文案，非 AI 生成）</textarea><div class="dialog-actions"><button class="outline-button" id="copy-social">复制文案</button><button class="primary-button" id="download-social">下载 TXT</button></div></div>`,
    () => {
      $("copy-social").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText($("social-copy").value);
          toast("示例文案已复制。");
        } catch {
          $("social-copy").select();
          toast("浏览器限制了复制，请手动复制已选中文案。");
        }
      });
      $("download-social").addEventListener("click", () => {
        const url = URL.createObjectURL(
          new Blob([$("social-copy").value], {
            type: "text/plain;charset=utf-8",
          }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "comicperfect-demo.txt";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("已下载演示文案。");
      });
    },
  );
}

const actions = {
  more: () =>
    openDialog(
      "更多操作",
      `<div class="dialog-body"><div class="dialog-list menu-list"><button class="dialog-item" data-action="story">故事与参考图</button><button class="dialog-item" data-action="cover">作品封面</button><button class="dialog-item" data-action="batch-options">批量成图</button><button class="dialog-item" data-action="settings">模型设置</button><div class="menu-divider"></div><button class="dialog-item" data-action="scenarios">体验异常状态</button><a class="dialog-item" href="/index.html?console=original">返回现有控制台</a></div><p class="menu-footnote">演示稿不调用 AI、不读写真实项目；刷新后重置。</p></div>`,
    ),
  close: closeDialog,
  new: () => guardGeneration(newProject),
  story: () => guardGeneration(storyDialog),
  import: () => guardGeneration(importDialog),
  settings: settingsDialog,
  cover: () => guardGeneration(coverDialog),
  "retry-review": () => {
    state.reviewFailed = false;
    renderInspector();
    updateSaveStatus();
    renderTask();
    toast("演示：review 草稿保存状态已恢复，未写入工作区。");
  },
  export: () =>
    openDialog(
      "导出作品",
      `<div class="dialog-body"><p>把创作带出工作台。</p><div class="dialog-list"><a class="dialog-item" href="${sampleImage}" download="comicperfect-demo.png">${icon("export")}<div><strong>下载示例漫画图片</strong><small>原型仅下载仓库已有素材，并非当前页成图</small></div><span>›</span></a><button class="dialog-item" data-action="social">${icon("book")}<div><strong>生成社媒文案</strong><small>编辑、复制或下载演示文案</small></div><span>›</span></button></div><div class="modal-note">正式接入后可下载当前页成图；本稿不提供 PDF 或批量打包等新增能力。</div></div>`,
    ),
  social: socialDialog,
  "batch-options": () =>
    guardGeneration(() =>
      openDialog(
        "批量成图",
        `<div class="dialog-body"><p>继续生成会保留已完成的页面。</p><button class="dialog-item" data-action="resume"><div><strong>生成剩余页面</strong><small>保留已有结果，只处理待生成和失败页面</small></div><span>›</span></button><button class="dialog-item" data-action="reset-confirm"><div><strong>重新生成全部</strong><small>会替换当前作品所有页面的成图结果</small></div><span>›</span></button></div>`,
      ),
    ),
  resume: () => {
    closeDialog();
    generate(true);
  },
  "reset-confirm": () =>
    openDialog(
      "重新生成全部页面？",
      `<div class="dialog-body"><p class="batch-warning">这将清空本次演示中的已有成图状态，然后重新生成全部页面。</p><p>如果只是想完成未生成的页面，请使用“生成剩余”。实际作品不受影响。</p><div class="dialog-actions"><button class="quiet-button" data-action="close">返回编辑</button><button class="primary-button" data-action="reset-all">确认重新生成（演示）</button></div></div>`,
    ),
  "reset-all": () => {
    closeDialog();
    generate(true, true);
  },
};

document.querySelectorAll("[data-icon]").forEach((element) => {
  element.innerHTML = icon(element.dataset.icon);
});
document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (action) actions[action.dataset.action]?.();
  const page = event.target.closest("[data-page]");
  if (page) setPage(Number(page.dataset.page));
  const panel = event.target.closest("[data-panel]");
  if (panel && !state.running) {
    state.panel = Number(panel.dataset.panel);
    state.editing = true;
    renderCanvas();
    renderInspector();
    $("inspector").classList.add("open");
    $("inspector").inert = false;
    $("panel-text").focus();
  }
});
$("panel-text").addEventListener("input", (event) => {
  const value = event.target.value;
  state.pages[state.page].panels[state.panel] = value;
  state.changed.add(state.page);
  $("character-count").textContent = `${Array.from(value).length} 字`;
  const copy = document.querySelector(
    `[data-panel="${state.panel}"] .panel-copy`,
  );
  if (copy) copy.textContent = value;
  renderPages();
  updateSaveStatus();
  if (!state.reviewFailed) {
    $("editor-note").hidden = state.pages[state.page].status !== "done";
    $("editor-note").textContent = "分镜已修改，成图尚未更新。";
  }
});
$("script-view").addEventListener("click", () => {
  state.view = "script";
  renderCanvas();
});
$("image-view").addEventListener("click", () => {
  state.view = "image";
  closeEditor(false);
});
$("previous-page").addEventListener("click", () => setPage(state.page - 1));
$("next-page").addEventListener("click", () => setPage(state.page + 1));
$("generate-page").addEventListener("click", () => generate(false));
$("page-select").addEventListener("change", (event) =>
  setPage(Number(event.target.value)),
);
$("zoom-out").addEventListener("click", () => {
  state.zoom = Math.max(0.65, state.zoom - 0.15);
  renderCanvas();
});
$("zoom-in").addEventListener("click", () => {
  state.zoom = Math.min(1.4, state.zoom + 0.15);
  renderCanvas();
});
$("zoom-reset").addEventListener("click", () => {
  state.zoom = 1;
  renderCanvas();
});
$("dialog-close").addEventListener("click", closeDialog);
$("workspace-dialog").addEventListener("close", () => {
  if (dialogOpener?.isConnected) dialogOpener.focus();
});
$("workspace-dialog").addEventListener("click", (event) => {
  const bounds = event.currentTarget.getBoundingClientRect();
  if (
    event.target === event.currentTarget &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  )
    closeDialog();
});
function closeEditor(restoreFocus = true) {
  const wasOpen = $("inspector").classList.contains("open");
  state.editing = false;
  $("inspector").classList.remove("open");
  $("inspector").inert = true;
  renderCanvas();
  if (restoreFocus && wasOpen)
    document.querySelector(`[data-panel="${state.panel}"]`)?.focus();
}
$("inspector-close").addEventListener("click", () => closeEditor());
$("editor-done").addEventListener("click", () => closeEditor());
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("workspace-dialog").open) closeEditor();
});
$("project-menu-button").addEventListener("click", () =>
  guardGeneration(() =>
    openDialog(
      "当前作品",
      `<div class="dialog-body"><div class="dialog-item active">${icon("book")}<div><strong>${escapeHTML(state.title)}</strong><small>${state.pages.length} 页分镜 · 本次演示</small></div></div><button class="dialog-item" data-action="rename"><div><strong>重命名作品</strong><small>仅修改演示名称</small></div><span>›</span></button><button class="dialog-item" data-action="new"><div><strong>新建作品</strong><small>不会改写已有控制台会话</small></div><span>›</span></button><button class="dialog-item" data-action="import"><div><strong>导入 ComicBrain</strong></div><span>›</span></button></div>`,
    ),
  ),
);
actions.rename = () =>
  openDialog(
    "重命名作品",
    `<form id="rename-form" class="dialog-body"><label>作品名称<input name="title" value="${escapeHTML(state.title)}" required maxlength="60"></label>${modalActions("保存演示名称")}</form>`,
    () => {
      $("rename-form").addEventListener("submit", (event) => {
        event.preventDefault();
        state.title =
          String(new FormData(event.currentTarget).get("title")).trim() ||
          "未命名作品";
        closeDialog();
        render();
      });
    },
  );
actions.scenarios = () =>
  guardGeneration(() =>
    openDialog(
      "体验异常状态",
      `<div class="dialog-body"><p>选择一个状态，检查操作反馈是否清楚。</p><button class="dialog-item" data-action="demo-fail"><div><strong>成图失败与续生成</strong><small>下一次演示生成会有一页失败，其余页面继续完成</small></div><span>›</span></button><button class="dialog-item" data-action="demo-review"><div><strong>review 草稿保存失败</strong><small>查看保留修改和重试保存的提示</small></div><span>›</span></button><button class="dialog-item" data-action="demo-reset"><div><strong>恢复初始设计稿</strong><small>重置原型状态，不影响真实项目</small></div><span>›</span></button></div>`,
    ),
  );
actions["demo-fail"] = () => {
  state.failNext = true;
  if (state.pages.every((page) => page.status === "done"))
    state.pages[state.page].status = "pending";
  closeDialog();
  render();
  toast("异常演示已开启，点击“生成剩余”体验失败后的续生成。");
};
actions["demo-review"] = () => {
  state.source = "comicbrain";
  state.reviewFailed = true;
  closeDialog();
  render();
};
actions["demo-reset"] = () => {
  state.pages = createDemoPages();
  state.page = 1;
  state.panel = 1;
  state.view = "script";
  state.title = "森林里的来信";
  state.source = "demo";
  state.style = "水彩风格";
  state.reviewFailed = false;
  state.failNext = false;
  state.changed.clear();
  state.zoom = 1;
  closeDialog();
  render();
};
$("inspector").inert = true;
render();
