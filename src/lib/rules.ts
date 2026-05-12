import type { Todo, MoodId } from '@/types'

export interface MappingRule {
  id: string
  trigger: string
  mood: MoodId
  match: (ctx: RuleContext) => boolean
  priority: number // 越大越优先
}

export interface RuleContext {
  todo: Todo
  now: Date
  event: 'created' | 'fire' | 'done' | 'overdue'
}

export const DEFAULT_RULES: MappingRule[] = [
  { id: 'on-created', trigger: '任务创建', mood: 'hello',  priority: 5, match: (c) => c.event === 'created' },
  { id: 'on-done',    trigger: '任务完成', mood: 'happy',  priority: 9, match: (c) => c.event === 'done' },
  { id: 'on-overdue', trigger: '任务逾期', mood: 'angry',  priority: 8, match: (c) => c.event === 'overdue' },
  { id: 'health',     trigger: '健康类任务', mood: 'cute', priority: 6, match: (c) => c.event === 'fire' && c.todo.group === 'health' },
  { id: 'p0-fire',    trigger: 'P0 紧急到点', mood: 'cheer', priority: 7, match: (c) => c.event === 'fire' && c.todo.priority === 'p0' },
  { id: 'night',      trigger: '深夜时段',     mood: 'sleepy', priority: 3, match: (c) => c.event === 'fire' && c.now.getHours() >= 22 },
  { id: 'default',    trigger: '到点提醒',     mood: 'hello', priority: 1, match: (c) => c.event === 'fire' },
]

export function pickMood(ctx: RuleContext, rules: MappingRule[] = DEFAULT_RULES): MappingRule {
  const matched = rules.filter((r) => r.match(ctx)).sort((a, b) => b.priority - a.priority)
  return matched[0] ?? rules[rules.length - 1]
}
