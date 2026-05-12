import type { Mood, Period, GroupId, PriorityId, RepeatId } from '@/types'

export const MOODS: Mood[] = [
  { id: 'happy',  cn: '开心',   emoji: '😸', msg: (n) => `${n}～我好开心，今天和你一起又搞定一件事！` },
  { id: 'hello',  cn: '打招呼', emoji: '👋', msg: (n) => `下午好呀${n}～ 刚睡了个午觉，超想你的欸！` },
  { id: 'sleepy', cn: '犯困',   emoji: '😴', msg: (n) => `呼噜呼噜…我有点困了，${n}也记得休息鸭` },
  { id: 'cute',   cn: '撒娇',   emoji: '🥺', msg: (n) => `${n}…都好久没陪我了，是不是不要我了` },
  { id: 'cheer',  cn: '鼓励',   emoji: '💪', msg: (n) => `别放弃！${n}已经做到这一步了，我陪你！` },
  { id: 'angry',  cn: '生气',   emoji: '😾', msg: (n) => `哼！又在拖延，${n}再不做我就挠键盘啦` },
]

export const PERIODS: Period[] = [
  { id: 'morning',   cn: '早晨', emoji: '🌅' },
  { id: 'noon',      cn: '中午', emoji: '☀️' },
  { id: 'afternoon', cn: '下午', emoji: '🌤' },
  { id: 'night',     cn: '夜晚', emoji: '🌙' },
  { id: 'festival',  cn: '节日', emoji: '🎉' },
]

export const GROUP_META: Record<GroupId, { cn: string; cls: string; emoji: string }> = {
  work:   { cn: '工作', cls: 'mt-work',   emoji: '💼' },
  life:   { cn: '生活', cls: 'mt-life',   emoji: '🏠' },
  health: { cn: '健康', cls: 'mt-health', emoji: '💚' },
}

export const PRIORITY_META: Record<PriorityId, { label: string; emoji: string }> = {
  p0: { label: 'P0 紧急', emoji: '🔴' },
  p1: { label: 'P1 重要', emoji: '🟡' },
  p2: { label: 'P2 一般', emoji: '⚪' },
}

export const REPEAT_META: Record<RepeatId, string> = {
  once: '仅一次', daily: '每天', weekly: '每周', monthly: '每月',
}

/**
 * 动态视频池——生产版本由 Veo 2 基于用户宠物照生成，每个情绪一段
 * 当前 prototype 阶段：仅 `hello` 有真实 Veo 视频（bobo 打招呼 5 秒）
 * 其它 mood 暂 fallback 到静态图 + CSS 呼吸动画
 */
export const VIDEO_POOL: Partial<Record<import('@/types').MoodId, string>> = {
  hello: '/pets/bobo-hello.mp4',
}

// 静态占位图——生产版本被 Gemini Flash Image 生成的 blob 替换
export const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1496807586562-947e10887dc5?auto=format&fit=crop&w=600&q=80',
]

export function imgForMoodPeriod(moodIdx: number, periodIdx: number): string {
  return MOCK_IMAGES[(moodIdx * 5 + periodIdx) % MOCK_IMAGES.length]
}

export function periodFromHour(h: number): number {
  if (h < 11) return 0
  if (h < 14) return 1
  if (h < 18) return 2
  return 3
}

export function greetByHour(h: number): string {
  if (h < 6) return '凌晨好'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}
