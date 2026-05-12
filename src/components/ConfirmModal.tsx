import { useAppStore } from '@/store'
import { MOODS, PERIODS } from '@/lib/constants'

/** 生成前费用确认 Modal */
export function ConfirmModal() {
  const { confirmPayload, clearConfirm } = useAppStore()
  if (!confirmPayload) return null
  const { moodId, periodId, kind, estCost, onConfirm } = confirmPayload
  const m = MOODS.find((x) => x.id === moodId)!
  const p = PERIODS.find((x) => x.id === periodId)!

  const handleConfirm = () => { onConfirm(); clearConfirm() }

  return (
    <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) clearConfirm() }}>
      <div className="modal" style={{ width: 400 }}>
        <div className="modal-h">
          {kind === 'video' ? '🎬 生成视频？' : '📸 生成静态图？'}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          <div>情绪 × 场景：<b style={{ color: 'var(--ink)' }}>{m.emoji} {m.cn} · {p.cn}</b></div>
          <div>模型：<b style={{ color: 'var(--ink)' }}>{kind === 'video' ? 'Veo 2 · 5 秒 MP4' : 'Gemini 2.5 Flash Image'}</b></div>
          <div>预估花费：<b style={{ color: 'var(--coral)', fontSize: 16 }}>¥ {estCost.toFixed(2)}</b></div>
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', background: '#FEF3C7', borderRadius: 10, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
          🪹 当前是 <b>Mock 模式</b>，点确认不会真扣费——后面接通真 API 后这个 Modal 会变成真正的花钱确认。
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn-soft" onClick={clearConfirm}>取消</button>
          <button className="btn-coral" onClick={handleConfirm}>✓ 确认生成</button>
        </div>
      </div>
    </div>
  )
}
