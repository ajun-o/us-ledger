import {
  ScanLine,
  Settings,
  ChevronRight,
  Palette,
  HelpCircle,
  List,
  BookOpen,
  Target,
  PiggyBank,
  ShoppingCart,
  Tag,
  DollarSign,
  Wrench,
  FileText,
  Clock,
  BarChart3,
  Wallet,
  Utensils,
  Box,
  Repeat,
  Lightbulb,
  Zap,
  Phone,
  Share2,
  Info,
  X
} from 'lucide-react'
import { useState } from 'react'
import './Profile.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onOpenSettings: () => void
}

export default function Profile({ activeTab, onTabChange, onOpenSettings }: Props) {
  const [showBanner, setShowBanner] = useState(true)

  const tabs = [
    { id: 'home' as TabType, icon: Wallet, label: '主页' },
    { id: 'bills' as TabType, icon: FileText, label: '账单' },
    { id: 'reports' as TabType, icon: BarChart3, label: '报表' },
    { id: 'profile' as TabType, icon: Settings, label: '我的' }
  ]

  const commonFeatures = [
    { icon: List, label: '收支分类', color: '#FF6B6B' },
    { icon: BookOpen, label: '多账本', color: '#4ECDC4' },
    { icon: Target, label: '预算设置', color: '#45B7D1' },
    { icon: PiggyBank, label: '存钱', color: '#96CEB4' },
    { icon: ShoppingCart, label: '购物清单', color: '#FFEAA7' },
    { icon: Tag, label: '标签', color: '#DDA0DD' },
    { icon: DollarSign, label: '汇率', color: '#98D8C8' },
    { icon: Wrench, label: '小工具', color: '#F7DC6F' }
  ]

  const billAssets = [
    { icon: FileText, label: '账单管理', color: '#74B9FF' },
    { icon: Clock, label: '定时记账', color: '#A29BFE' },
    { icon: BarChart3, label: '账单报告', color: '#FD79A8' },
    { icon: Wallet, label: '资产', color: '#00B894' },
    { icon: Utensils, label: '外卖订单', color: '#E17055' },
    { icon: Box, label: '物品管理', color: '#636E72' },
    { icon: Repeat, label: '订阅管理', color: '#0984E3' }
  ]

  const preferences = [
    { icon: Lightbulb, label: '记账偏好' },
    { icon: Palette, label: '个性化' },
    { icon: Zap, label: '快捷指令' }
  ]

  const others = [
    { icon: HelpCircle, label: '帮助' },
    { icon: Phone, label: '联系客服' },
    { icon: Share2, label: '官方媒体' },
    { icon: Share2, label: '分享给朋友' },
    { icon: Info, label: '关于' }
  ]

  return (
    <div className="profile-page">
      {/* 顶部 */}
      <header className="profile-header">
        <button className="icon-btn">
          <ScanLine size={20} />
        </button>
        <button className="icon-btn" onClick={onOpenSettings}>
          <Settings size={20} />
        </button>
      </header>

      <main className="profile-main">
        {/* 用户信息卡片 */}
        <div className="user-card">
          <div className="user-info">
            <div className="avatar-group">
              <div className="avatar my-avatar">我</div>
              <div className="avatar partner-avatar">TA</div>
            </div>
            <div className="user-details">
              <div className="user-name">
                <span>Hi 阿俊 & 小美</span>
                <span className="vip-badge">VIP</span>
              </div>
              <p className="user-days">今天是你们记账的第1天啦😎</p>
            </div>
          </div>
          <ChevronRight size={20} className="arrow" />
        </div>

        {/* 情侣专属功能 */}
        <div className="couple-section">
          <div className="couple-card">
            <div className="couple-icon">💕</div>
            <div className="couple-info">
              <span className="couple-title">情侣专属</span>
              <span className="couple-desc">共同目标 · 纪念日记账 · AA计算器</span>
            </div>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* 功能入口 */}
        <div className="feature-cards">
          <div className="feature-card">
            <Palette size={20} color="#A8D5BA" />
            <div className="feature-text">
              <span className="feature-title">个性化</span>
              <span className="feature-desc">设置独特风格</span>
            </div>
          </div>
          <div className="feature-card">
            <HelpCircle size={20} color="#F4A261" />
            <div className="feature-text">
              <span className="feature-title">帮助中心</span>
              <span className="feature-desc">疑难解答这里找</span>
            </div>
          </div>
        </div>

        {/* 常用功能 */}
        <div className="function-section">
          <h3>常用功能</h3>
          <div className="function-grid">
            {commonFeatures.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="function-item">
                  <div className="function-icon" style={{ background: item.color + '20' }}>
                    <Icon size={20} color={item.color} />
                  </div>
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 账单/资产 */}
        <div className="function-section">
          <h3>账单 / 资产</h3>
          <div className="function-grid">
            {billAssets.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="function-item">
                  <div className="function-icon" style={{ background: item.color + '20' }}>
                    <Icon size={20} color={item.color} />
                  </div>
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 偏好 */}
        <div className="function-section">
          <div className="preference-grid">
            {preferences.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="preference-item">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 其他 */}
        <div className="other-section">
          {others.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="other-item">
                <Icon size={18} color="#636E72" />
                <span>{item.label}</span>
                <ChevronRight size={16} className="arrow" />
              </div>
            )
          })}
        </div>
      </main>

      {/* 悬浮广告 */}
      {showBanner && (
        <div className="banner">
          <div className="banner-content">
            <span className="banner-tag">限定</span>
            <span className="banner-text">会员送好礼</span>
          </div>
          <button className="banner-close" onClick={() => setShowBanner(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 底部导航 */}
      <nav className="bottom-nav">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
