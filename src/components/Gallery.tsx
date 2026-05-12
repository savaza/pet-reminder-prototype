import { useAppStore } from '@/store'
import { MOODS, PERIODS, imgForMoodPeriod } from '@/lib/constants'

export function Gallery() {
  const { sheetOpen, toggleSheet, activeMoodIdx, activePeriodIdx, setMood } = useAppStore()

  return (
    <>
      <div className={`sheet-backdrop ${sheetOpen ? 'show' : ''}`} onClick={() => toggleSheet(false)} />
      <div className={`sheet ${sheetOpen ? 'show' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="section-header" style={{ marginBottom: 8 }}>
            <div>
              <span className="section-title">立绘池</span>
              <span className="section-sub">6 情绪 × 5 变体 = 30 张（含节日皮肤）</span>
            </div>
            <button className="btn-coral" onClick={() => toggleSheet(false)}>完成</button>
          </div>
          <div className="gallery-grid">
            {MOODS.flatMap((m, mi) =>
              PERIODS.map((p, pi) => {
                const active = mi === activeMoodIdx && pi === activePeriodIdx
                return (
                  <div
                    key={`${mi}-${pi}`}
                    className={`g-cell ${active ? 'active' : ''}`}
                    title={`${m.cn}·${p.cn}`}
                    onClick={() => setMood(mi, pi)}
                  >
                    <img src={imgForMoodPeriod(mi, pi)} alt="" />
                    {p.id === 'festival' && <div className="g-festival">🎉</div>}
                    <div className="g-cap">{m.emoji} {m.cn} · {p.cn}</div>
                  </div>
                )
              }),
            )}
          </div>
          <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 16, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            💡 生产版本由 Gemini 2.5 Flash Image 基于你上传的宠物照生成。首次生成约 ¥8，保留面部特征，变化情绪 / 姿态 / 时段光线 / 节日装扮。当前为占位图。
          </div>
        </div>
      </div>
    </>
  )
}
