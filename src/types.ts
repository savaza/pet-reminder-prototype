export type GroupId = 'work' | 'life' | 'health'
export type PriorityId = 'p0' | 'p1' | 'p2'
export type RepeatId = 'once' | 'daily' | 'weekly' | 'monthly'
export type MoodId = 'happy' | 'hello' | 'sleepy' | 'cute' | 'cheer' | 'angry'
export type PeriodId = 'morning' | 'noon' | 'afternoon' | 'night' | 'festival'

export interface Todo {
  id: number
  title: string
  group: GroupId
  priority: PriorityId
  time: string            // HH:mm
  repeat: RepeatId
  due?: string            // YYYY-MM-DD
  enabled: boolean
  done: boolean
  createdAt: number
  lastFiredAt?: number    // 上次触发提醒的 epoch ms（防止同一 slot 重复触发）
  snoozeUntil?: number    // 暂缓到此时间（+10 分钟 等操作）
}

export interface Pet {
  id: 1
  name: string
  baseStyle: 'realistic' | 'anime' | 'pixar' | 'ink'
  sourcePhotoBlob?: Blob  // 用户上传的原照
}

export type PortraitKind = 'image' | 'video'
export type PortraitStatus = 'none' | 'generating' | 'ready' | 'failed'

export interface Portrait {
  moodId: MoodId
  periodId: PeriodId
  kind: PortraitKind
  status: PortraitStatus
  blob?: Blob              // 真实生成：Gemini/Veo 返回的数据
  mockUrl?: string         // Prototype Mock 模式：用 public/ 或 Unsplash
  prompt?: string          // 本次生成用的 prompt 记录
  generatedAt?: number
  cost?: number            // 本次调用花费（¥）
  errorMsg?: string
}

/** Studio 生成成本估算 */
export const COST_IMAGE = 0.3   // Gemini Flash Image, ¥/张
export const COST_VIDEO = 12    // Veo 2 5秒, ¥/段

export interface Mood { id: MoodId; cn: string; emoji: string; msg: (petName: string) => string }
export interface Period { id: PeriodId; cn: string; emoji: string }

export interface ToastPayload {
  todoId?: number
  todoTitle: string
  moodId: MoodId
  periodId: PeriodId
  groupId: GroupId
  priority: PriorityId
  triggerReason: string
}

export interface Settings {
  appPassword?: string
  geminiKeyMasked?: string  // 仅显示用的掩码，真实 key 存后端
}
