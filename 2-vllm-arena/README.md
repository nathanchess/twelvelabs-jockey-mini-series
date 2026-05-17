# VLM Arena (`2-vllm-arena`)

Next.js app that compares **TwelveLabs Jockey 1.0** (knowledge-store RAG) and **Google Gemini** on the same soccer video corpus in a side-by-side arena UI.

Part of the [twelvelabs-jockey-mini-series](https://github.com/nathanchess/twelvelabs-jockey-mini-series) monorepo. Deploy this folder to Vercel with **Root Directory** = `2-vllm-arena`.

---

## Features

- **Arena** (`/arena`) — dual-column streaming chat: Jockey vs Gemini
- **Corpus bar** — switch between configured video sets (`lib/corpora.ts`)
- **Jockey** — `jockey1.0` via TwelveLabs Responses API + your knowledge store
- **Gemini** — `gemini-2.5-flash` with pre-uploaded file URIs (`preloaded_videos.json`)
- **HLS previews** — TwelveLabs asset playback where configured

---

## Prerequisites

- Node.js **20+**
- TwelveLabs API key + knowledge store ID (from [`1-setup`](../1-setup/) or Playground)
- Google AI Studio API key for Gemini
- Local `.mp4` files in `public/videos/` matching paths in `lib/corpora.ts`

---

## Setup

### 1. Install dependencies

```powershell
cd 2-vllm-arena
npm install
```

### 2. Environment variables

```powershell
copy .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `TL_API_KEY` | Yes | TwelveLabs API key |
| `KNOWLEDGE_STORE_ID` | Yes | Knowledge store used by Jockey routes |
| `GEMINI_API_KEY` | Yes | Google AI Studio key (alias: `GOOGLE_API_KEY`) |

### 3. Add corpus videos

Place MP4s in `public/videos/`. Default soccer corpus expects names like:

- `videoplayback.mp4`
- `videoplayback (1).mp4` … `videoplayback (5).mp4`

Update [`lib/corpora.ts`](lib/corpora.ts) if your filenames differ.

> **Note:** `*.mp4` is gitignored at the monorepo root. Each developer (and Vercel, if needed) supplies their own copies.

### 4. Preload Gemini file uploads

Gemini requires videos to be uploaded to the Files API first. This writes `api/gemini_prompt/preloaded_videos.json`:

```powershell
npm run preload-videos
```

| Script | Behavior |
|--------|----------|
| `npm run preload-videos` | Upload missing videos; resume if JSON already exists |
| `npm run preload-videos:fresh` | Re-upload every video from scratch |

**Common errors**

- `API key expired` — create a new key at [Google AI Studio](https://aistudio.google.com/apikey) and update `.env`
- `API_KEY_SERVICE_BLOCKED` — use an AI Studio key, not a restricted Cloud key
- Partial run — script saves progress; fix the key and run again

### 5. Run locally

```powershell
npm run dev
```

- Home: [http://localhost:3000](http://localhost:3000)
- Arena: [http://localhost:3000/arena](http://localhost:3000/arena)

---

## Project structure

```
2-vllm-arena/
├── app/
│   ├── (app)/              # UI routes (home, arena)
│   └── api/                # Route handlers
│       ├── gemini_prompt/  # Gemini streaming
│       ├── jockey_prompt/  # Jockey streaming
│       ├── knowledge-store/
│       └── assets/
├── api/gemini_prompt/      # Offline preload script + generated JSON
│   ├── preload_videos.mjs
│   └── preloaded_videos.json   (generated, gitignored)
├── components/             # UI components
├── hooks/                  # Arena chat, metadata
├── lib/                    # Corpora, streaming, markdown, asset maps
└── public/videos/          # Local MP4 corpus (gitignored)
```

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jockey_prompt` | POST | Stream Jockey `jockey1.0` response |
| `/api/gemini_prompt` | POST | Stream Gemini response (uses preloaded file URI) |
| `/api/knowledge-store/items` | GET | List knowledge store items |
| `/api/assets/[assetId]` | GET | Asset metadata / playback helpers |

All keys stay server-side; nothing sensitive is exposed to the browser bundle.

---

## Deploy on Vercel (from monorepo)

1. Push the parent repo [twelvelabs-jockey-mini-series](https://github.com/nathanchess/twelvelabs-jockey-mini-series) to GitHub.
2. Vercel → New Project → import repo.
3. Set **Root Directory** to `2-vllm-arena`.
4. Add environment variables (`TL_API_KEY`, `KNOWLEDGE_STORE_ID`, `GEMINI_API_KEY`).
5. Plan for `preloaded_videos.json` (see parent README — preload locally or in build; URIs expire).

Build command (default): `next build`  
Output: Next.js default

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run preload-videos` | Upload videos to Gemini Files API |
| `npm run preload-videos:fresh` | Force re-upload all videos |

---

## Customization

- **Corpus** — edit `lib/corpora.ts` and add files under `public/videos/`
- **Gemini model** — change `model` in `app/api/gemini_prompt/route.ts`
- **Jockey model** — change `model` in `app/api/jockey_prompt/route.ts`
- **Which video Gemini sees** — today the route uses the first entry in `preloaded_videos.json`; extend selection in `route.ts` as needed

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Missing TL_API_KEY` | Set in `.env` / Vercel env |
| `No preloaded videos found` | Run `npm run preload-videos` |
| Gemini 502 after deploy | URIs expired — re-run preload and redeploy |
| Videos don’t play locally | Confirm files exist under `public/videos/` and paths match `corpora.ts` |
| Jockey empty / errors | Verify `KNOWLEDGE_STORE_ID` and that assets are ingested in TwelveLabs |

---

## Related

- [Monorepo README](../README.md) — git push, monorepo layout, Vercel monorepo settings
- [`1-setup`](../1-setup/) — create knowledge store and ingest assets
