import fs from "fs";
import os from "os";
import path from "path";
import type { GoogleGenAI } from "@google/genai";
import { corpora, defaultCorpusId } from "@/lib/corpora";

export type GeminiCachedFile = {
  name: string;
  uri: string;
  mimeType: string;
  localPath: string;
  fileResourceName?: string;
  uploadedAt?: string;
  expiresAt?: string;
};

type GeminiFileRecord = {
  name?: string;
  uri?: string;
  mimeType?: string;
  state?: string;
  expirationTime?: string;
};

const CACHE_PATH = path.join(
  process.cwd(),
  "api",
  "gemini_prompt",
  "preloaded_videos.json"
);

const RUNTIME_CACHE_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), "vllm-arena-gemini-files.json")
  : CACHE_PATH;

const VIDEOS_DIR = path.join(process.cwd(), "public", "videos");

/** Gemini Files API TTL is 48h — refresh before that window closes. */
const EXPIRY_BUFFER_MS = 60 * 60 * 1000;

const uploadsInFlight = new Map<string, Promise<GeminiCachedFile>>();

export function geminiCachePath() {
  return CACHE_PATH;
}

export function loadGeminiCache(): GeminiCachedFile[] {
  const paths = [RUNTIME_CACHE_PATH, CACHE_PATH].filter(
    (value, index, all) => all.indexOf(value) === index
  );

  const merged = new Map<string, GeminiCachedFile>();

  for (const cachePath of paths) {
    if (!fs.existsSync(cachePath)) continue;
    try {
      const entries = JSON.parse(
        fs.readFileSync(cachePath, "utf8")
      ) as GeminiCachedFile[];
      for (const entry of entries) {
        if (!entry.localPath) continue;
        merged.set(cacheKey(entry.localPath), entry);
      }
    } catch {
      /* ignore malformed cache */
    }
  }

  return [...merged.values()];
}

export function saveGeminiCache(entries: GeminiCachedFile[]) {
  fs.mkdirSync(path.dirname(RUNTIME_CACHE_PATH), { recursive: true });
  fs.writeFileSync(RUNTIME_CACHE_PATH, JSON.stringify(entries, null, 2));

  if (RUNTIME_CACHE_PATH !== CACHE_PATH) {
    try {
      fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
      fs.writeFileSync(CACHE_PATH, JSON.stringify(entries, null, 2));
    } catch {
      /* project cache may be read-only in serverless */
    }
  }
}

export function listLocalCorpusVideos() {
  if (!fs.existsSync(VIDEOS_DIR)) return [];

  return fs
    .readdirSync(VIDEOS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => ({
      name,
      localPath: path.join(VIDEOS_DIR, name),
    }));
}

export function resolveCorpusVideoPath(filename: string) {
  const normalized = filename.trim().toLowerCase();
  const corpus = corpora[defaultCorpusId];
  const fromCorpus = corpus?.videos.find((video) => {
    const base = decodeURIComponent(video.src.split("/").pop() ?? "").toLowerCase();
    return base === normalized;
  });

  if (fromCorpus) {
    const localPath = path.join(
      process.cwd(),
      "public",
      fromCorpus.src.replace(/^\//, "")
    );
    if (fs.existsSync(localPath)) {
      return {
        name: path.basename(localPath),
        localPath,
      };
    }
  }

  const fallback = path.join(VIDEOS_DIR, filename);
  if (fs.existsSync(fallback)) {
    return { name: path.basename(fallback), localPath: fallback };
  }

  return null;
}

function cacheKey(localPath: string) {
  return path.resolve(localPath);
}

function upsertCacheEntry(entry: GeminiCachedFile) {
  const cache = loadGeminiCache();
  const key = cacheKey(entry.localPath);
  const next = cache.filter((item) => cacheKey(item.localPath) !== key);
  next.push(entry);
  saveGeminiCache(next);
  return entry;
}

function readExpiryMs(entry: GeminiCachedFile) {
  if (!entry.expiresAt) return 0;
  const ms = Date.parse(entry.expiresAt);
  return Number.isFinite(ms) ? ms : 0;
}

function isCacheEntryFresh(entry: GeminiCachedFile) {
  const expiresAt = readExpiryMs(entry);
  if (!expiresAt) return false;
  return Date.now() < expiresAt - EXPIRY_BUFFER_MS;
}

async function waitUntilActive(
  client: GoogleGenAI,
  file: GeminiFileRecord
) {
  let current = file;
  while (current.state === "PROCESSING") {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (!current.name) {
      throw new Error("Gemini file is missing a resource name while processing.");
    }
    current = await client.files.get({ name: current.name });
  }

  if (current.state !== "ACTIVE") {
    throw new Error(
      `Gemini file ${current.name ?? "unknown"} ended in state ${current.state ?? "UNKNOWN"}`
    );
  }

  return current;
}

async function verifyRemoteFile(
  client: GoogleGenAI,
  entry: GeminiCachedFile
) {
  if (!entry.fileResourceName) return false;

  try {
    const remote = await client.files.get({ name: entry.fileResourceName });
    if (remote.state !== "ACTIVE") return false;

    if (remote.expirationTime) {
      const expiresAt = Date.parse(remote.expirationTime);
      if (Number.isFinite(expiresAt) && Date.now() >= expiresAt - EXPIRY_BUFFER_MS) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function toCachedFile(localPath: string, file: GeminiFileRecord): GeminiCachedFile {
  const uploadedAt = new Date().toISOString();
  const expiresAt =
    file.expirationTime ??
    new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  return {
    name: path.basename(localPath),
    uri: file.uri ?? "",
    mimeType: file.mimeType ?? "video/mp4",
    localPath: cacheKey(localPath),
    fileResourceName: file.name,
    uploadedAt,
    expiresAt,
  };
}

async function uploadLocalVideo(client: GoogleGenAI, localPath: string) {
  if (!fs.existsSync(localPath)) {
    throw new Error(
      `Corpus video not found at ${localPath}. Add MP4 files under public/videos/.`
    );
  }

  const uploaded = await client.files.upload({
    file: localPath,
    config: { mimeType: "video/mp4" },
  });
  const active = await waitUntilActive(client, uploaded);
  const cached = toCachedFile(localPath, active);

  if (!cached.uri) {
    throw new Error(`Gemini upload succeeded but no URI was returned for ${cached.name}.`);
  }

  return upsertCacheEntry(cached);
}

export async function ensureGeminiFile(
  client: GoogleGenAI,
  localPath: string,
  options?: { force?: boolean }
) {
  const resolved = cacheKey(localPath);
  const force = options?.force ?? false;

  if (!force) {
    const cached = loadGeminiCache().find(
      (entry) => cacheKey(entry.localPath) === resolved
    );

    if (cached?.uri && isCacheEntryFresh(cached)) {
      const remoteOk = await verifyRemoteFile(client, cached);
      if (remoteOk) return cached;
    }
  }

  const inFlight = uploadsInFlight.get(resolved);
  if (inFlight) return inFlight;

  const uploadPromise = uploadLocalVideo(client, resolved).finally(() => {
    uploadsInFlight.delete(resolved);
  });

  uploadsInFlight.set(resolved, uploadPromise);
  return uploadPromise;
}

export async function ensureDefaultGeminiCorpusVideo(client: GoogleGenAI) {
  const corpus = corpora[defaultCorpusId];
  const defaultVideo = corpus?.videos[0];
  if (!defaultVideo) {
    throw new Error("No default corpus videos configured.");
  }

  const localPath = path.join(
    process.cwd(),
    "public",
    defaultVideo.src.replace(/^\//, "")
  );

  const active = await ensureGeminiFile(client, localPath);
  const total = listLocalCorpusVideos().length || corpus.videos.length;

  return { active, total };
}

export function isGeminiFileExpiredError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("expired") ||
    lower.includes("not found") ||
    lower.includes("no longer available") ||
    lower.includes("invalid argument") && lower.includes("file")
  );
}
