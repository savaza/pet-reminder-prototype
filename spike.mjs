// 技术验证脚本（M0 Spike）
// 验证 Gemini 2.5 Flash Image (Nano Banana) 能否基于一张宠物照片生成不同情绪的立绘
// 用法：node spike.mjs path/to/pet.jpg

import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { SocksProxyAgent } from 'socks-proxy-agent'
import axios from 'axios'

const KEY = process.env.GEMINI_API_KEY
const PROXY = process.env.ALL_PROXY || process.env.HTTPS_PROXY
if (!KEY) { console.error('❌ 缺少 GEMINI_API_KEY (.env.local)'); process.exit(1) }

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('用法: node spike.mjs <宠物照片路径>')
  console.error('例:  node spike.mjs ~/Downloads/my-cat.jpg')
  process.exit(1)
}

const OUT_DIR = 'spike-output'
await fs.mkdir(OUT_DIR, { recursive: true })

// 测试 5 个变体，覆盖情绪 × 时段
const VARIANTS = [
  { id: 'happy-morning',     prompt: 'Transform the cat in the reference photo into the same cat but with a happy cheerful expression, bright morning sunlight filtering through, soft pastel background. Keep the exact same facial markings, fur pattern, and blue eyes.' },
  { id: 'sleepy-afternoon',  prompt: 'Same cat from the reference photo, now looking sleepy and drowsy with half-closed eyes, curled up in a sunny afternoon window, warm golden hour light. Preserve the exact same fur pattern and facial features.' },
  { id: 'cheer-anytime',     prompt: 'The same cat from the reference photo, now striking an encouraging pose with a determined expression, paws raised as if cheering. Studio soft light. Keep identical fur markings, eye color, and ears.' },
  { id: 'cute-evening',      prompt: 'Same cat from the reference, making a cute begging expression with big round eyes, soft evening lamp light, cozy pink-purple background. Maintain the same fur pattern and face structure.' },
  { id: 'angry-night',       prompt: 'The same cat from the reference, now with a grumpy annoyed expression, ears slightly back, nighttime dark blue moody lighting. Keep the exact same fur markings and features.' },
]

const MODEL = 'gemini-2.5-flash-image'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`

// 代理配置
const axiosOpts = {}
if (PROXY) {
  const url = PROXY.replace(/^socks5:/, 'socks5h:') // DNS over socks
  axiosOpts.httpAgent = new SocksProxyAgent(url)
  axiosOpts.httpsAgent = new SocksProxyAgent(url)
  console.log(`🌐 代理: ${PROXY}`)
}

const imgBuf = await fs.readFile(inputPath)
const imgB64 = imgBuf.toString('base64')
const mime = inputPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
console.log(`📸 输入图: ${inputPath} (${(imgBuf.length / 1024).toFixed(1)} KB)`)
console.log(`🎯 将生成 ${VARIANTS.length} 个变体到 ${OUT_DIR}/\n`)

for (const v of VARIANTS) {
  const t0 = Date.now()
  try {
    const body = {
      contents: [{
        parts: [
          { text: v.prompt },
          { inline_data: { mime_type: mime, data: imgB64 } },
        ],
      }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }
    const { data } = await axios.post(ENDPOINT, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60_000,
      ...axiosOpts,
    })

    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const imgPart = parts.find((p) => p.inline_data || p.inlineData)
    const b64 = imgPart?.inline_data?.data ?? imgPart?.inlineData?.data

    if (!b64) {
      console.log(`  ⚠️  ${v.id}: 未返回图像数据，response=`, JSON.stringify(data).slice(0, 200))
      continue
    }
    const outPath = path.join(OUT_DIR, `${v.id}.png`)
    await fs.writeFile(outPath, Buffer.from(b64, 'base64'))
    console.log(`  ✅ ${v.id}  (${Date.now() - t0}ms)  -> ${outPath}`)
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message
    console.log(`  ❌ ${v.id}: ${msg}`)
  }
}

console.log(`\n完成。打开 ${OUT_DIR}/ 肉眼看：同一只猫吗？像不像？这决定产品能不能走下去。`)
