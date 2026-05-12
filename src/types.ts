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
}

export interface Pet {
  id: 1
  name: string
  baseStyle: 'realistic' | 'anime' | 'pixar' | 'ink'
  sourcePhotoBlob?: Blob  // 用户上传的原照
}

export interface Portrait {
  moodId: MoodId
  periodId: PeriodId
  blob?: Blob              // AI 生成图；原型阶段为空则 fallback mock
  createdAt?: number
}

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
