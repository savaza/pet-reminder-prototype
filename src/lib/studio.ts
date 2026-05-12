/**
 * Studio 生成逻辑
 * - 当前为 MOCK 模式：点击生成 → 延时 2-4 秒 → 写入占位资源
 * - 真 API hook 预留：generateImageReal / generateVideoReal（后续替换 mock 分支即可）
 */

import { db } from '@/db'
import type { MoodId, PeriodId, Portrait, PortraitKind } from '@/types'
import { COST_IMAGE, COST_VIDEO } from '@/types'
import { MOCK_IMAGES } from '@/lib/constants'

export const MOCK_VIDEO_URL = '/pets/bobo-hello.mp4' // 复用 Spike 出的唯一真实 Veo 视频做 Mock 占位

export interface GenerateParams {
  moodId: MoodId
  periodId: PeriodId
  kind: PortraitKind
}

function randomImg(moodIdx: number, periodIdx: number) {
  return MOCK_IMAGES[(moodIdx * 5 + periodIdx) % MOCK_IMAGES.length]
}

async function simulateDelay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** Mock 生成——不真调 API，不花钱 */
export async function generatePortraitMock(
  { moodId, periodId, kind }: GenerateParams,
  onState: (p: Portrait) => void,
  moodIdx: number,
  periodIdx: number,
): Promise<Portrait> {
  const base: Portrait = { moodId, periodId, kind, status: 'generating' }
  await db.portraits.put(base)
  onState(base)

  await simulateDelay(kind === 'video' ? 4000 : 2000)

  const done: Portrait = {
    moodId,
    periodId,
    kind,
    status: 'ready',
    mockUrl: kind === 'video' ? MOCK_VIDEO_URL : randomImg(moodIdx, periodIdx),
    generatedAt: Date.now(),
    cost: kind === 'video' ? COST_VIDEO : COST_IMAGE,
    prompt: `[MOCK] ${moodId} × ${periodId} × ${kind}`,
  }
  await db.portraits.put(done)
  onState(done)
  return done
}

/** 真实生成接口占位——未来换成 fetch /api/generate 调用 */
export async function generatePortraitReal(_params: GenerateParams): Promise<Portrait> {
  // TODO: 调用 Vercel Serverless /api/generate，后端再调 Gemini/Veo
  // 目前直接返回错误让调用方降级
  throw new Error('Real generation not implemented — running in Mock mode')
}

export async function deletePortrait(moodId: MoodId, periodId: PeriodId) {
  await db.portraits.delete([moodId, periodId])
}

export async function loadAllPortraits(): Promise<Portrait[]> {
  return db.portraits.toArray()
}

/** 累计本月 / 今日费用 */
export async function getSpentSummary(): Promise<{ today: number; month: number }> {
  const all = await db.portraits.toArray()
  const now = new Date()
  let today = 0, month = 0
  for (const p of all) {
    if (!p.cost || !p.generatedAt) continue
    const d = new Date(p.generatedAt)
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      month += p.cost
      if (d.getDate() === now.getDate()) today += p.cost
    }
  }
  return { today, month }
}
