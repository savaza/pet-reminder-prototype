import { useState } from 'react'
import { useAppStore } from '@/store'
import type { GroupId, PriorityId, RepeatId } from '@/types'

export function AddTodoModal() {
  const { modal, openModal, addTodo } = useAppStore()
  const [title, setTitle] = useState('')
  const [group, setGroup] = useState<GroupId>('work')
  const [priority, setPriority] = useState<PriorityId>('p1')
  const [time, setTime] = useState('09:00')
  const [repeat, setRepeat] = useState<RepeatId>('once')
  const [due, setDue] = useState('')

  const close = () => openModal('none')
  const submit = async () => {
    if (!title.trim()) { alert('请输入待办内容'); return }
    await addTodo({ title: title.trim(), group, priority, time, repeat, due: due || undefined, enabled: true, done: false })
    setTitle('')
    close()
  }

  return (
    <div className={`modal-bg ${modal === 'add-todo' ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-h">新建待办 ✍️</div>
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
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn-soft" onClick={close}>取消</button>
          <button className="btn-coral" onClick={submit}>保存</button>
        </div>
      </div>
    </div>
  )
}

export function SettingsDrawer() {
  const { drawerOpen, toggleDrawer, petName, setPetName } = useAppStore()

  return (
    <div className={`drawer ${drawerOpen ? 'show' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">设置</div>
        <button className="btn-soft" onClick={() => toggleDrawer(false)}>关闭</button>
      </div>
      <div className="field"><label>产品名</label><input defaultValue="FurryBuddy" /></div>
      <div className="field"><label>宠物名</label><input value={petName} onChange={(e) => setPetName(e.target.value || '宠物')} /></div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '-4px 0 14px' }}>候选产品名：FurryBuddy / 毛毛伴 / 宠伴 / Paws</div>
      <div className="field"><label>基底画风</label>
        <select>
          <option>📸 写实照片风（Gemini 2.5 Flash Image）</option>
          <option>🎨 日系二次元</option>
          <option>🎬 皮克斯 3D</option>
          <option>🖼 中国水墨</option>
        </select>
      </div>
      <div className="field"><label>Gemini API Key</label><input type="password" placeholder="AIza..." /></div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '-4px 0 14px' }}>Key 存后端环境变量，前端不暴露；每日上限 50 张生成</div>
      <div className="field"><label>访问密码</label><input type="password" placeholder="部署后访问需密码" /></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn-soft">⬇ 导出备份</button>
        <button className="btn-soft">⬆ 导入备份</button>
      </div>
      <div style={{ marginTop: 20, padding: 14, background: 'var(--surface-2)', borderRadius: 16, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
        <b>V1 原型说明</b><br />
        数据存本地 IndexedDB，关闭刷新都在；立绘用 Unsplash 占位，生产版由 Gemini 生成。情绪映射可视化编辑器在 V2 实现。
      </div>
    </div>
  )
}
