import { useMemo, useState, useRef } from 'react'
import { useAppStore } from '@/store'
import { MOODS, PERIODS } from '@/lib/constants'
import type { MoodId, PeriodId, Portrait } from '@/types'
import { COST_IMAGE, COST_VIDEO } from '@/types'
import { IMEInput } from './IMEInput'

const STYLE_LABEL: Record<string, string> = {
  realistic: '📸 写实照片风（Gemini Flash Image / Veo 2）',
  anime: '🎨 日系二次元',
  pixar: '🎬 皮克斯 3D',
  ink: '🖼 中国水墨',
}

/**
 * 宠物工作室（Studio）
 * - 独立 Drawer，从右滑入（720px）
 * - 上传基准照、画风设置
 * - 30 格素材网格（6 情绪 × 5 变体），每格独立生成静态/视频
 * - 每次生成前弹确认
 * - 当前为 Mock 模式（不花钱）
 */
export function Studio() {
  const {
    studioOpen, toggleStudio, portraits, petName, setPetName,
    petPhotoUrl, petPhotoInfo, petBaseStyle, uploadPetPhoto, setBaseStyle,
    generatePortrait, removePortrait, requestConfirm,
  } = useAppStore()
  const [selectedCell, setSelectedCell] = useState<{ mi: number; pi: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => fileInputRef.current?.click()
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) await uploadPetPhoto(f)
    e.target.value = '' // 允许再次选择同名文件
  }

  const todaySpent = useMemo(() => {
    const now = new Date()
    return portraits
      .filter((p) => p.generatedAt && new Date(p.generatedAt).toDateString() === now.toDateString())
      .reduce((s, p) => s + (p.cost ?? 0), 0)
  }, [portraits])

  const totalSpent = portraits.reduce((s, p) => s + (p.cost ?? 0), 0)
  const generatedCount = portraits.filter((p) => p.status === 'ready').length

  const findPortrait = (mi: number, pi: number): Portrait | undefined =>
    portraits.find((p) => p.moodId === MOODS[mi].id && p.periodId === PERIODS[pi].id)

  const handleGenerate = (moodId: MoodId, periodId: PeriodId, kind: 'image' | 'video') => {
    const estCost = kind === 'video' ? COST_VIDEO : COST_IMAGE
    requestConfirm({
      moodId, periodId, kind, estCost,
      onConfirm: () => {
        setSelectedCell(null)
        generatePortrait(moodId, periodId, kind)
      },
    })
  }

  return (
    <div className={`studio-drawer ${studioOpen ? 'show' : ''}`}>
      <div className="studio-head">
        <div>
          <div className="section-title">🎨 宠物工作室</div>
          <div className="studio-sub">
            管理 {petName} 的基准照 + 生成 30 张情绪立绘 / 视频
          </div>
        </div>
        <button className="btn-soft" onClick={() => toggleStudio(false)}>关闭</button>
      </div>

      {/* 宠物基准照 */}
      <section className="studio-section">
        <div className="studio-h">📷 基准照片</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="pet-base-row">
          <div
            className={`pet-base-thumb ${petPhotoUrl ? 'has-photo' : 'empty'}`}
            onClick={handleUploadClick}
            title={petPhotoUrl ? '点击更换' : '点击上传'}
          >
            {petPhotoUrl ? (
              <img src={petPhotoUrl} alt="基准照" />
            ) : (
              <div className="thumb-empty-prompt">
                <div style={{ fontSize: 20 }}>📷</div>
                <div>点击上传</div>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {petPhotoInfo ? (
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {petPhotoInfo.name} · {(petPhotoInfo.size / 1024).toFixed(0)} KB
              </div>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>尚未上传基准照</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.55 }}>
              用于 AI 生成时保持宠物面部特征一致性<br />
              支持 JPG / PNG / WEBP，≤ 8MB · 点缩略图即可 {petPhotoUrl ? '更换' : '上传'}
            </div>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>宠物名</label>
          <IMEInput
            value={petName}
            placeholder="给宠物起个名字"
            onChange={(e) => setPetName(e.target.value)}
            onBlur={(e) => { if (!e.target.value.trim()) setPetName('宠物') }}
          />
        </div>
        <div className="field">
          <label>基底画风</label>
          <select
            value={petBaseStyle}
            onChange={(e) => setBaseStyle(e.target.value as 'realistic' | 'anime' | 'pixar' | 'ink')}
          >
            {Object.entries(STYLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </section>

      {/* 素材池 */}
      <section className="studio-section">
        <div className="studio-h">
          🖼 素材池 <span className="studio-count">{generatedCount} / 30 已生成</span>
        </div>
        <div className="studio-grid">
          {MOODS.flatMap((m, mi) =>
            PERIODS.map((p, pi) => {
              const cell = findPortrait(mi, pi)
              return (
                <div
                  key={`${mi}-${pi}`}
                  className={`studio-cell status-${cell?.status ?? 'none'}`}
                  onClick={() => setSelectedCell({ mi, pi })}
                >
                  {cell?.status === 'ready' && cell.mockUrl && (
                    cell.kind === 'video'
                      ? <video src={cell.mockUrl} muted loop playsInline autoPlay className="studio-thumb" />
                      : <img src={cell.mockUrl} alt="" className="studio-thumb" />
                  )}
                  {cell?.status === 'generating' && <div className="studio-loading">⏳</div>}
                  {!cell && <div className="studio-empty">＋</div>}
                  <div className="studio-cap">
                    {m.emoji}·{p.cn}
                    {cell?.status === 'ready' && (cell.kind === 'video' ? ' 🎬' : ' 📸')}
                  </div>
                </div>
              )
            }),
          )}
        </div>
      </section>

      {/* 费用面板 */}
      <section className="studio-spend">
        <div className="spend-row">
          <span>今日花费</span><b>¥ {todaySpent.toFixed(2)}</b>
        </div>
        <div className="spend-row">
          <span>累计花费</span><b>¥ {totalSpent.toFixed(2)}</b>
        </div>
        <div className="spend-row muted">
          <span>Mock 模式 · 不实际扣费</span>
        </div>
      </section>

      {/* 单格操作 Popover */}
      {selectedCell && (
        <CellActions
          mi={selectedCell.mi}
          pi={selectedCell.pi}
          portrait={findPortrait(selectedCell.mi, selectedCell.pi)}
          onClose={() => setSelectedCell(null)}
          onGenerate={(kind) => handleGenerate(MOODS[selectedCell.mi].id, PERIODS[selectedCell.pi].id, kind)}
          onDelete={() => {
            removePortrait(MOODS[selectedCell.mi].id, PERIODS[selectedCell.pi].id)
            setSelectedCell(null)
          }}
        />
      )}
    </div>
  )
}

function CellActions({
  mi, pi, portrait, onClose, onGenerate, onDelete,
}: {
  mi: number; pi: number; portrait?: Portrait
  onClose: () => void
  onGenerate: (kind: 'image' | 'video') => void
  onDelete: () => void
}) {
  const m = MOODS[mi], p = PERIODS[pi]
  const ready = portrait?.status === 'ready'

  return (
    <>
      <div className="cell-backdrop" onClick={onClose} />
      <div className="cell-actions">
        <div className="cell-actions-h">
          <b>{m.emoji} {m.cn} · {p.cn}</b>
          <button className="btn-soft" style={{ padding: '2px 8px', fontSize: 11 }} onClick={onClose}>×</button>
        </div>

        {ready ? (
          <>
            <div className="cell-preview">
              {portrait.kind === 'video'
                ? <video src={portrait.mockUrl} muted loop autoPlay playsInline />
                : <img src={portrait.mockUrl} alt="" />}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
              {portrait.kind === 'video' ? '🎬 Veo 视频' : '📸 静态图'} · 花费 ¥{portrait.cost?.toFixed(2)} · {portrait.generatedAt ? new Date(portrait.generatedAt).toLocaleString() : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button className="btn-soft" onClick={() => onGenerate(portrait.kind)}>🔄 重新生成</button>
              <button className="btn-soft" style={{ color: '#DC2626' }} onClick={onDelete}>🗑 删除</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>选择生成类型：</div>
            <button className="btn-soft" style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }}
                    onClick={() => onGenerate('image')}>
              <span>📸 静态图（Gemini Flash Image）</span>
              <span style={{ color: 'var(--ink-3)' }}>¥ {COST_IMAGE.toFixed(2)}</span>
            </button>
            <button className="btn-coral" style={{ width: '100%', marginTop: 6, justifyContent: 'space-between', display: 'flex' }}
                    onClick={() => onGenerate('video')}>
              <span>🎬 视频（Veo 2 · 5 秒）</span>
              <span>¥ {COST_VIDEO.toFixed(2)}</span>
            </button>
          </>
        )}
      </div>
    </>
  )
}
