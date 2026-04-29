import { useEffect, useRef, useState } from 'react'
import { initAuthCache, migrateLegacyAuth } from '../lib/auth'
import { syncCoupleFromSupabase } from '../lib/couple'
import './Splash.css'

interface Props {
  onGoMain: () => void
  onGoLogin: () => void
}

export default function Splash({ onGoMain, onGoLogin }: Props) {
  const [fadeOut, setFadeOut] = useState(false)
  const minTimePassed = useRef(false)
  const initDone = useRef(false)
  const authOk = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      minTimePassed.current = true
      if (initDone.current) doNavigate()
    }, 1500)

    runInit().then(() => {
      initDone.current = true
      if (minTimePassed.current) doNavigate()
    })

    return () => clearTimeout(timer)
  }, [])

  const doNavigate = () => {
    setFadeOut(true)
    setTimeout(() => {
      if (authOk.current) {
        syncCoupleFromSupabase().catch(() => {})
        onGoMain()
      } else {
        onGoLogin()
      }
    }, 300)
  }

  const runInit = async () => {
    migrateLegacyAuth()
    authOk.current = await initAuthCache()
    // 快速加载动画
    await new Promise(r => setTimeout(r, 200))
  }

  return (
    <div className={`splash-page ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-bg"></div>
      <div className="splash-content">
        <h1 className="splash-logo">Us</h1>
        <p className="splash-subtitle">双人记账，一起理财</p>
        <div className="splash-loader">
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
        </div>
      </div>
    </div>
  )
}
