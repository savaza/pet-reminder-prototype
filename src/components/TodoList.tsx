import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { MOODS, GROUP_META, REPEAT_META, imgForMoodPeriod } from '@/lib/constants'
import type { GroupId, Todo } from '@/types'

const FILTERS: { id: GroupId | 'all'; label: string }[] = [
  { id: 'all',    label: '全部' },
  { id: 'work',   label: '💼 工作' },
  { id: 'life',   label: '🏠 生活' },
  { id: 'health', label: '💚 健康' },
]

export function TodoList() {
  const { todos, filter, setFilter, toggleTodo, completeTodo, activePeriodIdx } = useAppStore()

  const filtered = useMemo(() => {
    const list = filter === 'all' ? todos : todos.filter((t) => t.group === filter)
    return list.slice().sort((a, b) => a.time.localeCompare(b.time))
  }, [todos, filter])

  return (
    <>
      <div className="section-header">
        <div>
          <span className="section-title">今天</span>
          <span className="section-sub">2026 年 5 月 12 日 · 星期二</span>
        </div>
      </div>
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="todo-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-3)' }}>
            这个分组还没有待办 ✨
          </div>
        ) : (
          filtered.map((t) => (
            <TodoRow key={t.id} t={t} periodIdx={activePeriodIdx} onToggle={() => toggleTodo(t.id)} onComplete={() => completeTodo(t.id)} />
          ))
        )}
      </div>
    </>
  )
}

function TodoRow({
  t, periodIdx, onToggle, onComplete,
}: { t: Todo; periodIdx: number; onToggle: () => void; onComplete: () => void }) {
  const moodId = t.done ? 'happy' : t.group === 'health' ? 'cute' : t.priority === 'p0' ? 'cheer' : 'hello'
  const mIdx = MOODS.findIndex((m) => m.id === moodId)
  const img = imgForMoodPeriod(mIdx, periodIdx)
  const [h, m] = t.time.split(':')
  const gm = GROUP_META[t.group]

  return (
    <div className="todo" style={{ opacity: t.enabled ? 1 : 0.55 }} onClick={(e) => { if ((e.target as HTMLElement).closest('.toggle')) return; onComplete() }}>
      <div className="todo-time">
        <div className="h">{h}</div>
        <div className="m">{m}</div>
      </div>
      <div className="todo-pet"><img src={img} alt="" /></div>
      <div className="todo-main">
        <div className="todo-title" style={t.done ? { textDecoration: 'line-through', color: '#94A3B8' } : undefined}>{t.title}</div>
        <div className="todo-meta">
          <span className={`mini-tag ${gm.cls}`}>{gm.cn}</span>
          <span className={`mini-tag mt-${t.priority}`}>{t.priority.toUpperCase()}</span>
          <span className="mt-repeat">· {REPEAT_META[t.repeat]}</span>
        </div>
      </div>
      <div className={`toggle ${t.enabled ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle() }}>
        <div className="knob" />
      </div>
    </div>
  )
}
