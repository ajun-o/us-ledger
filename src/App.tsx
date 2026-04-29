import { useState } from 'react'
import Splash from './pages/Splash'
import LoginPage from './pages/LoginPage'
import ThemeSelect from './pages/ThemeSelect'
import Home from './pages/Home'
import Bills from './pages/Bills'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import AddRecord from './pages/AddRecord'
import Settings from './pages/Settings'
import Assets from './pages/Assets'
import PhoneLogin from './pages/PhoneLogin'
import PhoneRegister from './pages/PhoneRegister'
import { isTokenValid, clearAuthData, setOnboardingComplete, hasCompletedOnboarding } from './lib/auth'
import './App.css'

type Page = 'splash' | 'welcome' | 'phone-login' | 'phone-register' | 'theme' | 'main' | 'settings' | 'assets'
type TabType = 'home' | 'bills' | 'reports' | 'profile'

const THEME_KEY = 'us_ledger_theme'

function getInitialTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY) || null
  } catch {
    return null
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('splash')
  const [selectedTheme, setSelectedTheme] = useState<string | null>(getInitialTheme)
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [addRecordDefaultMember, setAddRecordDefaultMember] = useState<'mine' | 'partner' | 'joint' | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false })

  const triggerRefresh = () => setRefreshKey(k => k + 1)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000)
  }

  // ===== Splash 回调 =====
  const handleSplashGoMain = () => setCurrentPage('main')
  const handleSplashGoLogin = () => setCurrentPage('welcome')

  // ===== 登录成功后：先检查是否需要引导页 =====
  const handleAfterLogin = () => {
    if (!hasCompletedOnboarding()) {
      setCurrentPage('theme')
    } else {
      setCurrentPage('main')
    }
  }

  const handleThemeConfirm = (theme: string) => {
    localStorage.setItem(THEME_KEY, theme)
    setSelectedTheme(theme)
    setOnboardingComplete()
    setCurrentPage('main')
  }

  const handleThemeSkip = () => {
    setOnboardingComplete()
    setCurrentPage('main')
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleOpenAddRecord = (defaultMember?: 'mine' | 'partner' | 'joint') => {
    setAddRecordDefaultMember(defaultMember)
    setShowAddRecord(true)
  }

  const handleCloseAddRecord = () => {
    setShowAddRecord(false)
  }

  const handleSaveRecord = (message: string) => {
    setShowAddRecord(false)
    triggerRefresh()
    showToast(message, 'success')
  }

  const handleSaveError = (message: string) => {
    showToast(message, 'error')
  }

  const handleOpenSettings = () => {
    setCurrentPage('settings')
  }

  const handleLogout = () => {
    clearAuthData()
    localStorage.removeItem(THEME_KEY)
    setSelectedTheme(null)
    setCurrentPage('welcome')
  }

  const handleBackFromSettings = () => {
    setCurrentPage('main')
  }

  const handleOpenCoupleFromSettings = () => {
    setCurrentPage('main')
    setActiveTab('profile')
    // 延迟一下让 Profile 组件挂载后再打开情侣页
    setTimeout(() => {
      // 通过 storage event 或直接操作来通知 Profile 打开情侣页
      localStorage.setItem('us_ledger_open_couple', 'true')
    }, 100)
  }

  const handlePhoneLoginSuccess = () => {
    handleAfterLogin()
  }

  const handleRegisterSuccess = () => {
    handleAfterLogin()
  }

  return (
    <div className="app">
      {currentPage === 'splash' && (
        <Splash
          onGoMain={handleSplashGoMain}
          onGoLogin={handleSplashGoLogin}
        />
      )}
      {currentPage === 'welcome' && (
        <LoginPage
          onClose={isTokenValid() ? () => setCurrentPage('main') : undefined}
          onSuccess={handleAfterLogin}
          onPhoneLogin={() => setCurrentPage('phone-login')}
          onPhoneRegister={() => setCurrentPage('phone-register')}
        />
      )}
      {currentPage === 'phone-login' && (
        <PhoneLogin
          onBack={() => setCurrentPage('welcome')}
          onSuccess={handlePhoneLoginSuccess}
          goToRegister={() => setCurrentPage('phone-register')}
        />
      )}
      {currentPage === 'phone-register' && (
        <PhoneRegister
          onBack={() => setCurrentPage('welcome')}
          onSuccess={handleRegisterSuccess}
          goToLogin={() => setCurrentPage('phone-login')}
        />
      )}
      {currentPage === 'theme' && (
        <ThemeSelect
          onConfirm={handleThemeConfirm}
          onSkip={handleThemeSkip}
        />
      )}
      {currentPage === 'main' && (
        <>
          {activeTab === 'home' && (
            <Home
              theme={selectedTheme}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onAddRecord={handleOpenAddRecord}
              onGoAssets={() => setCurrentPage('assets')}
              refreshKey={refreshKey}
              onDataChange={triggerRefresh}
            />
          )}
          {activeTab === 'bills' && (
            <Bills
              activeTab={activeTab}
              onTabChange={handleTabChange}
              refreshKey={refreshKey}
              onDataChange={triggerRefresh}
            />
          )}
          {activeTab === 'reports' && (
            <Reports
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onAddRecord={handleOpenAddRecord}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === 'profile' && (
            <Profile
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onOpenSettings={handleOpenSettings}
            />
          )}
        </>
      )}
      {currentPage === 'settings' && (
        <Settings onBack={handleBackFromSettings} onLogout={handleLogout} onOpenCouplePage={handleOpenCoupleFromSettings} />
      )}
      {currentPage === 'assets' && (
        <Assets onBack={() => setCurrentPage('main')} />
      )}

      {showAddRecord && (
        <AddRecord
          onClose={handleCloseAddRecord}
          onSave={handleSaveRecord}
          onError={handleSaveError}
          defaultMember={addRecordDefaultMember}
        />
      )}
      {toast.visible && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}

export default App
