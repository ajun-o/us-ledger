import { useState } from 'react'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateInviteCode, bindWithPartnerInviteCode } from '../lib/couple'
import { setCachedSessionValid, phoneToEmail } from '../lib/auth'
import './Auth.css'

interface Props {
  onBack: () => void
  onSuccess: () => void
  goToLogin: () => void
}

export default function PhoneRegister({ onBack, onSuccess, goToLogin }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePhone = (p: string) => /^1[3-9]\d{9}$/.test(p)
  const validatePassword = (p: string) => p.length >= 6 && /[A-Za-z]/.test(p) && /\d/.test(p)

  const handleRegister = async () => {
    if (!validatePhone(phone)) { setError('手机号格式不正确'); return }
    if (!validatePassword(password)) { setError('密码需6位以上，含字母和数字'); return }
    if (password !== confirmPassword) { setError('两次密码不一致'); return }

    setLoading(true)
    setError('')

    const email = phoneToEmail(phone)

    // 注册：email + password
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { phone, nickname: phone.slice(-4) },
      },
    })

    if (signUpError) {
      setLoading(false)
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
        setError('该手机号已注册，请直接登录')
      } else {
        setError(signUpError.message || '注册失败，请重试')
      }
      return
    }

    if (!signUpData.user) {
      setLoading(false)
      setError('注册失败，请重试')
      return
    }

    // 邀请码绑定
    if (inviteCode && validateInviteCode(inviteCode)) {
      const result = await bindWithPartnerInviteCode(inviteCode)
      if (!result.success) {
        setError(result.error || '邀请码绑定失败')
        setLoading(false)
        return
      }
    }

    setCachedSessionValid(true)
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <button className="back-btn" onClick={step === 1 ? onBack : () => setStep(1)}>
          <ChevronLeft size={20} />
        </button>
        <h1>注册新账号</h1>
        <div></div>
      </header>

      <main className="auth-main">
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        <div className="auth-form">
          {step === 1 && (
            <>
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
                <label>设置密码</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6-20位，字母+数字"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                  />
                  <button className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>确认密码</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                  />
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button
                className="auth-btn primary"
                onClick={() => {
                  if (!validatePhone(phone)) { setError('手机号格式不正确'); return }
                  if (!validatePassword(password)) { setError('密码需6位以上，含字母和数字'); return }
                  if (password !== confirmPassword) { setError('两次密码不一致'); return }
                  setStep(2)
                }}
              >
                下一步
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="input-group">
                <label>伴侣邀请码 <span className="optional">（选填）</span></label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="输入对方的邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                    maxLength={6}
                    className="invite-code-input"
                  />
                </div>
                <span className="input-hint">填写后注册成功将自动建立伴侣关系</span>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button
                className="auth-btn primary"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? '注册中...' : '注册并登录'}
              </button>

              <button className="link-btn block" onClick={handleRegister}>
                跳过
              </button>
            </>
          )}

          <div className="auth-links">
            <span>已有账号？</span>
            <button className="link-btn" onClick={goToLogin}>去登录</button>
          </div>
        </div>
      </main>
    </div>
  )
}
