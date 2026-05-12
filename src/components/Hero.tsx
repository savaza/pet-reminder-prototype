import { useAppStore } from '@/store'
import { MOODS, PERIODS, imgForMoodPeriod } from '@/lib/constants'

export function Hero() {
  const { petName, activeMoodIdx, activePeriodIdx, cycleMood, toggleSheet } = useAppStore()
  const m = MOODS[activeMoodIdx]
  const p = PERIODS[activePeriodIdx]
  const src = imgForMoodPeriod(activeMoodIdx, activePeriodIdx)

  return (
    <div className="hero">
      <div className="portrait-wrap">
        <div className="portrait-aura" />
        <div className="portrait-ring">
          <img src={src} alt={petName} />
        </div>
        <div className="portrait-badge">
          <span>{m.emoji}</span>
          <span>{m.cn}</span>
        </div>
      </div>
      <div className="hero-info">
        <div className="pet-name-row">
          <div className="pet-name">{petName}</div>
          <div className="mood-pill">
            <span>{p.emoji}</span>
            <span>{p.cn}</span>
          </div>
        </div>
        <div className="pet-msg">{m.msg(petName)}</div>
        <div className="hero-actions">
          <button className="btn-coral" onClick={() => toggleSheet(true)}>🎭 全部立绘 · 30</button>
          <button className="btn-soft" onClick={cycleMood}>↻ 换个表情</button>
          <button className="btn-soft">✨ 重新生成</button>
        </div>
      </div>
    </div>
  )
}
