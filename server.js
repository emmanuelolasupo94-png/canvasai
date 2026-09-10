require("dotenv").config();

const express = require("express");
const path = require("path");
const { InferenceClient } = require("@huggingface/inference");

const app = express();
const port = process.env.PORT || 3000;
const imageModel = process.env.IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
const imageProvider = process.env.HF_PROVIDER || "fal-ai";
const publicUrl = (process.env.PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");

if (!process.env.HF_TOKEN) {
  console.error("Missing HF_TOKEN in .env");
  process.exit(1);
}

const hf = new InferenceClient(process.env.HF_TOKEN);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "CanvasAI" });
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${publicUrl}/sitemap.xml`);
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${publicUrl}/</loc></url></urlset>`);
});

const styleMap = {
  photorealistic: "photorealistic, natural lighting, realistic textures, realistic details",
  cinematic: "cinematic lighting, dramatic composition, highly detailed, film still",
  "3d": "high-quality 3D render, realistic materials, studio-quality rendering",
  anime: "anime illustration, detailed character art, vibrant composition",
  cartoon: "clean cartoon illustration, expressive shapes, polished artwork",
  watercolor: "delicate watercolor painting, paper texture, soft brushwork",
  oil: "rich oil painting, visible brushwork, painterly texture, fine art",
  pencil: "detailed pencil sketch, hand-drawn graphite lines, paper texture",
  comic: "dynamic comic book illustration, bold ink lines, dramatic shading",
  pixel: "detailed pixel art, crisp pixels, retro game aesthetic"
};

const dimensions = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1152, height: 648 },
  "9:16": { width: 648, height: 1152 },
  "4:5": { width: 1024, height: 1280 }
};

app.post("/api/generate", async (req, res) => {
  try {
    const {
      prompt,
      style = "cinematic",
      aspectRatio = "1:1",
      count = 1
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter a prompt." });
    }

    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 4);
    const styleText = styleMap[style] || styleMap.cinematic;
    const size = dimensions[aspectRatio] || dimensions["1:1"];
    const finalPrompt = `${prompt.trim()}. ${styleText}.`;
    const images = [];

    console.log(`Generating ${safeCount} image(s), ${aspectRatio} (${size.width}x${size.height}):`, finalPrompt);

    for (let i = 0; i < safeCount; i++) {
      const imageBlob = await hf.textToImage({
        model: imageModel,
        provider: imageProvider,
        inputs: finalPrompt,
        parameters: {
          width: size.width,
          height: size.height
        }
      });

      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      images.push(`data:image/png;base64,${base64}`);
    }

    res.json({
      image: images[0],
      images,
      prompt: prompt.trim(),
      style,
      aspectRatio,
      width: size.width,
      height: size.height,
      count: images.length,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Hugging Face error:", error);
    res.status(500).json({
      error: error?.message || "Image generation failed. Please try again."
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`CanvasAI running at http://localhost:${port}`);
});
