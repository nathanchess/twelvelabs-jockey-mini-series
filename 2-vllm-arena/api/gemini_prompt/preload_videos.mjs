import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const project_root = path.join(__dirname, '../..')
const videos_folder_path = path.join(project_root, 'public/videos')
const output_path = path.join(__dirname, 'preloaded_videos.json')

loadEnvFile(path.join(project_root, '.env'))

const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error(
    'Missing API key. Set GOOGLE_API_KEY or GEMINI_API_KEY in 2-vllm-arena/.env'
  )
}

const google_client = new GoogleGenAI({ apiKey })

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

async function waitUntilActive(file) {
  let current = file
  while (current.state === 'PROCESSING') {
    await new Promise((r) => setTimeout(r, 5000))
    current = await google_client.files.get({ name: current.name })
  }
  if (current.state !== 'ACTIVE') {
    throw new Error(`File ${current.name} ended in state ${current.state}`)
  }
  return current
}

async function preload_videos(local_paths) {
  const file_data = []
  for (const local_path of local_paths) {
    console.log(`Uploading ${path.basename(local_path)}...`)
    const uploaded = await google_client.files.upload({
      file: local_path,
      config: { mimeType: 'video/mp4' },
    })
    const file = await waitUntilActive(uploaded)
    file_data.push({
      name: path.basename(local_path),
      uri: file.uri,
      mimeType: file.mimeType,
    })
    console.log(`Ready: ${path.basename(local_path)}`)
  }
  return file_data
}

if (!fs.existsSync(videos_folder_path)) {
  throw new Error(
    `Videos folder not found: ${videos_folder_path}\nCreate it and add .mp4 files, then run again.`
  )
}

const local_paths = fs
  .readdirSync(videos_folder_path)
  .filter((name) => name.toLowerCase().endsWith('.mp4'))
  .map((name) => path.join(videos_folder_path, name))

if (local_paths.length === 0) {
  throw new Error(`No .mp4 files in ${videos_folder_path}`)
}

const file_data = await preload_videos(local_paths)
fs.writeFileSync(output_path, JSON.stringify(file_data, null, 2))
console.log(`Wrote ${file_data.length} file(s) to ${output_path}`)
