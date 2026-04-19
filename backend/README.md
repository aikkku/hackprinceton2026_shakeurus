# ShakeUs web API (FastAPI proxy)

This service runs on **DigitalOcean** (or any VPS). It does not run the alarm itself: it forwards HTTP requests to **shakeus** on your Raspberry Pi (exposed with **ngrok** or another HTTPS tunnel).

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `SHAKEUS_BASE_URL` | Public URL of shakeus, e.g. `https://your-subdomain.ngrok-free.app` (no trailing slash). |
| `CORS_ORIGINS` | Comma-separated list of origins allowed to call this API. Include your **GitHub Pages** URL and local dev URLs. Local dev defaults to the Vite frontend on **8070**: `http://localhost:8070`. Use `*` only for quick tests (not recommended for production). |

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8060
```

Health check: `GET http://127.0.0.1:8060/health`

Local dev stack: shakeus on **8080**, this API on **8060**, Vite frontend on **8070** (see repo root `README.md`).

## Deploy on DigitalOcean (Ubuntu droplet)

1. **Create a droplet** (Ubuntu 22.04 or 24.04), add SSH access, and note the public IP or attach a **reserved IP** / domain.

2. **Install Python 3.11+** (if needed):

   ```bash
   sudo apt update && sudo apt install -y python3 python3-venv python3-pip
   ```

3. **Copy this `backend` folder** to the server (git clone, `rsync`, or SCP).

4. **Create venv and install dependencies**:

   ```bash
   cd /path/to/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Create `.env`** on the server with `SHAKEUS_BASE_URL` and `CORS_ORIGINS` set for production.

6. **Systemd service** (runs the API on boot, restarts on failure). Create `/etc/systemd/system/shakeus-api.service`:

   ```ini
   [Unit]
   Description=ShakeUs web API
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/backend
   EnvironmentFile=/path/to/backend/.env
   ExecStart=/path/to/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```

   Adjust `User`, `WorkingDirectory`, and paths. Then:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now shakeus-api
   sudo systemctl status shakeus-api
   ```

7. **HTTPS reverse proxy** (recommended): install **Caddy** or **nginx** in front of uvicorn, terminate TLS, and proxy to `127.0.0.1:8000`. Point your DNS **A record** to the droplet. Example **Caddyfile** snippet:

   ```text
   api.yourdomain.com {
       reverse_proxy 127.0.0.1:8000
   }
   ```

8. **Firewall**: allow SSH and 80/443 only:

   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

9. **Frontend (GitHub Pages)** must use the **public HTTPS URL** of this API in `VITE_API_BASE_URL` when building the React app (see the main `website/README.md`).

## API routes (proxied to shakeus)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/songs` | List tracks from Pi `config.SONGS` |
| POST | `/api/trigger` | Start alarm (optional JSON `{ "song_file": "scuba.mp3" }`) |
| POST | `/api/stop` | Stop alarm |
| GET | `/api/status` | Current phase / score |
| GET | `/api/schedule` | Pending timer or daily alarm on Pi |
| POST | `/api/schedule/alarm` | `{ "time": "07:30", "song_file": null }` — Pi **local** time |
| POST | `/api/schedule/timer` | `{ "seconds": 300, "song_file": null }` |
| POST | `/api/schedule/cancel` | Clear pending schedule |

The proxy adds the `ngrok-skip-browser-warning: true` header so ngrok’s browser interstitial does not break server-to-server calls.
