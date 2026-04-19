# Where to set URLs (ShakeUs, backend, frontend)

Use this as a checklist when you move from **localhost** to **production** (GitHub Pages, DigitalOcean, Raspberry Pi / ngrok).

| What | Role | Set it here |
|------|------|-------------|
| **Frontend** | The React app users open in the browser | **GitHub Pages / hosting:** build with env vars (see below). **Local dev:** usually leave API URL empty so Vite proxies to the backend. |
| **Backend** | FastAPI proxy on your VPS; talks to ShakeUs | `website/backend/.env` |
| **ShakeUs** | Alarm + camera on the Pi (exposed via ngrok or LAN) | `website/backend/.env` points the backend here. Optional Pi-only URLs in `shakeus/.env` / `shakeus/env_config.py`. |

---

### 1. Frontend (`website/frontend/`)

| Variable | File | Example |
|----------|------|---------|
| `VITE_API_BASE_URL` | **`website/frontend/.env`** or **`.env.production`** | `https://api.yourdomain.com` (your **backend**, no trailing slash) |
| `VITE_BASE_PATH` | same | `/your-repo-name/` only if the site is not at domain root (GitHub Project Pages) |

Copy from **`website/frontend/.env.example`**, then:

```bash
cd website/frontend
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN npm run build
```

**Local dev:** leave `VITE_API_BASE_URL` unset or empty so **`vite.config.ts`** proxies `/api` → `http://127.0.0.1:8060`.

---

### 2. Backend (`website/backend/`)

| Variable | File | Example |
|----------|------|---------|
| `SHAKEUS_BASE_URL` | **`website/backend/.env`** | `https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app` or `http://YOUR-PI-IP:8080` (ShakeUs, no trailing slash) |
| `CORS_ORIGINS` | **`website/backend/.env`** | `https://YOUR-GITHUB-PAGES-URL,http://localhost:8070` (browsers allowed to call the API) |

Copy from **`website/backend/.env.example`**.

---

### 3. ShakeUs on the Raspberry Pi (`shakeus/`)

The **backend** reaches ShakeUs only via **`SHAKEUS_BASE_URL`** above.

Optional Pi-side settings (Chromecast, hosted MP3 URLs, etc.):

| File | Purpose |
|------|---------|
| **`shakeus/.env`** | Local secrets / overrides |
| **`shakeus/env_config.py`** | Reads env; tune `SONGS_BASE_URL` if you serve MP3s from a public URL |

---

### Quick reference chain

```
Browser  →  FRONTEND (GitHub Pages)
    ↳ VITE_API_BASE_URL  →  BACKEND (DigitalOcean)
            ↳ SHAKEUS_BASE_URL  →  SHAKEUS (Pi + ngrok)
```

After changing any URL, rebuild the frontend (if production) and restart the backend and/or ShakeUs as needed.
