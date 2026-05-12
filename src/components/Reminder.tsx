import { useAppStore } from '@/store'
import { MOODS, PERIODS, GROUP_META, imgForMoodPeriod } from '@/lib/constants'

/**
 * 提醒组件——宠物大图 + 消息卡 两段式
 * 上：320×320 宠物大图（entrance bounce + breathing + LIVE badge + 气泡）
 * 下：紧凑消息卡（title + body + meta + 操作按钮）
 */
export function Reminder() {
  const { toast, petName, activePeriodIdx, closeToast, completeTodo } = useAppStore()
  const m = toast ? MOODS.find((x) => x.id === toast.moodId)! : MOODS[1]
  const p = toast ? PERIODS.find((x) => x.id === toast.periodId) ?? PERIODS[activePeriodIdx] : PERIODS[activePeriodIdx]
  const mIdx = MOODS.findIndex((x) => x.id === m.id)
  const pIdx = PERIODS.findIndex((x) => x.id === p.id)
  const src = imgForMoodPeriod(mIdx, pIdx)

  const show = !!toast

  const handleDone = () => {
    if (toast?.todoId) completeTodo(toast.todoId)
    closeToast()
  }
  const handleLater = () => closeToast()
  const handleClose = () => closeToast()

  return (
    <div className={`reminder-wrap ${show ? 'show' : ''}`}>
      <div className="rem-pet">
        <img src={src} alt={petName} />
        <div className="rem-badge">
          <span className="dot" />
          LIVE · {petName}
        </div>
        <div className="rem-speech">{m.msg(petName)}</div>
      </div>

      <div className="rem-card">
        <div className="rem-card-body">
          <div className="rem-title">{m.emoji} {m.cn} · {toast ? GROUP_META[toast.groupId].cn : ''}类提醒</div>
          <div className="rem-body">{toast?.todoTitle ?? '该喝水啦～'}</div>
          <div className="rem-meta">触发：{toast?.triggerReason ?? '到点提醒'} → {m.cn}</div>
        </div>
        <div className="rem-actions">
          <button className="btn-coral" style={{ flex: 1 }} onClick={handleDone}>✓ 完成</button>
          <button className="btn-soft" onClick={handleLater}>+10 分</button>
          <button className="btn-soft" onClick={handleClose}>关</button>
        </div>
      </div>
    </div>
  )
}
