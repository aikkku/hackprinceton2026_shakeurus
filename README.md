# ShakeUs website

Split stack:

| Piece | Where it runs | Role |
|-------|----------------|------|
| **Frontend** (`frontend/`) | **GitHub Pages** | React UI: stats (demo) + alarm controls |
| **Backend** (`backend/`) | **DigitalOcean** (or any VPS) | FastAPI proxy + CORS; forwards to the Pi |
| **shakeus** | **Raspberry Pi** + **ngrok** | Real alarm, camera, music, scheduler |

Traffic: **Browser → GitHub Pages (React) → DigitalOcean API → ngrok → Pi (shakeus)**.

**Where to set FRONTEND / BACKEND / SHAKEUS URLs:** see **[`LINKS.md`](LINKS.md)** (single checklist).

## Quick start (development)

1. **shakeus** — run `python stream.py` on **port 8080** (`http://127.0.0.1:8080`). In production, expose it (e.g. ngrok) and set `SHAKEUS_BASE_URL` on the backend.

2. **Backend** — see [`backend/README.md`](backend/README.md). Run uvicorn on **port 8060** (`SHAKEUS_BASE_URL=http://127.0.0.1:8080` for local dev).

3. **Frontend** — Vite dev server on **port 8070**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   With the default Vite config, `/api` is proxied to `http://127.0.0.1:8060`, so you usually **do not** need `VITE_API_BASE_URL` during local dev.

## Production build (GitHub Pages)

1. In **GitHub repo → Settings → Pages**, set source to **GitHub Actions** or deploy from `gh-pages` branch / static folder from Actions.

2. Build the frontend with your **public API origin**:

   ```bash
   cd frontend
   npm ci
   VITE_API_BASE_URL=https://api.yourdomain.com npm run build
   ```

   If the site is not at the domain root (e.g. `username.github.io/repo-name/`), also set:

   ```bash
   VITE_BASE_PATH=/repo-name/ npm run build
   ```

3. Upload the contents of `frontend/dist` to hosting (or use a workflow that publishes `dist`).

4. Ensure **backend** `CORS_ORIGINS` includes your exact GitHub Pages origin (scheme + host + path if applicable).

## shakeus API additions

The Pi server exposes:

- `GET /songs` — track list  
- `POST /trigger` — optional body `{ "song_file": "scuba.mp3" }`  
- `POST /schedule/alarm` — daily alarm at local Pi time `{ "time": "07:30", "song_file": "..." }`  
- `POST /schedule/timer` — one-shot `{ "seconds": 300, "song_file": "..." }`  
- `GET /schedule` / `POST /schedule/cancel`  

Alarm times use the **Raspberry Pi’s local timezone**; keep the Pi clock correct (e.g. `timedatectl`).
