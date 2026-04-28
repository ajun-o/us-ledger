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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('welcome')
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = () => setRefreshKey(k => k + 1)

  const handleLogin = () => {
    setCurrentPage('theme')
  }

  const handleThemeConfirm = (theme: string) => {
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

  const handleSaveRecord = () => {
    setShowAddRecord(false)
    triggerRefresh()
  }

  const handleOpenSettings = () => {
    setCurrentPage('settings')
  }

  const handleBackFromSettings = () => {
    setCurrentPage('main')
  }

  const handlePhoneLoginSuccess = () => {
    setCurrentPage('theme')
  }

  const handleRegisterSuccess = () => {
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
        <Settings onBack={handleBackFromSettings} />
      )}
      {currentPage === 'assets' && (
        <Assets onBack={() => setCurrentPage('main')} />
      )}

      {showAddRecord && (
        <AddRecord
          onClose={handleCloseAddRecord}
          onSave={handleSaveRecord}
        />
      )}
    </div>
  )
}

export default App
