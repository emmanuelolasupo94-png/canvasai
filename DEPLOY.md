# CanvasAI deployment

## Local
1. Create `.env` from `.env.example`.
2. Run `npm install`.
3. Run `npm start`.
4. Open http://localhost:3000.

## Render
1. Push this project to a GitHub repository. Do not commit `.env` or your HF token.
2. In Render, create a Web Service from the GitHub repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables: `HF_TOKEN` (your token), `IMAGE_MODEL=black-forest-labs/FLUX.1-schnell`, `HF_PROVIDER=fal-ai`, and `PUBLIC_URL=https://YOUR-SERVICE.onrender.com`.
6. Deploy.

Render requires public web services to listen on `0.0.0.0`; CanvasAI is configured for that.

## Custom domain and Google
After the Render URL works, add a custom domain in Render. Then set `PUBLIC_URL` to the final HTTPS domain and redeploy. The app exposes `/robots.txt` and `/sitemap.xml` for search-engine discovery. Search engines may take time to crawl and index the site; submit the sitemap in Google Search Console after the domain is live.
