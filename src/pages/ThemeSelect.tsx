import { useState } from 'react'
import { Lock } from 'lucide-react'
import { hasPartner } from '../lib/couple'
import './ThemeSelect.css'

type ThemeOption = 'minimal' | 'couple'

interface Props {
  onConfirm: (theme: ThemeOption) => void
  onSkip: () => void
}

const THEME_STORAGE_KEY = 'us_ledger_theme'
const ONBOARDING_KEY = 'us_ledger_has_skipped_onboarding'

export default function ThemeSelect({ onConfirm, onSkip }: Props) {
  const [selected, setSelected] = useState<ThemeOption>('minimal')
  const [showSkipModal, setShowSkipModal] = useState(false)
  const isPartnerBound = hasPartner()

  const handleSkip = () => {
    setShowSkipModal(true)
  }

  const handleConfirmSkip = () => {
    setShowSkipModal(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'minimal')
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onSkip()
  }

  const handleConfirm = () => {
    if (selected) {
      localStorage.setItem(THEME_STORAGE_KEY, selected)
      localStorage.setItem(ONBOARDING_KEY, 'false')
      onConfirm(selected)
    }
  }

  const handleCoupleClick = () => {
    if (!isPartnerBound) {
      return // 点击无效果，锁图标提示
    }
    setSelected('couple')
  }

  return (
    <div className="theme-select">
      {/* 顶部 */}
      <header className="theme-header">
        <div></div>
        <button className="skip-btn" onClick={handleSkip}>跳过</button>
      </header>

      {/* 标题 */}
      <div className="theme-title">
        <h1>多样主题</h1>
        <p>可以选择你喜欢的主题哦~</p>
      </div>

      {/* 主题卡片 */}
      <div className="theme-cards">
        {/* 简约纯色 */}
        <div
          className={`theme-card ${selected === 'minimal' ? 'selected' : ''}`}
          onClick={() => setSelected('minimal')}
        >
          <div className="card-preview minimal-preview">
            <div className="preview-header">
              <div className="preview-tab active">本月</div>
              <div className="preview-tab">概览</div>
            </div>
            <div className="preview-amount">
              <span className="preview-label">支出</span>
              <span className="preview-num">¥3,280.50</span>
            </div>
            <div className="preview-chart">
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar" style={{ height: '80%' }}></div>
              <div className="chart-bar" style={{ height: '45%' }}></div>
              <div className="chart-bar" style={{ height: '90%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
            </div>
          </div>
          <div className="card-info">
            <div className={`card-check ${selected === 'minimal' ? 'checked' : ''}`}>
              {selected === 'minimal' && <span>✓</span>}
            </div>
            <span className="card-name">简约纯色</span>
          </div>
        </div>

        {/* 情侣模式 */}
        <div
          className={`theme-card ${!isPartnerBound ? 'locked' : ''} ${selected === 'couple' ? 'selected' : ''}`}
          onClick={handleCoupleClick}
          title={!isPartnerBound ? '绑定伴侣后解锁' : ''}
        >
          <div className="card-preview couple-preview">
            {!isPartnerBound && (
              <div className="lock-overlay">
                <Lock size={24} />
                <span>绑定伴侣后解锁</span>
              </div>
            )}
            <div className="couple-header">
              <div className="mini-avatars">
                <div className="mini-avatar avata-a"></div>
                <div className="mini-avatar avata-b"></div>
              </div>
              <span className="couple-label">共同账本</span>
            </div>
            <div className="preview-amount couple-amount">
              <span className="preview-label">共同支出</span>
              <span className="preview-num">¥5,680.00</span>
            </div>
            <div className="budget-bar">
              <div className="budget-fill" style={{ width: '65%' }}></div>
            </div>
            <div className="budget-info">
              <span>预算剩余 ¥3,320</span>
              <span>65%</span>
            </div>
          </div>
          <div className="card-info">
            <div className={`card-check ${selected === 'couple' ? 'checked' : ''}`}>
              {selected === 'couple' && <span>✓</span>}
            </div>
            <span className="card-name">情侣模式</span>
          </div>
        </div>
      </div>

      {/* 确认按钮 */}
      <div className="theme-footer">
        <button
          className="confirm-btn"
          disabled={!selected}
          onClick={handleConfirm}
        >
          确认选择
        </button>
      </div>

      {/* 跳过确认弹窗 */}
      {showSkipModal && (
        <div className="modal-overlay" onClick={() => setShowSkipModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🎨</div>
            <h3>跳过设置？</h3>
            <p>Us 支持个性定制，您跳过此快捷教程后，可在我的-【个性化】进行设置哦~😜</p>
            <button className="modal-btn" onClick={handleConfirmSkip}>
              确认
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
