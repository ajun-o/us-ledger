import { useState, useEffect } from 'react'
import { X, Palette } from 'lucide-react'
import './Personalization.css'

interface Props { onClose: () => void }

type ThemeName = 'green' | 'blue' | 'purple' | 'pink' | 'orange'
type FontSize = 'small' | 'medium' | 'large'

interface ThemeConfig { name: ThemeName; primary: string; primaryLight: string; label: string; emoji: string }

const THEMES: ThemeConfig[] = [
  { name: 'green', primary: '#A8D5BA', primaryLight: '#A8D5BA30', label: '薄荷绿', emoji: '🌿' },
  { name: 'blue', primary: '#74B9FF', primaryLight: '#74B9FF30', label: '天空蓝', emoji: '🌊' },
  { name: 'purple', primary: '#A29BFE', primaryLight: '#A29BFE30', label: '薰衣紫', emoji: '💜' },
  { name: 'pink', primary: '#FD79A8', primaryLight: '#FD79A830', label: '樱花粉', emoji: '🌸' },
  { name: 'orange', primary: '#F4A261', primaryLight: '#F4A26130', label: '暖橘', emoji: '🍊' },
]

const FONT_SIZES = [
  { id: 'small' as FontSize, label: '小', size: '14px', hint: '紧凑' },
  { id: 'medium' as FontSize, label: '标准', size: '16px', hint: '适中' },
  { id: 'large' as FontSize, label: '大', size: '18px', hint: '舒适' },
]

const THEME_KEY = 'us_ledger_theme'
const FONT_KEY = 'us_ledger_font_size'

function loadTheme(): ThemeName {
  try { const r = localStorage.getItem(THEME_KEY); if (r) return r as ThemeName } catch {}
  return 'green'
}
function loadFontSize(): FontSize {
  try { const r = localStorage.getItem(FONT_KEY); if (r) return r as FontSize } catch {}
  return 'medium'
}

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-light', theme.primaryLight)
  localStorage.setItem(THEME_KEY, theme.name)
}

function applyFontSize(fs: FontSize) {
  const sizes: Record<FontSize, string> = { small: '14px', medium: '16px', large: '18px' }
  document.documentElement.style.setProperty('--font-size', sizes[fs])
  localStorage.setItem(FONT_KEY, fs)
}

export default function Personalization({ onClose }: Props) {
  const [theme, setTheme] = useState<ThemeName>(loadTheme)
  const [fontSize, setFontSize] = useState<FontSize>(loadFontSize)
  const currentTheme = THEMES.find(t => t.name === theme)!

  const handleThemeChange = (t: ThemeConfig) => {
    setTheme(t.name)
    applyTheme(t)
  }

  const handleFontChange = (fs: FontSize) => {
    setFontSize(fs)
    applyFontSize(fs)
  }

  // 组件挂载时应用已保存的设置
  useEffect(() => {
    const savedTheme = THEMES.find(t => t.name === loadTheme()) || THEMES[0]
    applyTheme(savedTheme)
    applyFontSize(loadFontSize())
  }, [])

  return (
    <div className="pz-overlay">
      <div className="pz-page">
        <header className="pz-header">
          <button className="pz-back" onClick={onClose}><X size={24} /></button>
          <h2>个性化</h2>
          <div style={{ width: 40 }} />
        </header>
        <div className="pz-body">
          {/* 预览 */}
          <div className="pz-preview">
            <div className="pz-preview-label">效果预览</div>
            <div className="pz-preview-card" style={{ fontSize: `var(--font-size, 16px)` }}>
              <div className="pz-preview-row">
                <span className="pz-preview-title" style={{ fontSize: `var(--font-size, 16px)` }}>今日支出</span>
                <span className="pz-preview-amount">¥128.50</span>
              </div>
              <div className="pz-preview-row">
                <span className="pz-preview-badge">餐饮</span>
                <span style={{ fontSize: '12px', color: '#636E72' }}>2笔</span>
              </div>
              <div className="pz-preview-progress">
                <div className="pz-preview-fill" style={{ width: '65%' }} />
              </div>
              <div className="pz-preview-nav">
                <div className="pz-preview-nav-item active">
                  <Palette size={14} />
                  <span>记账</span>
                </div>
                <div className="pz-preview-nav-item">
                  <Palette size={14} />
                  <span>账单</span>
                </div>
                <div className="pz-preview-nav-item">
                  <Palette size={14} />
                  <span>我的</span>
                </div>
              </div>
            </div>
          </div>

          {/* 主题色 */}
          <div className="pz-section">
            <div className="pz-section-title">主题色 · {currentTheme.label}</div>
            <div className="pz-theme-grid">
              {THEMES.map(t => (
                <button
                  key={t.name}
                  className={`pz-theme-btn ${t.name} ${theme === t.name ? 'active' : ''}`}
                  onClick={() => handleThemeChange(t)}
                >
                  {theme === t.name && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* 字体大小 */}
          <div className="pz-section">
            <div className="pz-section-title">字体大小</div>
            <div className="pz-font-options">
              {FONT_SIZES.map(fs => (
                <button
                  key={fs.id}
                  className={`pz-font-btn ${fontSize === fs.id ? 'active' : ''}`}
                  onClick={() => handleFontChange(fs.id)}
                >
                  <span className="size" style={{ fontSize: fs.size }}>Aa</span>
                  <span className="hint">{fs.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
