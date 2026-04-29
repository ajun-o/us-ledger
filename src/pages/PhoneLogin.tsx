import { useState } from 'react'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setCachedSessionValid, phoneToEmail } from '../lib/auth'
import { syncCoupleFromSupabase } from '../lib/couple'
import './Auth.css'

interface Props {
  onBack: () => void
  onSuccess: () => void
  goToRegister: () => void
}

export default function PhoneLogin({ onBack, onSuccess, goToRegister }: Props) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    const email = phoneToEmail(phone)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setLoading(false)
      if (loginError.message?.includes('Invalid login credentials')) {
        setError('手机号或密码错误')
      } else {
        setError(loginError.message || '登录失败，请重试')
      }
      return
    }

    if (!data.user) {
      setLoading(false)
      setError('登录失败，请重试')
      return
    }

    setCachedSessionValid(true)
    syncCoupleFromSupabase().catch(() => {})
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <h1>手机号登录</h1>
        <div></div>
      </header>

      <main className="auth-main">
        <div className="auth-form">
          <div className="input-group">
            <label>手机号</label>
            <div className="input-wrapper">
              <span className="prefix">+86</span>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 11)); setError('') }}
                maxLength={11}
              />
            </div>
          </div>

          <div className="input-group">
            <label>密码</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
              />
              <button className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="auth-btn primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="auth-links">
            <span>还没有账号？</span>
            <button className="link-btn" onClick={goToRegister}>注册新账号</button>
          </div>
        </div>
      </main>
    </div>
  )
}
