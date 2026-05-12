// 技术验证脚本（M0 Spike）
// 验证 Gemini 2.5 Flash Image (Nano Banana) 能否基于宠物照片保持一致性生成不同情绪立绘
// 用法：node spike.mjs <宠物照片路径>
//
// 说明：HTTP 请求走 curl（原生 SOCKS5 最稳），不用 axios，规避 Node TLS + SocksProxyAgent 的偶发 bug。

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env', override: false })

import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'

const execFileP = promisify(execFile)

const KEY = process.env.GEMINI_API_KEY
const PROXY = process.env.ALL_PROXY || process.env.HTTPS_PROXY
if (!KEY) { console.error('❌ 缺少 GEMINI_API_KEY (.env.local)'); process.exit(1) }

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('用法: node spike.mjs <宠物照片路径>')
  process.exit(1)
}

const OUT_DIR = 'spike-output'
await fs.mkdir(OUT_DIR, { recursive: true })

const VARIANTS = [
  { id: 'happy-morning',    prompt: 'Transform the cat in the reference photo into the same cat but with a happy cheerful expression, bright morning sunlight filtering through, soft pastel background. Keep the exact same facial markings, fur pattern, and blue eyes.' },
  { id: 'sleepy-afternoon', prompt: 'Same cat from the reference photo, now looking sleepy and drowsy with half-closed eyes, curled up in a sunny afternoon window, warm golden hour light. Preserve the exact same fur pattern and facial features.' },
  { id: 'cheer-anytime',    prompt: 'The same cat from the reference photo, now striking an encouraging pose with a determined expression, paws raised as if cheering. Studio soft light. Keep identical fur markings, eye color, and ears.' },
  { id: 'cute-evening',     prompt: 'Same cat from the reference, making a cute begging expression with big round eyes, soft evening lamp light, cozy pink-purple background. Maintain the same fur pattern and face structure.' },
  { id: 'angry-night',      prompt: 'The same cat from the reference, now with a grumpy annoyed expression, ears slightly back, nighttime dark blue moody lighting. Keep the exact same fur markings and features.' },
]

const MODEL = 'gemini-2.5-flash-image'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`

const imgBuf = await fs.readFile(inputPath)
const imgB64 = imgBuf.toString('base64')
const mime = inputPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
console.log(`📸 输入图: ${inputPath} (${(imgBuf.length / 1024).toFixed(1)} KB)`)
if (PROXY) console.log(`🌐 代理: ${PROXY} (走 curl)`)
console.log(`🎯 将生成 ${VARIANTS.length} 个变体到 ${OUT_DIR}/\n`)

async function callGemini(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [
      { text: prompt },
      { inline_data: { mime_type: mime, data: imgB64 } },
    ]}],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  })
  // 写到临时文件避免超长命令行 / stdin 在 Windows 下的坑
  const tmp = path.join(os.tmpdir(), `spike-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`)
  await fs.writeFile(tmp, body)
  try {
    const args = [
      '-sS', '--fail-with-body',
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '--data-binary', `@${tmp}`,
      '--max-time', '90',
    ]
    if (PROXY) args.push('-x', PROXY.replace(/^socks5:/, 'socks5h:'))
    args.push(ENDPOINT)
    const { stdout } = await execFileP('curl', args, { maxBuffer: 50 * 1024 * 1024 })
    return JSON.parse(stdout)
  } finally {
    fs.unlink(tmp).catch(() => {})
  }
}

for (const v of VARIANTS) {
  const t0 = Date.now()
  let ok = false
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const data = await callGemini(v.prompt)
      const parts = data?.candidates?.[0]?.content?.parts ?? []
      const imgPart = parts.find((p) => p.inline_data || p.inlineData)
      const b64 = imgPart?.inline_data?.data ?? imgPart?.inlineData?.data
      if (!b64) {
        const err = data?.error?.message || JSON.stringify(data).slice(0, 300)
        throw new Error(err)
      }
      const outPath = path.join(OUT_DIR, `${v.id}.png`)
      await fs.writeFile(outPath, Buffer.from(b64, 'base64'))
      console.log(`  ✅ ${v.id}  (${Date.now() - t0}ms, try${attempt})  -> ${outPath}`)
      ok = true
    } catch (err) {
      const msg = (err.stderr || err.message || '').slice(0, 250)
      if (attempt === 3) console.log(`  ❌ ${v.id}: ${msg}`)
      else await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
}

console.log(`\n完成。打开 ${OUT_DIR}/ 肉眼验收：是同一只猫吗？不同情绪/光线是否体现？`)
