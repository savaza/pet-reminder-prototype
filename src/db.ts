import Dexie, { type Table } from 'dexie'
import type { Todo, Pet, Portrait, Settings } from '@/types'

export class FurryDB extends Dexie {
  todos!: Table<Todo, number>
  pet!: Table<Pet, number>
  portraits!: Table<Portrait, [string, string]>
  settings!: Table<Settings & { key: string }, string>

  constructor() {
    super('furrybuddy')
    this.version(1).stores({
      todos: '++id, time, group, priority, enabled, done, createdAt',
      pet: 'id',
      portraits: '[moodId+periodId], moodId, periodId',
      settings: 'key',
    })
  }
}

export const db = new FurryDB()

// 首次打开时的种子数据
export async function seedIfEmpty() {
  const count = await db.todos.count()
  if (count > 0) return

  const now = Date.now()
  await db.pet.put({ id: 1, name: '波波', baseStyle: 'realistic' })
  await db.todos.bulkAdd([
    { title: '法规库日会',             group: 'work',   priority: 'p0', time: '09:30', repeat: 'daily',  enabled: true,  done: true,  createdAt: now },
    { title: '起草出海合规立项纪要',   group: 'work',   priority: 'p1', time: '14:00', repeat: 'once',   enabled: true,  done: false, createdAt: now },
    { title: '喝水提醒',               group: 'health', priority: 'p2', time: '10:00', repeat: 'daily',  enabled: true,  done: true,  createdAt: now },
    { title: '起来活动活动',           group: 'health', priority: 'p2', time: '15:00', repeat: 'daily',  enabled: false, done: false, createdAt: now },
    { title: '给波波买罐头',           group: 'life',   priority: 'p1', time: '20:00', repeat: 'weekly', enabled: true,  done: false, createdAt: now, due: '2026-05-15' },
    { title: '远诊项目周会',           group: 'work',   priority: 'p1', time: '16:30', repeat: 'weekly', enabled: true,  done: false, createdAt: now },
  ] as Todo[])
}
