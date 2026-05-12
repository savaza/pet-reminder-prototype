import { useAppStore } from '@/store'
import { MOODS, PERIODS, GROUP_META, VIDEO_POOL, imgForMoodPeriod } from '@/lib/constants'

/**
 * 提醒组件——宠物大图 + 消息卡 两段式
 * - 顶部 rem-pet：320×320 宠物化身（Veo 视频优先，回退静态图 + CSS 呼吸）
 * - 底部 rem-card：紧凑消息卡（任务标题 + 触发原因 + 操作按钮）
 */
export function Reminder() {
  const { toast, petName, activePeriodIdx, closeToast, completeTodo, snoozeTodo } = useAppStore()
  const m = toast ? MOODS.find((x) => x.id === toast.moodId)! : MOODS[1]
  const p = toast ? PERIODS.find((x) => x.id === toast.periodId) ?? PERIODS[activePeriodIdx] : PERIODS[activePeriodIdx]
  const mIdx = MOODS.findIndex((x) => x.id === m.id)
  const pIdx = PERIODS.findIndex((x) => x.id === p.id)
  const imgSrc = imgForMoodPeriod(mIdx, pIdx)
  const videoSrc = VIDEO_POOL[m.id]

  const show = !!toast

  const handleDone = () => {
    if (toast?.todoId) completeTodo(toast.todoId)
    closeToast()
  }
  const handleSnooze = () => {
    if (toast?.todoId) snoozeTodo(toast.todoId, 10)
    closeToast()
  }

  return (
    <div className={`reminder-wrap ${show ? 'show' : ''}`}>
      <div className="rem-pet">
        {videoSrc ? (
          // 每次 toast 换了 todoId 就 remount，视频从头播放
          <video
            key={`${toast?.todoId ?? 'live'}-${m.id}`}
            src={videoSrc}
            className="rem-media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={imgSrc} alt={petName} className="rem-media rem-media-static" />
        )}
        <div className="rem-badge">
          <span className="dot" />
          LIVE · {petName}
        </div>
        <div className="rem-speech">{m.msg(petName)}</div>
      </div>

      <div className="rem-card">
        <div className="rem-card-body">
          <div className="rem-title">
            {m.emoji} {m.cn} · {toast ? GROUP_META[toast.groupId].cn : ''}类提醒
          </div>
          <div className="rem-body">{toast?.todoTitle ?? '该喝水啦～'}</div>
          <div className="rem-meta">
            触发：{toast?.triggerReason ?? '到点提醒'} → {m.cn}
            {videoSrc ? <span style={{ marginLeft: 6, color: 'var(--coral)' }}>· 🎬 Veo 动态</span> : null}
          </div>
        </div>
        <div className="rem-actions">
          <button className="btn-coral" style={{ flex: 1 }} onClick={handleDone}>✓ 完成</button>
          <button className="btn-soft" onClick={handleSnooze}>+10 分</button>
          <button className="btn-soft" onClick={closeToast}>关</button>
        </div>
      </div>
    </div>
  )
}
