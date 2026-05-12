import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import type { GroupId, PriorityId, RepeatId } from '@/types'

export function AddTodoModal() {
  const { modal, openModal, addTodo, updateTodo, deleteTodo, openEditTodo, editingTodoId, todos } = useAppStore()
  const editing = editingTodoId != null ? todos.find((t) => t.id === editingTodoId) : undefined
  const isEditing = !!editing

  const [title, setTitle] = useState('')
  const [group, setGroup] = useState<GroupId>('work')
  const [priority, setPriority] = useState<PriorityId>('p1')
  const [time, setTime] = useState('09:00')
  const [repeat, setRepeat] = useState<RepeatId>('once')
  const [due, setDue] = useState('')

  useEffect(() => {
    if (editing) {
      setTitle(editing.title); setGroup(editing.group); setPriority(editing.priority)
      setTime(editing.time); setRepeat(editing.repeat); setDue(editing.due ?? '')
    } else if (modal === 'add-todo') {
      setTitle(''); setGroup('work'); setPriority('p1'); setTime('09:00'); setRepeat('once'); setDue('')
    }
  }, [editingTodoId, modal, editing])

  const close = () => { openModal('none'); openEditTodo(null) }
  const submit = async () => {
    if (!title.trim()) { alert('请输入待办内容'); return }
    const patch = { title: title.trim(), group, priority, time, repeat, due: due || undefined }
    if (isEditing && editing) await updateTodo(editing.id, patch)
    else                       await addTodo({ ...patch, enabled: true, done: false })
    close()
  }
  const handleDelete = async () => {
    if (!editing) return
    if (!confirm(`确定删除「${editing.title}」？不可撤销。`)) return
    await deleteTodo(editing.id)
    close()
  }

  return (
    <div className={`modal-bg ${modal === 'add-todo' ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-h">{isEditing ? '编辑待办 ✏️' : '新建待办 ✍️'}</div>
        <div className="field"><label>内容</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：该喝水啦" /></div>
        <div className="grid-2">
          <div className="field"><label>分组</label>
            <select value={group} onChange={(e) => setGroup(e.target.value as GroupId)}>
              <option value="work">💼 工作</option><option value="life">🏠 生活</option><option value="health">💚 健康</option>
            </select>
          </div>
          <div className="field"><label>优先级</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as PriorityId)}>
              <option value="p0">🔴 P0 紧急</option><option value="p1">🟡 P1 重要</option><option value="p2">⚪ P2 一般</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label>提醒时间</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <div className="field"><label>重复</label>
            <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatId)}>
              <option value="once">仅一次</option><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option>
            </select>
          </div>
        </div>
        <div className="field"><label>截止日（可选）</label><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          {isEditing && (
            <button className="btn-soft" style={{ color: '#DC2626', borderColor: '#FCA5A5' }} onClick={handleDelete}>🗑 删除</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn-soft" onClick={close}>取消</button>
          <button className="btn-coral" onClick={submit}>{isEditing ? '保存修改' : '创建'}</button>
        </div>
      </div>
    </div>
  )
}

export function SettingsDrawer() {
  const { drawerOpen, toggleDrawer, petName, setPetName, toggleStudio, notifPermission } = useAppStore()

  return (
    <div className={`drawer ${drawerOpen ? 'show' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">设置</div>
        <button className="btn-soft" onClick={() => toggleDrawer(false)}>关闭</button>
      </div>

      {/* 🎨 Studio 入口 */}
      <button
        className="studio-entry"
        onClick={() => { toggleDrawer(false); setTimeout(() => toggleStudio(true), 150) }}
      >
        <div style={{ fontSize: 22 }}>🎨</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>宠物工作室</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>管理基准照 + 生成 30 张情绪立绘 / 视频</div>
        </div>
        <div style={{ fontSize: 18, color: 'var(--ink-3)' }}>›</div>
      </button>

      <div className="field"><label>产品名</label><input defaultValue="FurryBuddy" /></div>
      <div className="field"><label>宠物名</label>
        <input
          value={petName}
          placeholder="给宠物起个名字"
          onChange={(e) => setPetName(e.target.value)}
          onBlur={(e) => { if (!e.target.value.trim()) setPetName('宠物') }}
        />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '-4px 0 14px' }}>候选产品名：FurryBuddy / 毛毛伴 / 宠伴 / Paws</div>

      <div className="field"><label>Gemini API Key</label><input type="password" placeholder="AIza..." /></div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '-4px 0 14px' }}>Key 存后端环境变量，前端不暴露；每日上限 50 张生成</div>
      <div className="field"><label>访问密码</label><input type="password" placeholder="部署后访问需密码" /></div>

      <div className="field">
        <label>系统通知</label>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>
          当前状态：<b style={{ color: notifPermission === 'granted' ? 'var(--emerald)' : notifPermission === 'denied' ? '#DC2626' : 'var(--ink-3)' }}>
            {notifPermission === 'granted' ? '已授权 ✓' : notifPermission === 'denied' ? '已拒绝 ✗' : notifPermission === 'unsupported' ? '浏览器不支持' : '未授权'}
          </b>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn-soft">⬇ 导出备份</button>
        <button className="btn-soft">⬆ 导入备份</button>
      </div>

      <div style={{ marginTop: 20, padding: 14, background: 'var(--surface-2)', borderRadius: 16, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
        <b>V1 原型说明</b><br />
        数据存本地 IndexedDB，关闭刷新都在。提醒调度已接入 Web Notification API。Studio 当前是 Mock 模式，不实际调用 AI。
      </div>
    </div>
  )
}
