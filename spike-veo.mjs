// Veo 2 Spike — 验证图生视频
// 用法：node spike-veo.mjs <pet-photo>

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import fs from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'

const execFileP = promisify(execFile)

const KEY = process.env.GEMINI_API_KEY
const PROXY = process.env.ALL_PROXY || process.env.HTTPS_PROXY
if (!KEY) { console.error('❌ GEMINI_API_KEY missing'); process.exit(1) }

const inputPath = process.argv[2]
if (!inputPath) { console.error('用法: node spike-veo.mjs <photo>'); process.exit(1) }

const MODEL = 'veo-2.0-generate-001'
const OUT = 'spike-output/veo-bobo-hello.mp4'

const imgBuf = await fs.readFile(inputPath)
const imgB64 = imgBuf.toString('base64')
const mime = inputPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'

// ---------- curl helpers ----------
function proxyArgs() {
  return PROXY ? ['-x', PROXY.replace(/^socks5:/, 'socks5h:')] : []
}
async function curlPost(url, body) {
  const tmp = path.join(os.tmpdir(), `veo-${Date.now()}.json`)
  await fs.writeFile(tmp, body)
  try {
    const args = ['-sS', '--fail-with-body', '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '--data-binary', `@${tmp}`, '--max-time', '120', ...proxyArgs(), url]
    const { stdout } = await execFileP('curl', args, { maxBuffer: 100 * 1024 * 1024 })
    return JSON.parse(stdout)
  } finally { fs.unlink(tmp).catch(() => {}) }
}
async function curlGet(url) {
  const { stdout } = await execFileP('curl',
    ['-sS', '--fail-with-body', '--max-time', '60', ...proxyArgs(), url],
    { maxBuffer: 100 * 1024 * 1024 })
  return JSON.parse(stdout)
}
async function curlGetBinary(url, out) {
  await execFileP('curl',
    ['-sS', '--fail', '-L', '-o', out, '--max-time', '300', ...proxyArgs(), url],
    { maxBuffer: 200 * 1024 * 1024 })
}

// ---------- 提交 ----------
console.log(`📸 输入: ${inputPath} (${(imgBuf.length / 1024).toFixed(1)} KB)`)
console.log(`🎬 模型: ${MODEL}`)
console.log(`⏱  时长: 5 秒 (Veo 2 最短支持值)`)
if (PROXY) console.log(`🌐 代理: ${PROXY}`)

const submitUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning?key=${KEY}`

const body = JSON.stringify({
  instances: [{
    prompt: [
      'The same snowshoe ragdoll cat as in the reference image,',
      'happily waving one paw at the viewer in greeting with a friendly expression.',
      'Cute subtle cartoon-like motion, soft natural indoor lighting.',
      'The cat must keep the exact same facial markings: black ears, white face with brown/black patch on right side of forehead, bright blue eyes, long white whiskers, pink nose.',
      'Loopable 5 second animation, portrait orientation.',
    ].join(' '),
    image: { bytesBase64Encoded: imgB64, mimeType: mime },
  }],
  parameters: {
    aspectRatio: '9:16',
    durationSeconds: 5,
    personGeneration: 'dont_allow',
  },
})

console.log('\n📤 提交任务...')
const t0 = Date.now()
let submit
try {
  submit = await curlPost(submitUrl, body)
} catch (e) {
  console.error('❌ 提交请求失败:', e.stderr || e.message)
  process.exit(1)
}
if (!submit.name) {
  console.error('❌ 提交返回异常（可能 Key 未开通 Veo 或计费）:')
  console.error(JSON.stringify(submit, null, 2))
  process.exit(1)
}
console.log(`✅ 任务 ID: ${submit.name} (${Date.now() - t0}ms)`)

// ---------- 轮询 ----------
const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${submit.name}?key=${KEY}`
let done = false, data
for (let i = 0; i < 40 && !done; i++) {
  await new Promise((r) => setTimeout(r, 10_000))
  try {
    data = await curlGet(pollUrl)
    const elapsed = Math.round((Date.now() - t0) / 1000)
    console.log(`  轮询 #${i + 1} (+${elapsed}s)  done=${data.done ?? false}`)
    if (data.done) done = true
  } catch (e) {
    console.warn(`  轮询 #${i + 1} 网络错误，重试中... ${(e.stderr || e.message).slice(0, 120)}`)
  }
}
if (!done) { console.error('❌ 6 分钟未完成，超时'); process.exit(1) }
if (data.error) { console.error('❌ 生成失败:', JSON.stringify(data.error, null, 2)); process.exit(1) }

// ---------- 提取视频 ----------
const resp = data.response ?? {}
// 可能的字段结构：generateVideoResponse.generatedSamples[] 或 generatedVideos[]
const sample =
  resp.generateVideoResponse?.generatedSamples?.[0] ??
  resp.generatedVideos?.[0] ??
  resp.videos?.[0]
const video = sample?.video ?? sample
if (!video) {
  console.error('❌ 响应结构异常，完整内容：')
  console.error(JSON.stringify(data, null, 2).slice(0, 2000))
  process.exit(1)
}

await fs.mkdir('spike-output', { recursive: true })

if (video.uri || video.videoUri) {
  const uri = video.uri || video.videoUri
  const dlUrl = uri.includes('?') ? `${uri}&key=${KEY}` : `${uri}?key=${KEY}`
  console.log(`\n⬇️  下载: ${uri.slice(0, 80)}...`)
  await curlGetBinary(dlUrl, OUT)
} else if (video.videoBytes || video.bytesBase64Encoded) {
  const b64 = video.videoBytes || video.bytesBase64Encoded
  await fs.writeFile(OUT, Buffer.from(b64, 'base64'))
} else {
  console.error('❌ 视频字段未识别，keys=', Object.keys(video))
  console.error(JSON.stringify(video, null, 2).slice(0, 800))
  process.exit(1)
}

const stat = await fs.stat(OUT)
console.log(`\n✅ 完成  ${OUT}`)
console.log(`   大小: ${(stat.size / 1024 / 1024).toFixed(2)} MB`)
console.log(`   总耗时: ${Math.round((Date.now() - t0) / 1000)} s`)
console.log(`\n用系统播放器打开看效果。文件在 ${path.resolve(OUT)}`)
