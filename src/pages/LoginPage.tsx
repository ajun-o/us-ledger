import { useState } from 'react'
import { X, Sun, Moon, Loader2 } from 'lucide-react'
import { simulateWechatLogin, saveLoginResult, hasCompletedOnboarding } from '../lib/auth'
import './LoginPage.css'

interface Props {
  onClose?: () => void
  onSuccess: () => void
  onPhoneLogin: () => void
  onPhoneRegister: () => void
}

// 微信图标 SVG
const WechatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.916 5.106c-.348 0-.697.036-1.043.105-1.84.366-3.348 1.582-4.097 3.307-.757 1.742-.544 3.594.582 5.036 1.126 1.442 2.88 2.298 4.755 2.298.34 0 .673-.04.98-.093a.694.694 0 0 1 .58.083l1.536.897a.269.269 0 0 0 .136.045c.128 0 .232-.107.232-.238 0-.058-.02-.115-.04-.17l-.312-1.192a.482.482 0 0 1 .171-.54C22.856 19.374 24 17.884 24 16.125c0-2.802-2.731-5.028-6.486-5.028zm-1.581 2.666c.462 0 .836.378.836.843a.84.84 0 0 1-.836.843.84.84 0 0 1-.836-.843c0-.465.374-.843.836-.843zm4.29 0c.461 0 .835.378.835.843a.84.84 0 0 1-.835.843.84.84 0 0 1-.836-.843c0-.465.374-.843.836-.843z"/>
  </svg>
)

export default function LoginPage({ onClose, onSuccess, onPhoneLogin, onPhoneRegister }: Props) {
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyShake, setPrivacyShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const showClose = onClose && !hasCompletedOnboarding() ? false : !!onClose

  const handleWechatLogin = async () => {
    if (!privacyAccepted) {
      setPrivacyShake(true)
      setToast('请阅读并同意隐私政策')
      setTimeout(() => setPrivacyShake(false), 600)
      setTimeout(() => setToast(''), 2000)
      return
    }

    setLoading(true)
    setToast('')

    // 模拟微信授权：随机延迟 800-2000ms
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))

    try {
      // 模拟微信登录结果
      const result = simulateWechatLogin()
      saveLoginResult(result)
      setLoading(false)

      if (result.isNewUser) {
        onSuccess()
      } else {
        onSuccess()
      }
    } catch {
      setLoading(false)
      setToast('网络不稳定，请重试')
      setTimeout(() => setToast(''), 2000)
    }
  }

  return (
    <div className={`login-page ${darkMode ? 'dark' : ''}`}>
      {/* 顶部 */}
      <header className="login-header">
        {showClose ? (
          <button className="login-close-btn" onClick={onClose}>
            <X size={20} color="#FFFFFF" />
          </button>
        ) : (
          <div></div>
        )}
        <button className="login-theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun size={18} color="#2D3436" /> : <Moon size={18} color="#2D3436" />}
        </button>
      </header>

      <main className="login-main">
        {/* 标题 */}
        <div className="login-title-section">
          <h1 className="login-title">欢迎来到 Us</h1>
          <p className="login-subtitle">双人记账，一起理财</p>
        </div>

        {/* 3D 插画区域（占位） */}
        <div className="login-illustration">
          <div className="illustration-card">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-inner">
              <div className="illustration-avatar ava-1">👤</div>
              <span className="illustration-heart">♥</span>
              <div className="illustration-avatar ava-2">👤</div>
            </div>
            <div className="illustration-chart">
              <div className="chart-bar" style={{ height: '40%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
              <div className="chart-bar" style={{ height: '55%' }}></div>
              <div className="chart-bar" style={{ height: '85%' }}></div>
              <div className="chart-bar" style={{ height: '60%' }}></div>
            </div>
            <div className="illustration-label">共同记账</div>
          </div>
        </div>

        {/* 登录按钮区 */}
        <div className="login-actions">
          {/* 微信登录 */}
          <button
            className={`wechat-btn ${!privacyAccepted ? 'disabled' : ''}`}
            onClick={handleWechatLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spinning" />
                <span>登录中...</span>
              </>
            ) : (
              <>
                <WechatIcon />
                <span>微信登录</span>
              </>
            )}
          </button>

          {/* 分割线 */}
          <div className="login-divider">
            <span className="divider-line"></span>
            <span className="divider-text">其他方式登录</span>
            <span className="divider-line"></span>
          </div>

          {/* 其他登录方式 */}
          <div className="alt-login-btns">
            <button className="alt-login-btn apple" onClick={onPhoneLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.06-.42 1.44-1.38 2.83zM13 3.5c.73-.88 1.97-1.51 3.03-1.57.15 1.29-.38 2.59-1.12 3.51-.78.97-2.07 1.71-3.3 1.61-.17-1.27.39-2.56 1.39-3.55z"/>
              </svg>
              <span>Apple ID</span>
            </button>
            <button className="alt-login-btn phone" onClick={onPhoneLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span>手机号</span>
            </button>
          </div>
        </div>

        {/* 隐私政策 */}
        <div className={`privacy-row ${privacyShake ? 'shake' : ''}`}>
          <button
            className={`privacy-checkbox ${privacyAccepted ? 'checked' : ''}`}
            onClick={() => setPrivacyAccepted(!privacyAccepted)}
          >
            {privacyAccepted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
          <span className="privacy-text">
            我已阅读并同意
            <button className="privacy-link" onClick={() => setToast('隐私政策页面开发中')}>《隐私政策》</button>
          </span>
        </div>

        {/* 注册链接 */}
        <div className="register-row">
          <span>没有账号？</span>
          <button className="register-link" onClick={onPhoneRegister}>创建新账号</button>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="login-toast">{toast}</div>
      )}
    </div>
  )
}
