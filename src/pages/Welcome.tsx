import { useState } from 'react'
import { X, Sun, Moon, Smartphone, Apple } from 'lucide-react'
import './Welcome.css'

type Theme = 'light' | 'dark'

interface Props {
  onLogin: () => void
  onPhoneLogin: () => void
  onPhoneRegister: () => void
}

export default function Welcome({ onLogin, onPhoneLogin, onPhoneRegister }: Props) {
  const [theme, setTheme] = useState<Theme>('light')
  const [agreed, setAgreed] = useState(false)

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleWechatLogin = () => {
    if (agreed) {
      // TODO: 微信登录
      onLogin()
    }
  }

  const handleAppleLogin = () => {
    if (agreed) {
      // TODO: Apple 登录
      onLogin()
    }
  }

  const handlePhoneLogin = () => {
    if (agreed) {
      onPhoneLogin()
    }
  }

  const handlePhoneRegister = () => {
    if (agreed) {
      onPhoneRegister()
    }
  }

  return (
    <div className={`welcome ${theme}`}>
      {/* 顶部导航 */}
      <header className="welcome-header">
        <button className="icon-btn" aria-label="关闭">
          <X size={20} />
        </button>
        <button className="icon-btn" onClick={toggleTheme} aria-label="切换主题">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      {/* 主内容 */}
      <main className="welcome-main">
        {/* 标题区 */}
        <div className="welcome-title">
          <h1>欢迎来到 Us</h1>
          <p>双人记账，一起理财</p>
        </div>

        {/* 插画区 */}
        <div className="welcome-illustration">
          <div className="illustration-wrapper">
            <div className="couple-scene">
              <div className="person person-left">
                <div className="person-head"></div>
                <div className="person-body"></div>
              </div>
              <div className="ledger-icon">
                <div className="ledger-book"></div>
                <div className="ledger-lines">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="person person-right">
                <div className="person-head"></div>
                <div className="person-body"></div>
              </div>
            </div>
            <div className="floating-coins">
              <div className="coin coin-1"></div>
              <div className="coin coin-2"></div>
              <div className="coin coin-3"></div>
            </div>
          </div>
        </div>

        {/* 登录按钮区 */}
        <div className="login-section">
          <button className="btn-wechat" onClick={handleWechatLogin} disabled={!agreed}>
            微信登录
          </button>

          <div className="divider">
            <span>其他方式登录</span>
          </div>

          <div className="other-logins">
            <button className="login-icon-btn apple-btn" onClick={handleAppleLogin} disabled={!agreed} aria-label="Apple ID 登录">
              <Apple size={24} />
            </button>
            <button className="login-icon-btn phone-btn" onClick={handlePhoneLogin} disabled={!agreed} aria-label="手机号登录">
              <Smartphone size={24} />
            </button>
          </div>

          <button className="register-link" onClick={handlePhoneRegister} disabled={!agreed}>
            注册新账号
          </button>
        </div>
      </main>

      {/* 底部隐私政策 */}
      <footer className="welcome-footer">
        <label className="privacy-check">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="privacy-text">
            我已阅读并同意<a href="#privacy">《隐私政策》</a>
          </span>
        </label>
      </footer>
    </div>
  )
}
