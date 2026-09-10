# CanvasAI — Stage 4

CanvasAI is a local AI image studio powered by Hugging Face Inference Providers.

## Stage 4 features
- Real AI image generation with FLUX.1-schnell through Fal AI
- 1:1, 16:9, 9:16 and 4:5 image sizes
- Generate 1, 2 or 4 variations
- Prompt enhancement helper
- Per-image download and download-all support
- Recent creation history
- Dark/light mode saved locally
- Responsive/mobile-friendly interface
- Ctrl + Enter generation shortcut

## Setup
1. Create `.env` in the project root:

```env
HF_TOKEN=your_huggingface_token
PORT=3000
IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
```

2. Install dependencies:

```powershell
npm.cmd install
```

3. Start:

```powershell
npm.cmd start
```

4. Open http://localhost:3000

Never put `.env` in a public repository or share your token.
