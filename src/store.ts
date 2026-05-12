import { create } from 'zustand'
import { db } from '@/db'
import type { Todo, GroupId, ToastPayload, MoodId, PeriodId, Portrait, PortraitKind } from '@/types'
import { pickMood } from '@/lib/rules'
import { MOODS, PERIODS, periodFromHour } from '@/lib/constants'
import { showSystemNotification } from '@/lib/notifications'
import { generatePortraitMock, deletePortrait as dbDeletePortrait } from '@/lib/studio'

type Filter = GroupId | 'all'
type ModalKind = 'none' | 'add-todo' | 'confirm-generate'

export interface ConfirmPayload {
  moodId: MoodId
  periodId: PeriodId
  kind: PortraitKind
  estCost: number
  onConfirm: () => void
}

interface AppState {
  // 数据
  todos: Todo[]
  petName: string
  portraits: Portrait[]

  // UI
  activeMoodIdx: number
  activePeriodIdx: number
  filter: Filter
  modal: ModalKind
  drawerOpen: boolean
  studioOpen: boolean
  sheetOpen: boolean
  toast: ToastPayload | null
  confirmPayload: ConfirmPayload | null
  notifPermission: NotificationPermission | 'unsupported'

  // Actions
  loadFromDB: () => Promise<void>
  addTodo: (t: Omit<Todo, 'id' | 'createdAt'>) => Promise<void>
  toggleTodo: (id: number) => Promise<void>
  completeTodo: (id: number) => Promise<void>
  snoozeTodo: (id: number, minutes: number) => Promise<void>
  fireTodo: (todo: Todo) => Promise<void>
  setFilter: (f: Filter) => void
  setMood: (moodIdx: number, periodIdx?: number) => void
  cycleMood: () => void
  setPetName: (name: string) => Promise<void>
  openModal: (m: ModalKind) => void
  toggleDrawer: (v?: boolean) => void
  toggleStudio: (v?: boolean) => void
  toggleSheet: (v?: boolean) => void
  showToast: (t: ToastPayload) => void
  closeToast: () => void
  triggerDemoReminder: () => void
  requestConfirm: (p: ConfirmPayload) => void
  clearConfirm: () => void
  generatePortrait: (moodId: MoodId, periodId: PeriodId, kind: PortraitKind) => Promise<void>
  removePortrait: (moodId: MoodId, periodId: PeriodId) => Promise<void>
  setNotifPermission: (p: NotificationPermission | 'unsupported') => void
}

const MOOD_IDX: Record<MoodId, number> = { happy: 0, hello: 1, sleepy: 2, cute: 3, cheer: 4, angry: 5 }
const PERIOD_IDX: Record<PeriodId, number> = { morning: 0, noon: 1, afternoon: 2, night: 3, festival: 4 }

export const useAppStore = create<AppState>((set, get) => ({
  todos: [],
  petName: '波波',
  portraits: [],
  activeMoodIdx: 1,
  activePeriodIdx: periodFromHour(new Date().getHours()),
  filter: 'all',
  modal: 'none',
  drawerOpen: false,
  studioOpen: false,
  sheetOpen: false,
  toast: null,
  confirmPayload: null,
  notifPermission: 'default' as NotificationPermission,

  async loadFromDB() {
    const [todos, pet, portraits] = await Promise.all([
      db.todos.toArray(),
      db.pet.get(1),
      db.portraits.toArray(),
    ])
    set({ todos, petName: pet?.name ?? '波波', portraits })
  },

  async addTodo(t) {
    const id = await db.todos.add({ ...t, createdAt: Date.now() } as Todo)
    const full = await db.todos.get(id)
    if (full) set((s) => ({ todos: [...s.todos, full], activeMoodIdx: MOOD_IDX.hello }))
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
      activeMoodIdx: MOOD_IDX.happy,
    }))
  },

  async snoozeTodo(id, minutes) {
    const until = Date.now() + minutes * 60_000
    await db.todos.update(id, { snoozeUntil: until })
    set((s) => ({
      todos: s.todos.map((x) => (x.id === id ? { ...x, snoozeUntil: until } : x)),
    }))
  },

  async fireTodo(todo) {
    const now = Date.now()
    await db.todos.update(todo.id, { lastFiredAt: now })
    set((s) => ({ todos: s.todos.map((x) => (x.id === todo.id ? { ...x, lastFiredAt: now } : x)) }))

    const rule = pickMood({ todo, now: new Date(), event: 'fire' })
    const { petName } = get()
    const payload: ToastPayload = {
      todoId: todo.id,
      todoTitle: todo.title,
      moodId: rule.mood,
      periodId: PERIODS[periodFromHour(new Date().getHours())].id,
      groupId: todo.group,
      priority: todo.priority,
      triggerReason: rule.trigger,
    }
    set({
      toast: payload,
      activeMoodIdx: MOOD_IDX[rule.mood],
      activePeriodIdx: PERIOD_IDX[payload.periodId],
    })
    const m = MOODS.find((x) => x.id === rule.mood)!
    showSystemNotification({
      title: `${m.emoji} ${petName} · ${todo.title}`,
      body: m.msg(petName),
      tag: `todo-${todo.id}`,
    })
  },

  setFilter(f)  { set({ filter: f }) },
  setMood(moodIdx, periodIdx) { set({ activeMoodIdx: moodIdx, ...(periodIdx !== undefined ? { activePeriodIdx: periodIdx } : {}) }) },
  cycleMood()   { set((s) => ({ activeMoodIdx: (s.activeMoodIdx + 1) % 6 })) },

  async setPetName(name) {
    await db.pet.update(1, { name })
    set({ petName: name })
  },

  openModal(m) { set({ modal: m }) },
  toggleDrawer(v) { set((s) => ({ drawerOpen: v ?? !s.drawerOpen })) },
  toggleStudio(v) { set((s) => ({ studioOpen: v ?? !s.studioOpen })) },
  toggleSheet(v)  { set((s) => ({ sheetOpen:  v ?? !s.sheetOpen  })) },

  showToast(t) { set({ toast: t, activeMoodIdx: MOOD_IDX[t.moodId] }) },
  closeToast() { set({ toast: null }) },

  triggerDemoReminder() {
    const { todos } = get()
    const active = todos.filter((t) => t.enabled && !t.done)
    const t = active[Math.floor(Math.random() * active.length)] ?? todos[0]
    if (t) get().fireTodo(t)
  },

  requestConfirm(p) { set({ confirmPayload: p }) },
  clearConfirm()    { set({ confirmPayload: null }) },

  async generatePortrait(moodId, periodId, kind) {
    const moodIdx = MOOD_IDX[moodId], periodIdx = PERIOD_IDX[periodId]
    const pushState = (p: Portrait) => {
      set((s) => {
        const next = s.portraits.filter((x) => !(x.moodId === moodId && x.periodId === periodId))
        return { portraits: [...next, p] }
      })
    }
    await generatePortraitMock({ moodId, periodId, kind }, pushState, moodIdx, periodIdx)
  },

  async removePortrait(moodId, periodId) {
    await dbDeletePortrait(moodId, periodId)
    set((s) => ({
      portraits: s.portraits.filter((p) => !(p.moodId === moodId && p.periodId === periodId)),
    }))
  },

  setNotifPermission(p) { set({ notifPermission: p }) },
}))
