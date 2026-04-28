import { useState } from 'react'
import Welcome from './pages/Welcome'
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
import './App.css'

type Page = 'welcome' | 'phone-login' | 'phone-register' | 'theme' | 'main' | 'settings' | 'assets'
type TabType = 'home' | 'bills' | 'reports' | 'profile'

const AUTH_KEY = 'us_ledger_auth'
const THEME_KEY = 'us_ledger_theme'

function getInitialPage(): Page {
  try {
    const saved = localStorage.getItem(AUTH_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.loggedIn) return 'main'
    }
  } catch { /* ignore */ }
  return 'welcome'
}

function getInitialTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY) || null
  } catch {
    return null
  }
}

function persistLogin() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true }))
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(getInitialTheme)
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false })

  const triggerRefresh = () => setRefreshKey(k => k + 1)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000)
  }

  const handleLogin = () => {
    persistLogin()
    setCurrentPage('theme')
  }

  const handleThemeConfirm = (theme: string) => {
    localStorage.setItem(THEME_KEY, theme)
    setSelectedTheme(theme)
    setCurrentPage('main')
  }

  const handleThemeSkip = () => {
    setCurrentPage('main')
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleOpenAddRecord = () => {
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
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(THEME_KEY)
    setSelectedTheme(null)
    setCurrentPage('welcome')
  }

  const handleBackFromSettings = () => {
    setCurrentPage('main')
  }

  const handlePhoneLoginSuccess = () => {
    persistLogin()
    setCurrentPage('theme')
  }

  const handleRegisterSuccess = () => {
    persistLogin()
    setCurrentPage('theme')
  }

  return (
    <div className="app">
      {currentPage === 'welcome' && (
        <Welcome
          onLogin={handleLogin}
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
        <Settings onBack={handleBackFromSettings} onLogout={handleLogout} />
      )}
      {currentPage === 'assets' && (
        <Assets onBack={() => setCurrentPage('main')} />
      )}

      {showAddRecord && (
        <AddRecord
          onClose={handleCloseAddRecord}
          onSave={handleSaveRecord}
          onError={handleSaveError}
        />
      )}
      {toast.visible && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}

export default App
