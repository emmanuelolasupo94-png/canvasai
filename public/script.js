const promptEl = document.getElementById("prompt");
const counter = document.getElementById("counter");
const styleEl = document.getElementById("style");
const ratioEl = document.getElementById("ratio");
const countEl = document.getElementById("count");
const generateBtn = document.getElementById("generateBtn");
const resultSection = document.getElementById("resultSection");
const resultGrid = document.getElementById("resultGrid");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const loadingSubtext = document.getElementById("loadingSubtext");
const errorEl = document.getElementById("error");
const downloadBtn = document.getElementById("downloadBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const gallery = document.getElementById("gallery");
const emptyGallery = document.getElementById("emptyGallery");
const clearGallery = document.getElementById("clearGallery");
const themeToggle = document.getElementById("themeToggle");
const promptStatus = document.getElementById("promptStatus");
const enhanceBtn = document.getElementById("enhanceBtn");

let currentData = null;
let currentImages = [];

promptEl.addEventListener("input", () => {
  counter.textContent = `${promptEl.value.length} / 1000`;
});

const suggestion = document.querySelector(".suggestion");
if (suggestion) {
  suggestion.addEventListener("click", () => {
    promptEl.value = suggestion.dataset.prompt || "";
    promptEl.dispatchEvent(new Event("input"));
    promptEl.focus();
  });
}

function setGenerating(isGenerating) {
  generateBtn.disabled = isGenerating;
  regenerateBtn.disabled = isGenerating;
  enhanceBtn.disabled = isGenerating;
  countEl.disabled = isGenerating;
  styleEl.disabled = isGenerating;
  ratioEl.disabled = isGenerating;
  generateBtn.classList.toggle("is-loading", isGenerating);
  generateBtn.querySelector(".btn-label").textContent = isGenerating ? "Creating..." : "Generate Image";
  loading.hidden = !isGenerating;
  if (isGenerating) resultGrid.innerHTML = "";
}

async function generate() {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    showError("Please describe the image you want to create.");
    promptEl.focus();
    return;
  }

  hideError();
  resultSection.hidden = false;
  setGenerating(true);
  const requestedCount = Number(countEl.value) || 1;
  loadingText.textContent = requestedCount === 1 ? "Creating your image..." : `Creating ${requestedCount} images...`;
  loadingSubtext.textContent = "This can take a little while.";
  resultSection.scrollIntoView({ behavior: "smooth", block: "center" });

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        style: styleEl.value,
        aspectRatio: ratioEl.value,
        count: requestedCount
      })
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : { error: await response.text() };
    if (!response.ok) throw new Error(data.error || "Generation failed.");

    currentData = data;
    currentImages = data.images || [data.image];
    renderResults(currentImages, data);
    saveToGallery(data);
    renderGallery();
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    setGenerating(false);
  }
}

generateBtn.addEventListener("click", generate);
regenerateBtn.addEventListener("click", generate);

promptEl.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") generate();
});

enhanceBtn.addEventListener("click", () => {
  const base = promptEl.value.trim();
  if (!base) {
    promptEl.focus();
    promptStatus.textContent = "Write a basic idea first, then enhance it.";
    return;
  }

  const styleHints = {
    photorealistic: "photorealistic textures, natural skin and material detail",
    cinematic: "cinematic lighting, dramatic depth, film still composition",
    "3d": "high-quality 3D materials, realistic shadows, polished rendering",
    anime: "detailed anime character art, expressive faces, clean linework",
    cartoon: "stylized cartoon shapes, expressive poses, clean polished illustration",
    watercolor: "soft watercolor washes, paper texture, delicate brushwork",
    oil: "rich oil paint texture, visible brushwork, fine-art composition",
    pencil: "precise graphite lines, subtle shading, textured paper",
    comic: "bold ink lines, dynamic framing, dramatic comic shading",
    pixel: "crisp pixel clusters, retro game art, carefully designed palette"
  };

  const hint = styleHints[styleEl.value] || styleHints.cinematic;
  const addition = `, ${hint}, strong subject focus, clear foreground and background, balanced composition, atmospheric lighting, highly detailed`;

  if (!base.toLowerCase().includes("highly detailed")) {
    promptEl.value = `${base}${addition}`.slice(0, 1000);
    promptEl.dispatchEvent(new Event("input"));
  }
  promptStatus.textContent = "Prompt enhanced. You can edit it before generating.";
});

downloadBtn.addEventListener("click", async () => {
  if (!currentImages.length) return;
  if (currentImages.length === 1) {
    downloadImage(currentImages[0]);
    return;
  }

  currentImages.forEach((image, index) => downloadImage(image, index + 1));
});

function downloadImage(dataUrl, index = null) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `canvasai-${Date.now()}${index ? `-${index}` : ""}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderResults(images, data) {
  resultGrid.innerHTML = "";
  images.forEach((image, index) => {
    const card = document.createElement("div");
    card.className = "result-item";

    const img = document.createElement("img");
    img.src = image;
    img.alt = data.prompt || "Generated AI artwork";
    img.style.aspectRatio = `${data.width || 1} / ${data.height || 1}`;

    const row = document.createElement("div");
    row.className = "result-item-actions";
    const label = document.createElement("span");
    label.textContent = images.length > 1 ? `Variation ${index + 1}` : `${data.width} × ${data.height}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mini-btn";
    btn.textContent = "Download";
    btn.addEventListener("click", () => downloadImage(image, index + 1));
    row.append(label, btn);

    card.append(img, row);
    resultGrid.appendChild(card);
  });
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function saveToGallery(data) {
  try {
    const items = JSON.parse(localStorage.getItem("canvasai-gallery") || "[]");
    const images = data.images || [data.image];
    images.forEach((image, index) => {
      items.unshift({
        image,
        prompt: data.prompt,
        style: data.style,
        aspectRatio: data.aspectRatio,
        width: data.width,
        height: data.height,
        createdAt: data.createdAt,
        variation: index + 1
      });
    });
    localStorage.setItem("canvasai-gallery", JSON.stringify(items.slice(0, 8)));
  } catch (error) {
    console.warn("Gallery storage limit reached. Current images remain available.", error);
  }
}

function renderGallery() {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("canvasai-gallery") || "[]");
  } catch {
    items = [];
  }

  gallery.innerHTML = "";
  emptyGallery.hidden = items.length > 0;
  clearGallery.hidden = items.length === 0;

  items.forEach((item) => {
    const wrapper = document.createElement("article");
    wrapper.className = "gallery-item";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.prompt || "Generated image";
    img.loading = "lazy";
    img.addEventListener("click", () => openHistoryItem(item));

    const info = document.createElement("div");
    info.className = "gallery-info";
    const title = document.createElement("p");
    title.textContent = item.prompt || "Untitled creation";
    const meta = document.createElement("span");
    meta.textContent = `${item.style || "cinematic"} · ${item.aspectRatio || "1:1"}`;
    info.append(title, meta);

    const download = document.createElement("button");
    download.type = "button";
    download.className = "gallery-download";
    download.textContent = "↓";
    download.title = "Download";
    download.addEventListener("click", () => downloadImage(item.image));

    wrapper.append(img, info, download);
    gallery.appendChild(wrapper);
  });
}

function openHistoryItem(item) {
  currentImages = [item.image];
  currentData = item;
  resultSection.hidden = false;
  renderResults(currentImages, item);
  resultSection.scrollIntoView({ behavior: "smooth", block: "center" });
}

clearGallery.addEventListener("click", () => {
  localStorage.removeItem("canvasai-gallery");
  renderGallery();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  themeToggle.textContent = dark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  localStorage.setItem("canvasai-theme", dark ? "dark" : "light");
});

if (localStorage.getItem("canvasai-theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀";
}

counter.textContent = `${promptEl.value.length} / 1000`;
renderGallery();
