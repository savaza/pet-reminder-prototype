/**
 * 提醒调度器
 * - setInterval 每 30 秒扫一遍 todos
 * - 命中"该触发的 slot 且本 slot 未曾触发过"则 fire
 * - 支持 once / daily / weekly / monthly
 * - snooze（暂缓）通过 todo.snoozeUntil 字段跳过
 */

import type { Todo } from '@/types'

const GRACE_MS = 5 * 60_000   // 允许 5 分钟内追补触发（防止 tab 切回时漏）
const TICK_MS = 30_000        // 30 秒扫一次

/** 推算本条待办"本轮应触发"的 slot 时间（epoch ms）；0 表示当前没有可触发 slot */
export function currentDueSlot(todo: Todo, now: Date = new Date()): number {
  const [h, m] = todo.time.split(':').map(Number)
  const today = new Date(now)
  today.setHours(h, m, 0, 0)

  switch (todo.repeat) {
    case 'once': {
      if (todo.due) {
        const [Y, M, D] = todo.due.split('-').map(Number)
        const slot = new Date(Y, M - 1, D, h, m, 0, 0).getTime()
        return slot <= now.getTime() ? slot : 0
      }
      return today.getTime() <= now.getTime() ? today.getTime() : 0
    }
    case 'daily': {
      return today.getTime() <= now.getTime()
        ? today.getTime()
        : today.getTime() - 86_400_000 // 昨日同时刻
    }
    case 'weekly': {
      const anchor = todo.due ? new Date(todo.due + 'T00:00:00') : new Date(todo.createdAt)
      const targetWeekday = anchor.getDay()
      const slot = new Date(today)
      const daysBack = (today.getDay() - targetWeekday + 7) % 7
      slot.setDate(slot.getDate() - daysBack)
      return slot.getTime() <= now.getTime() ? slot.getTime() : slot.getTime() - 7 * 86_400_000
    }
    case 'monthly': {
      const anchor = todo.due ? new Date(todo.due + 'T00:00:00') : new Date(todo.createdAt)
      const targetDay = anchor.getDate()
      const slot = new Date(today)
      slot.setDate(targetDay)
      if (slot.getTime() > now.getTime()) slot.setMonth(slot.getMonth() - 1)
      return slot.getTime()
    }
  }
}

export function shouldFire(todo: Todo, now: Date = new Date()): boolean {
  if (!todo.enabled) return false
  if (todo.done && todo.repeat === 'once') return false
  if (todo.snoozeUntil && now.getTime() < todo.snoozeUntil) return false
  const slot = currentDueSlot(todo, now)
  if (!slot) return false
  if (todo.lastFiredAt && todo.lastFiredAt >= slot) return false
  const elapsed = now.getTime() - slot
  return elapsed >= 0 && elapsed < GRACE_MS
}

type SchedulerHandle = { stop: () => void }

export function startScheduler(
  getTodos: () => Todo[],
  onFire: (todo: Todo) => void,
  tickMs: number = TICK_MS,
): SchedulerHandle {
  const tick = () => {
    const now = new Date()
    const due = getTodos().filter((t) => shouldFire(t, now))
    if (due.length > 0) onFire(due[0]) // 一次一个，避免同时叠多条
  }
  tick() // 立即扫一次，防止刚好错过窗口
  const id = window.setInterval(tick, tickMs)
  return { stop: () => clearInterval(id) }
}
