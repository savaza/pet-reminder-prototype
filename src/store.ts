import { create } from 'zustand'
import { db } from '@/db'
import type { Todo, GroupId, ToastPayload, MoodId, PeriodId } from '@/types'
import { pickMood } from '@/lib/rules'
import { periodFromHour } from '@/lib/constants'

type Filter = GroupId | 'all'
type ModalKind = 'none' | 'add-todo'

interface AppState {
  // 数据
  todos: Todo[]
  petName: string

  // UI
  activeMoodIdx: number
  activePeriodIdx: number
  filter: Filter
  modal: ModalKind
  drawerOpen: boolean
  sheetOpen: boolean
  toast: ToastPayload | null

  // 操作
  loadFromDB: () => Promise<void>
  addTodo: (t: Omit<Todo, 'id' | 'createdAt'>) => Promise<void>
  toggleTodo: (id: number) => Promise<void>
  completeTodo: (id: number) => Promise<void>
  setFilter: (f: Filter) => void
  setMood: (moodIdx: number, periodIdx?: number) => void
  cycleMood: () => void
  setPetName: (name: string) => Promise<void>
  openModal: (m: ModalKind) => void
  toggleDrawer: (v?: boolean) => void
  toggleSheet: (v?: boolean) => void
  showToast: (t: ToastPayload) => void
  closeToast: () => void
  triggerDemoReminder: () => void
}

const MOOD_TO_IDX: Record<MoodId, number> = {
  happy: 0, hello: 1, sleepy: 2, cute: 3, cheer: 4, angry: 5,
}
const PERIOD_TO_IDX: Record<PeriodId, number> = {
  morning: 0, noon: 1, afternoon: 2, night: 3, festival: 4,
}

export const useAppStore = create<AppState>((set, get) => ({
  todos: [],
  petName: '波波',
  activeMoodIdx: 1, // hello
  activePeriodIdx: periodFromHour(new Date().getHours()),
  filter: 'all',
  modal: 'none',
  drawerOpen: false,
  sheetOpen: false,
  toast: null,

  async loadFromDB() {
    const [todos, pet] = await Promise.all([
      db.todos.toArray(),
      db.pet.get(1),
    ])
    set({ todos, petName: pet?.name ?? '波波' })
  },

  async addTodo(t) {
    const id = await db.todos.add({ ...t, createdAt: Date.now() } as Todo)
    const full = await db.todos.get(id)
    if (full) set((s) => ({ todos: [...s.todos, full], activeMoodIdx: MOOD_TO_IDX.hello }))
  },

  async toggleTodo(id) {
    const t = get().todos.find((x) => x.id === id)
    if (!t) return
    const next = { ...t, enabled: !t.enabled }
    await db.todos.update(id, { enabled: next.enabled })
    set((s) => ({ todos: s.todos.map((x) => (x.id === id ? next : x)) }))
  },

  async completeTodo(id) {
    await db.todos.update(id, { done: true })
    set((s) => ({
      todos: s.todos.map((x) => (x.id === id ? { ...x, done: true } : x)),
      activeMoodIdx: MOOD_TO_IDX.happy,
    }))
  },

  setFilter(f) { set({ filter: f }) },

  setMood(moodIdx, periodIdx) {
    set({ activeMoodIdx: moodIdx, ...(periodIdx !== undefined ? { activePeriodIdx: periodIdx } : {}) })
  },

  cycleMood() {
    set((s) => ({ activeMoodIdx: (s.activeMoodIdx + 1) % 6 }))
  },

  async setPetName(name) {
    await db.pet.update(1, { name })
    set({ petName: name })
  },

  openModal(m) { set({ modal: m }) },
  toggleDrawer(v) { set((s) => ({ drawerOpen: v ?? !s.drawerOpen })) },
  toggleSheet(v)  { set((s) => ({ sheetOpen:  v ?? !s.sheetOpen  })) },

  showToast(t) { set({ toast: t, activeMoodIdx: MOOD_TO_IDX[t.moodId] }) },
  closeToast() { set({ toast: null }) },

  triggerDemoReminder() {
    const { todos } = get()
    const active = todos.filter((t) => t.enabled && !t.done)
    const t = active[Math.floor(Math.random() * active.length)] ?? todos[0]
    if (!t) return
    const rule = pickMood({ todo: t, now: new Date(), event: 'fire' })
    set({
      toast: {
        todoId: t.id,
        todoTitle: t.title,
        moodId: rule.mood,
        periodId: 'afternoon',
        groupId: t.group,
        priority: t.priority,
        triggerReason: rule.trigger,
      },
      activeMoodIdx: MOOD_TO_IDX[rule.mood],
      activePeriodIdx: PERIOD_TO_IDX.afternoon,
    })
  },
}))
