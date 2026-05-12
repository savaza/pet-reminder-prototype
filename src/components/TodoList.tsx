import { useMemo, useState, useEffect } from 'react'
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
  const {
    todos, filter, setFilter, toggleTodo, completeTodo, uncompleteTodo, deleteTodo,
    activePeriodIdx, openEditTodo,
  } = useAppStore()
  const [menuForId, setMenuForId] = useState<number | null>(null)

  // 点外面关菜单
  useEffect(() => {
    const close = () => setMenuForId(null)
    if (menuForId != null) {
      document.addEventListener('click', close)
      return () => document.removeEventListener('click', close)
    }
  }, [menuForId])

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
            <TodoRow
              key={t.id}
              t={t}
              periodIdx={activePeriodIdx}
              menuOpen={menuForId === t.id}
              onOpenMenu={(e) => { e.stopPropagation(); setMenuForId(menuForId === t.id ? null : t.id) }}
              onEdit={() => { setMenuForId(null); openEditTodo(t.id) }}
              onToggle={() => toggleTodo(t.id)}
              onComplete={() => { setMenuForId(null); t.done ? uncompleteTodo(t.id) : completeTodo(t.id) }}
              onDelete={async () => {
                setMenuForId(null)
                if (confirm(`确定删除「${t.title}」？不可撤销。`)) await deleteTodo(t.id)
              }}
            />
          ))
        )}
      </div>
    </>
  )
}

interface RowProps {
  t: Todo; periodIdx: number; menuOpen: boolean
  onOpenMenu: (e: React.MouseEvent) => void
  onEdit: () => void
  onToggle: () => void
  onComplete: () => void
  onDelete: () => void
}

function TodoRow({ t, periodIdx, menuOpen, onOpenMenu, onEdit, onToggle, onComplete, onDelete }: RowProps) {
  const moodId = t.done ? 'happy' : t.group === 'health' ? 'cute' : t.priority === 'p0' ? 'cheer' : 'hello'
  const mIdx = MOODS.findIndex((m) => m.id === moodId)
  const img = imgForMoodPeriod(mIdx, periodIdx)
  const [h, m] = t.time.split(':')
  const gm = GROUP_META[t.group]

  const handleCardClick = (e: React.MouseEvent) => {
    // 避免点到 toggle / kebab / menu 时触发编辑
    const target = e.target as HTMLElement
    if (target.closest('.toggle') || target.closest('.kebab') || target.closest('.row-menu')) return
    onEdit()
  }

  return (
    <div className="todo" style={{ opacity: t.enabled ? 1 : 0.55, position: 'relative' }} onClick={handleCardClick}>
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
          {t.done && <span className="mini-tag" style={{ background: '#D1FAE5', color: '#047857' }}>✓ 已完成</span>}
          {t.snoozeUntil && t.snoozeUntil > Date.now() && (
            <span className="mini-tag" style={{ background: '#FEF3C7', color: '#92400E' }}>⏸ 暂缓中</span>
          )}
        </div>
      </div>
      <button
        className="kebab"
        title="更多"
        onClick={onOpenMenu}
        aria-label="更多操作"
      >⋯</button>
      <div className={`toggle ${t.enabled ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle() }}>
        <div className="knob" />
      </div>

      {menuOpen && (
        <div className="row-menu" onClick={(e) => e.stopPropagation()}>
          <div className="row-menu-item" onClick={onEdit}>✏️ 编辑</div>
          <div className="row-menu-item" onClick={onComplete}>
            {t.done ? '↩️ 重新激活' : '✓ 标记完成'}
          </div>
          <div className="row-menu-item row-menu-danger" onClick={onDelete}>🗑 删除</div>
        </div>
      )}
    </div>
  )
}
