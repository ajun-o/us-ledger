import { useState, useEffect } from 'react'
import { X, Sun, Moon, Monitor } from 'lucide-react'
import './Personalization.css'

interface Props { onClose: () => void }

type ThemeName = 'green' | 'blue' | 'purple' | 'pink' | 'orange'
type FontSize = 'small' | 'medium' | 'large'
type DarkMode = 'light' | 'dark' | 'system'

interface ThemeConfig { name: ThemeName; primary: string; primaryLight: string; label: string; emoji: string }

const THEMES: ThemeConfig[] = [
  { name: 'green', primary: '#A8D5BA', primaryLight: '#A8D5BA30', label: '薄荷绿', emoji: '🌿' },
  { name: 'blue', primary: '#74B9FF', primaryLight: '#74B9FF30', label: '天空蓝', emoji: '🌊' },
  { name: 'purple', primary: '#A29BFE', primaryLight: '#A29BFE30', label: '薰衣紫', emoji: '💜' },
  { name: 'pink', primary: '#FD79A8', primaryLight: '#FD79A830', label: '樱花粉', emoji: '🌸' },
  { name: 'orange', primary: '#F4A261', primaryLight: '#F4A26130', label: '暖橘', emoji: '🍊' },
]

const THEME_DARK: Record<ThemeName, string> = {
  green: '#8BC4A4', blue: '#5BA4E0', purple: '#8B7FE6', pink: '#E8508A', orange: '#E8924D',
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

const FONT_SIZES = [
  { id: 'small' as FontSize, label: '小', size: '14px', hint: '紧凑' },
  { id: 'medium' as FontSize, label: '标准', size: '16px', hint: '适中' },
  { id: 'large' as FontSize, label: '大', size: '18px', hint: '舒适' },
]

const THEME_KEY = 'us_ledger_theme'
const FONT_KEY = 'us_ledger_font_size'
const DARK_MODE_KEY = 'us_dark_mode'

const DARK_OPTIONS: { id: DarkMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: '浅色', icon: Sun },
  { id: 'dark', label: '深色', icon: Moon },
  { id: 'system', label: '跟随系统', icon: Monitor },
]

function loadTheme(): ThemeName {
  try { const r = localStorage.getItem(THEME_KEY); if (r) return r as ThemeName } catch {}
  return 'green'
}
function loadDarkMode(): DarkMode {
  try { const r = localStorage.getItem(DARK_MODE_KEY); if (r) return r as DarkMode } catch {}
  return 'light'
}

function applyDarkMode(mode: DarkMode) {
  const el = document.documentElement
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  el.setAttribute('data-theme', isDark ? 'dark' : 'light')
  localStorage.setItem(DARK_MODE_KEY, mode)
}

function loadFontSize(): FontSize {
  try { const r = localStorage.getItem(FONT_KEY); if (r) return r as FontSize } catch {}
  return 'medium'
}

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-light', theme.primaryLight)
  root.style.setProperty('--primary-rgb', hexToRgb(theme.primary))
  root.style.setProperty('--primary-dark', THEME_DARK[theme.name])
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
  const [darkMode, setDarkMode] = useState<DarkMode>(loadDarkMode)
  const currentTheme = THEMES.find(t => t.name === theme)!

  const handleThemeChange = (t: ThemeConfig) => {
    setTheme(t.name)
    applyTheme(t)
  }

  const handleFontChange = (fs: FontSize) => {
    setFontSize(fs)
    applyFontSize(fs)
  }

  const handleDarkModeChange = (mode: DarkMode) => {
    setDarkMode(mode)
    applyDarkMode(mode)
  }

  // 组件挂载时应用已保存的设置
  useEffect(() => {
    const savedTheme = THEMES.find(t => t.name === loadTheme()) || THEMES[0]
    applyTheme(savedTheme)
    applyFontSize(loadFontSize())
    applyDarkMode(loadDarkMode())
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
            <div className="pz-preview-card" style={{ fontSize: 'var(--font-size, 16px)' }}>
              {/* 资产卡片 */}
              <div className="pz-preview-card-top" style={{ background: 'linear-gradient(135deg, var(--primary, #A8D5BA), var(--primary-dark, #8BC4A4))' }}>
                <span className="pz-preview-card-label">本月支出</span>
                <span className="pz-preview-card-amount">¥1,286.50</span>
                <div className="pz-preview-card-btns">
                  <span className="pz-preview-card-tag" style={{ background: 'rgba(255,255,255,0.25)' }}>收入 ¥3,200</span>
                  <span className="pz-preview-card-tag" style={{ background: 'rgba(255,255,255,0.25)' }}>结余 ¥1,914</span>
                </div>
              </div>
              {/* 账单行 */}
              <div className="pz-preview-bills">
                <div className="pz-preview-bill">
                  <span className="pz-preview-bill-icon">🍔</span>
                  <span className="pz-preview-bill-name">餐饮</span>
                  <span className="pz-preview-bill-note">午餐外卖</span>
                  <span className="pz-preview-bill-amount" style={{ color: '#E74C3C' }}>-48.00</span>
                </div>
                <div className="pz-preview-bill">
                  <span className="pz-preview-bill-icon">🚗</span>
                  <span className="pz-preview-bill-name">交通</span>
                  <span className="pz-preview-bill-note">打车</span>
                  <span className="pz-preview-bill-amount" style={{ color: '#E74C3C' }}>-32.50</span>
                </div>
                <div className="pz-preview-bill">
                  <span className="pz-preview-bill-icon">💼</span>
                  <span className="pz-preview-bill-name">工资</span>
                  <span className="pz-preview-bill-note">月薪</span>
                  <span className="pz-preview-bill-amount" style={{ color: '#27AE60' }}>+3,200</span>
                </div>
              </div>
              {/* 底部导航 */}
              <div className="pz-preview-nav">
                <div className="pz-preview-nav-item active">
                  <span style={{ fontSize: '14px' }}>📝</span>
                  <span>记账</span>
                </div>
                <div className="pz-preview-nav-item">
                  <span style={{ fontSize: '14px' }}>📋</span>
                  <span>账单</span>
                </div>
                <div className="pz-preview-nav-item">
                  <span style={{ fontSize: '14px' }}>📊</span>
                  <span>报表</span>
                </div>
                <div className="pz-preview-nav-item">
                  <span style={{ fontSize: '14px' }}>👤</span>
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

          {/* 外观模式 */}
          <div className="pz-section">
            <div className="pz-section-title">外观模式</div>
            <div className="pz-dark-options">
              {DARK_OPTIONS.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    className={`pz-dark-btn ${darkMode === opt.id ? 'active' : ''}`}
                    onClick={() => handleDarkModeChange(opt.id)}
                  >
                    <Icon size={20} />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
