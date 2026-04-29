import { useState, useEffect } from 'react'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateInviteCode, saveCoupleProfile, getCoupleProfile } from '../lib/couple'
import { simulatePhoneLogin, saveLoginResult } from '../lib/auth'
import './Auth.css'

interface Props {
  onBack: () => void
  onSuccess: () => void
  goToLogin: () => void
}

export default function PhoneRegister({ onBack, onSuccess, goToLogin }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号')
      return
    }

    setLoading(true)
    setError('')

    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone: '+86' + phone,
      options: {
        shouldCreateUser: true
      }
    })

    setLoading(false)

    if (sendError) {
      if (sendError.message?.includes('Unsupported phone provider')) {
        setDevMode(true)
        setCountdown(60)
        setStep(2)
        setLoading(false)
        return
      }
      setError(sendError.message || '发送验证码失败，请重试')
      setLoading(false)
      return
    }

    setCountdown(60)
    setStep(2)
  }

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    if (devMode) {
      setStep(3)
      return
    }

    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: '+86' + phone,
      token: code,
      type: 'sms'
    })

    setLoading(false)

    if (verifyError) {
      setError('验证码错误，请重试')
      return
    }

    setStep(3)
  }

  const handleRegister = async () => {
    if (!password || password.length < 6) {
      setError('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError('密码必须包含字母和数字')
      return
    }

    // 开发模式：跳过 Supabase，直接完成注册
    if (devMode) {
      const result = simulatePhoneLogin(phone)
      saveLoginResult(result)
      if (inviteCode && validateInviteCode(inviteCode)) {
        const profile = getCoupleProfile()
        profile.bindDate = new Date().toISOString().split('T')[0]
        saveCoupleProfile(profile)
      }
      onSuccess()
      return
    }

    setLoading(true)
    setError('')

    // 设置密码
    const { error: pwdError } = await supabase.auth.updateUser({
      password
    })

    if (pwdError) {
      setError('设置密码失败，请重试')
      setLoading(false)
      return
    }

    // 存储邀请码作为用户元数据，同时更新本地伴侣关系
    if (inviteCode) {
      await supabase.auth.updateUser({
        data: { invite_code: inviteCode }
      })
      if (validateInviteCode(inviteCode)) {
        const profile = getCoupleProfile()
        profile.bindDate = new Date().toISOString().split('T')[0]
        saveCoupleProfile(profile)
      }
    }

    const result = simulatePhoneLogin(phone)
    saveLoginResult(result)
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <button
          className="back-btn"
          onClick={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2 | 3)}
        >
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
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <div className="auth-form">
          {step === 1 && (
            <>
              {devMode && (
                <div className="dev-banner">开发模式：无需真实验证码，输入任意6位数字即可</div>
              )}

              <div className="input-group">
                <label>手机号</label>
                <div className="input-wrapper">
                  <span className="prefix">+86</span>
                  <input
                    type="tel"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                      setError('')
                    }}
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>验证码</label>
                <div className="input-wrapper code-input">
                  <input
                    type="text"
                    placeholder="请输入验证码"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setError('')
                    }}
                    maxLength={6}
                  />
                  <button
                    className="send-code-btn"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button
                className="auth-btn primary"
                onClick={handleVerifyCode}
                disabled={loading || code.length < 6}
              >
                {loading ? '验证中...' : '下一步'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="input-group">
                <label>设置密码</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6-20位，字母+数字"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                  />
                  <button
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
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
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError('')
                    }}
                  />
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button className="auth-btn primary" onClick={() => setStep(3)}>
                下一步
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="input-group">
                <label>伴侣邀请码 <span className="optional">（选填）</span></label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="输入对方的邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
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
