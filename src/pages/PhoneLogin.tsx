import { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Auth.css'

interface Props {
  onBack: () => void
  onSuccess: () => void
  goToRegister: () => void
}

export default function PhoneLogin({ onBack, onSuccess, goToRegister }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
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
      // SMS 服务未配置时自动进入开发模式
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

    // 开发模式：任意6位验证码直接通过
    if (devMode) {
      onSuccess()
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

    onSuccess()
  }

  const handleResend = () => {
    setCode('')
    setStep(1)
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <button className="back-btn" onClick={step === 1 ? onBack : () => setStep(1)}>
          <ChevronLeft size={20} />
        </button>
        <h1>手机号登录</h1>
        <div></div>
      </header>

      <main className="auth-main">
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
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                      setError('')
                    }}
                    maxLength={11}
                  />
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button
                className="auth-btn primary"
                onClick={handleSendCode}
                disabled={loading || phone.length < 11}
              >
                {loading ? '发送中...' : '获取验证码'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="sent-info">
                {devMode ? (
                  <p className="dev-hint">开发模式：无需真实验证码</p>
                ) : (
                  <p>验证码已发送至</p>
                )}
                <p className="sent-phone">+86 {phone}</p>
              </div>

              <div className="input-group">
                <label>验证码</label>
                <div className="input-wrapper code-input">
                  <input
                    type="text"
                    placeholder="请输入6位验证码"
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
                    {countdown > 0 ? `${countdown}s` : '重新发送'}
                  </button>
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button
                className="auth-btn primary"
                onClick={handleVerifyCode}
                disabled={loading || code.length < 6}
              >
                {loading ? '验证中...' : '验证并登录'}
              </button>

              <button className="link-btn block" onClick={handleResend}>
                更换手机号
              </button>
            </>
          )}

          <div className="auth-links">
            <span>还没有账号？</span>
            <button className="link-btn" onClick={goToRegister}>注册新账号</button>
          </div>
        </div>
      </main>
    </div>
  )
}
