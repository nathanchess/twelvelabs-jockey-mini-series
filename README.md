# Jockey Mini-Series

A monorepo for the **TwelveLabs Jockey** mini-series: set up a knowledge store, compare **Jockey 1.0** vs **Gemini** on video understanding, and explore use cases.

**Repository:** [github.com/nathanchess/twelvelabs-jockey-mini-series](https://github.com/nathanchess/twelvelabs-jockey-mini-series)

| Folder | Purpose |
|--------|---------|
| [`1-setup/`](1-setup/) | Python scripts to upload assets, create a knowledge store, ingest videos, and run CLI prompts |
| [`2-vllm-arena/`](2-vllm-arena/) | Next.js **VLM Arena** — side-by-side chat UI (Jockey vs Gemini) |
| [`3-jockey-use-cases/`](3-jockey-use-cases/) | Placeholder for future use-case examples |

---

## Repository layout (monorepo)

Use **one GitHub repository** for the whole series. Deploy only the Next.js app to Vercel by pointing Vercel at the `2-vllm-arena` subdirectory (see [Deploy on Vercel](#deploy-on-vercel)).

```
jockey-mini-series/          ← git root (push this folder)
├── 1-setup/
├── 2-vllm-arena/            ← Vercel Root Directory
├── 3-jockey-use-cases/
├── venv/                    ← ignored
├── .gitignore
└── README.md
```

Do **not** create a separate git repo inside `2-vllm-arena`. A single repo keeps the tutorial flow in one place and still lets Vercel build only the app folder.

---

## Prerequisites

- **Node.js 20+** (for `2-vllm-arena`)
- **Python 3.10+** (for `1-setup`)
- [TwelveLabs API key](https://playground.twelvelabs.io/)
- [Google AI Studio API key](https://aistudio.google.com/apikey) (for Gemini in the arena)

---

## Quick start (local)

### 1. Clone and enter the repo

```powershell
git clone https://github.com/nathanchess/twelvelabs-jockey-mini-series.git
cd twelvelabs-jockey-mini-series
```

### 2. TwelveLabs setup (`1-setup`)

```powershell
cd 1-setup
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1
pip install requests python-dotenv
copy .env.example .env
# Edit .env with TL_API_KEY and KNOWLEDGE_STORE_ID
python main.py
```

Put sample `.mp4` files in `1-setup/library/` if you use the upload helpers in `main.py`.

### 3. VLM Arena (`2-vllm-arena`)

```powershell
cd ..\2-vllm-arena
copy .env.example .env
# Edit .env — use the same TL_API_KEY / KNOWLEDGE_STORE_ID as 1-setup
npm install
```

Add corpus videos under `public/videos/` (filenames should match `lib/corpora.ts`), then preload Gemini file URIs:

```powershell
npm run preload-videos
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Details: [`2-vllm-arena/README.md`](2-vllm-arena/README.md).

---

## Push to GitHub

From the **monorepo root** (`jockey-mini-series/`), not from `2-vllm-arena` alone.

### First time

```powershell
cd path\to\jockey-mini-series
git init
git add .
git status
# Confirm .env, venv/, node_modules/, *.mp4, and preloaded_videos.json are NOT staged
git commit -m "Initial commit: Jockey mini-series monorepo"
git branch -M main
git remote add origin https://github.com/nathanchess/twelvelabs-jockey-mini-series.git
git push -u origin main
```

### Later updates

```powershell
git add .
git commit -m "Describe your change"
git push
```

### Before you push — checklist

- [ ] No `.env` files staged (`git status` should not list them)
- [ ] No API keys in committed files
- [ ] `node_modules/`, `.next/`, `venv/` are ignored
- [ ] Large `.mp4` files are ignored (see `.gitignore`); share videos another way for collaborators

If you already committed secrets, rotate keys in TwelveLabs / Google AI Studio and remove them from git history before pushing publicly.

---

## Deploy on Vercel

Vercel supports **monorepos**: one GitHub repo, one project, app rooted at `2-vllm-arena`.

### 1. Import the repository

1. [vercel.com/new](https://vercel.com/new) → Import [twelvelabs-jockey-mini-series](https://github.com/nathanchess/twelvelabs-jockey-mini-series).
2. **Root Directory** → Edit → set to `2-vllm-arena` → Continue.  
   This step is required. The repo root has no `package.json`; deploying from `/` causes a Vercel `404: NOT_FOUND` page.
3. Framework: **Next.js** (auto-detected).
4. **Build & Development Settings** (leave defaults unless you changed them before):
   - Build Command: `npm run build` (or empty → default)
   - Output Directory: **leave empty** (do not set `.next` or `out` — that also causes `404: NOT_FOUND`)
   - Install Command: `npm install` (or empty → default)

### 2. Environment variables

In the Vercel project → **Settings → Environment Variables**, add:

| Variable | Used by |
|----------|---------|
| `TL_API_KEY` | Jockey API routes |
| `KNOWLEDGE_STORE_ID` | Jockey knowledge store |
| `GEMINI_API_KEY` | Gemini route + optional build preload |

Apply to **Production**, **Preview**, and **Development** as needed.

### 3. Gemini preloaded videos on Vercel

The arena reads `api/gemini_prompt/preloaded_videos.json`. Gemini file URIs **expire** (often within ~48 hours), so production needs a plan:

| Approach | When to use |
|----------|-------------|
| **A. Preload locally, commit JSON** | Quick demo; re-run preload and redeploy when URIs expire. Temporarily remove `preloaded_videos.json` from `.gitignore` if you choose this. |
| **B. Preload in Vercel build** | Add `GEMINI_API_KEY` to Vercel, commit `.mp4` corpus (or fetch in build), set build command to run preload then `next build`. |
| **C. Local / CI only** | Keep JSON gitignored; run `npm run preload-videos` before each deploy and upload artifact (advanced). |

For most workshops, **A** or re-running preload before deploy is enough.

### 4. Deploy

Push to `main` — Vercel builds from `2-vllm-arena` automatically.

`2-vllm-arena/vercel.json` pins the framework to Next.js for this subdirectory.

### Fix `404: NOT_FOUND` (Code: NOT_FOUND)

If you see Vercel’s plain **404: NOT_FOUND** page (not the app’s UI):

1. **Settings → General → Root Directory** must be `2-vllm-arena` (then redeploy).
2. **Settings → General → Output Directory** must be **empty** for Next.js.
3. Open the latest deployment → **Build Logs** — confirm `next build` succeeded.
4. Use the deployment URL from that successful build (not an old or deleted preview link).

To fix an existing project: Settings → General → Root Directory → `2-vllm-arena` → Save → Deployments → Redeploy.

### 5. Videos in production

`.mp4` files under `public/videos/` are **gitignored** by default (size). For production you can:

- Use **TwelveLabs-hosted** assets for Jockey (knowledge store) and rely on preload only for Gemini, or  
- Store videos on a CDN and adjust `lib/corpora.ts` URLs, or  
- Use Git LFS for `public/videos/*.mp4` if you must serve them from the Next app.

---

## Security

- Never commit `.env`, API keys, or AWS credentials.
- Root `.gitignore` excludes `.env*` except `.env.example` templates.
- Rotate any key that was ever committed or shared in a screenshot.

---

## Learn more

- [TwelveLabs Jockey documentation](https://docs.twelvelabs.io/)
- [Gemini API — Files](https://ai.google.dev/gemini-api/docs/files)
- [Vercel — Monorepos](https://vercel.com/docs/monorepos)
