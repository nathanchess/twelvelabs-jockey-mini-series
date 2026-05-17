# TwelveLabs setup (`1-setup`)

Python utilities to upload video assets, create a **knowledge store**, ingest items, and run CLI prompts against **Jockey** via the TwelveLabs API.

## Setup

```powershell
cd 1-setup
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1
pip install requests python-dotenv
copy .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `TL_API_KEY` | TwelveLabs API key |
| `KNOWLEDGE_STORE_ID` | Target knowledge store (create one in Playground or via `main.py`) |

## Library folder

Optional local uploads: place `.mp4` files in `library/` (gitignored). `main.py` can upload and ingest them.

## Run

```powershell
python main.py
```

Use the same `TL_API_KEY` and `KNOWLEDGE_STORE_ID` in [`2-vllm-arena`](../2-vllm-arena/.env.example) for the web arena.

See the [monorepo README](../README.md) for GitHub and Vercel instructions.
