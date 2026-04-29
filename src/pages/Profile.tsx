import { useState, useEffect } from 'react'
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
  X,
  Edit3,
  Image,
  Link2,
  Heart,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react'
import DynamicIsland from '../components/DynamicIsland'
import CategoryManager from './CategoryManager'
import BudgetManager from './BudgetManager'
import LedgerManager from './LedgerManager'
import TagManager from './TagManager'
import BillReport from './BillReport'
import ScheduledTasks from './ScheduledTasks'
import SavingPlan from './SavingPlan'
import ShoppingList from './ShoppingList'
import ExchangeRate from './ExchangeRate'
import Toolbox from './Toolbox'
import Personalization from './Personalization'
import {
  getCoupleProfile,
  saveCoupleProfile,
  getAccountingDays,
  generateInviteCode,
  getInviteCode,
  hasPartner
} from '../lib/couple'
import './Profile.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onOpenSettings: () => void
}

export default function Profile({ activeTab, onTabChange, onOpenSettings }: Props) {
  const [showCouplePage, setShowCouplePage] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showBudgetManager, setShowBudgetManager] = useState(false)
  const [showLedgerManager, setShowLedgerManager] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [showBillReport, setShowBillReport] = useState(false)
  const [showScheduledTasks, setShowScheduledTasks] = useState(false)
  const [showSavingPlan, setShowSavingPlan] = useState(false)
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [showExchangeRate, setShowExchangeRate] = useState(false)
  const [showToolbox, setShowToolbox] = useState(false)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [profile, setProfile] = useState(getCoupleProfile)
  const [editingField, setEditingField] = useState<'myName' | 'partnerName' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false)
  const [unbindStep, setUnbindStep] = useState(0) // 0=初始, 1=二次确认
  const [showInviteSheet, setShowInviteSheet] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  const accountingDays = getAccountingDays()
  const partnerBound = hasPartner()

  useEffect(() => {
    const flag = localStorage.getItem('us_ledger_open_couple')
    if (flag === 'true') {
      localStorage.removeItem('us_ledger_open_couple')
      setShowCouplePage(true)
    }
  }, [])

  const handleEdit = (field: 'myName' | 'partnerName') => {
    setEditingField(field)
    setEditValue(profile[field])
  }

  const handleSaveEdit = () => {
    if (!editValue.trim()) return
    const updated = { ...profile, [editingField!]: editValue.trim() }
    setProfile(updated)
    saveCoupleProfile(updated)
    setEditingField(null)
  }

  const handleUnbind = () => {
    if (unbindStep === 0) {
      setUnbindStep(1)
    } else {
      const updated = { ...profile, partnerName: '', bindDate: '' }
      setProfile(updated)
      saveCoupleProfile(updated)
      setShowUnbindConfirm(false)
      setUnbindStep(0)
    }
  }

  const handleInvite = () => {
    const code = getInviteCode() || generateInviteCode()
    setShowInviteSheet(true)
    setInviteCopied(false)
  }

  const handleCopyCode = async () => {
    const code = getInviteCode() || ''
    try {
      await navigator.clipboard.writeText(code)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    } catch {
      // 回退方案
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    }
  }

  const handleShareCode = async () => {
    const code = getInviteCode() || ''
    const shareText = `快来和我一起记账吧！在 US Ledger 注册时输入我的邀请码：${code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'US Ledger 情侣记账', text: shareText })
      } catch { /* 用户取消 */ }
    } else {
      handleCopyCode()
    }
  }

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
        <div className="user-card" onClick={() => setShowCouplePage(true)}>
          <div className="user-info">
            <div className="avatar-group">
              <div className="avatar my-avatar">我</div>
              <div className="avatar partner-avatar">TA</div>
            </div>
            <div className="user-details">
              <div className="user-name">
                <span>Hi {profile.myName}{partnerBound ? ` & ${profile.partnerName}` : ''}</span>
                <span className="vip-badge">VIP</span>
              </div>
              <p className="user-days">今天是你们记账的第{accountingDays}天啦😎</p>
            </div>
          </div>
          <ChevronRight size={20} className="arrow" />
        </div>

        {/* 情侣专属功能 */}
        <div className="couple-section">
          <div className="couple-card" onClick={() => setShowCouplePage(true)}>
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
          <div className="feature-card" onClick={() => setShowPersonalization(true)}>
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
                <div key={index} className="function-item" onClick={() => {
                  if (item.label === '收支分类') setShowCategoryManager(true)
                  if (item.label === '预算设置') setShowBudgetManager(true)
                  if (item.label === '多账本') setShowLedgerManager(true)
                  if (item.label === '标签') setShowTagManager(true)
                  if (item.label === '存钱') setShowSavingPlan(true)
                  if (item.label === '购物清单') setShowShoppingList(true)
                  if (item.label === '汇率') setShowExchangeRate(true)
                  if (item.label === '小工具') setShowToolbox(true)
                }}>
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
                <div key={index} className="function-item" onClick={() => {
                  if (item.label === '账单报告') setShowBillReport(true)
                  if (item.label === '定时记账') setShowScheduledTasks(true)
                }}>
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
                <div key={index} className="preference-item" onClick={() => {
                  if (item.label === '个性化') setShowPersonalization(true)
                }}>
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

      {/* 我们的资料页 */}
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}

      {showBudgetManager && (
        <BudgetManager onClose={() => setShowBudgetManager(false)} />
      )}

      {showLedgerManager && (
        <LedgerManager onClose={() => setShowLedgerManager(false)} />
      )}

      {showTagManager && (
        <TagManager onClose={() => setShowTagManager(false)} />
      )}

      {showBillReport && (
        <BillReport onClose={() => setShowBillReport(false)} />
      )}

      {showScheduledTasks && (
        <ScheduledTasks onClose={() => setShowScheduledTasks(false)} />
      )}

      {showSavingPlan && (
        <SavingPlan onClose={() => setShowSavingPlan(false)} />
      )}

      {showShoppingList && (
        <ShoppingList onClose={() => setShowShoppingList(false)} />
      )}

      {showExchangeRate && (
        <ExchangeRate onClose={() => setShowExchangeRate(false)} />
      )}

      {showToolbox && (
        <Toolbox onClose={() => setShowToolbox(false)} />
      )}

      {showPersonalization && (
        <Personalization onClose={() => setShowPersonalization(false)} />
      )}

      {showCouplePage && (
        <div className="couple-profile-overlay">
          <div className="couple-profile-page">
            <header className="cp-header">
              <button className="cp-back" onClick={() => { setShowCouplePage(false); setEditingField(null); setShowUnbindConfirm(false); setUnbindStep(0); setShowInviteSheet(false) }}>
                <X size={24} />
              </button>
              <h2>我们的资料</h2>
              <div style={{ width: 40 }}></div>
            </header>

            <div className="cp-body">
              {/* 头像区域 */}
              <div className="cp-avatars">
                <div className="cp-avatar-wrap">
                  <div className="cp-avatar me" onClick={() => handleEdit('myName')}>
                    <Image size={28} color="#FFFFFF" />
                  </div>
                  <span className="cp-avatar-label">
                    {editingField === 'myName' ? (
                      <div className="cp-edit-inline">
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          autoFocus
                          maxLength={10}
                        />
                        <button onClick={handleSaveEdit}>确定</button>
                      </div>
                    ) : (
                      <span onClick={() => handleEdit('myName')} className="cp-editable-name">
                        {profile.myName} <Edit3 size={12} />
                      </span>
                    )}
                  </span>
                </div>
                <span className="cp-heart"><Heart size={24} fill="#E74C3C" color="#E74C3C" /></span>
                <div className="cp-avatar-wrap">
                  <div className="cp-avatar partner">
                    <Image size={28} color="#FFFFFF" />
                  </div>
                  <span className="cp-avatar-label">
                    {editingField === 'partnerName' ? (
                      <div className="cp-edit-inline">
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          autoFocus
                          maxLength={10}
                        />
                        <button onClick={handleSaveEdit}>确定</button>
                      </div>
                    ) : (
                      <span onClick={() => handleEdit('partnerName')} className="cp-editable-name">
                        {profile.partnerName || '添加伴侣'} <Edit3 size={12} />
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="cp-stats">
                <div className="cp-stat-item">
                  <span className="cp-stat-num">{accountingDays}</span>
                  <span className="cp-stat-label">记账天数</span>
                </div>
                <div className="cp-stat-divider"></div>
                <div className="cp-stat-item">
                  <span className="cp-stat-num">{profile.bindDate ? profile.bindDate : '未绑定'}</span>
                  <span className="cp-stat-label">绑定日期</span>
                </div>
              </div>

              {/* 操作区 */}
              <div className="cp-actions">
                {partnerBound ? (
                  <>
                    <button className="cp-action-btn" onClick={handleInvite}>
                      <Link2 size={18} />
                      <span>重新邀请伴侣</span>
                    </button>
                    <button className="cp-action-btn danger" onClick={() => setShowUnbindConfirm(true)}>
                      <AlertTriangle size={18} />
                      <span>解除伴侣关系</span>
                    </button>
                  </>
                ) : (
                  <button className="cp-action-btn invite" onClick={handleInvite}>
                    <Link2 size={18} />
                    <span>邀请伴侣</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 解除确认 */}
          {showUnbindConfirm && (
            <div className="cp-confirm-overlay">
              <div className="cp-confirm-dialog">
                <AlertTriangle size={32} color="#E74C3C" />
                <h3>{unbindStep === 0 ? '确认解除伴侣关系？' : '请再次确认'}</h3>
                <p>{unbindStep === 0
                  ? '解除后，对方将无法查看和编辑你们的共同账单。此操作不可撤销。'
                  : '此操作将立即生效，确定要继续吗？'}</p>
                <div className="cp-confirm-btns">
                  <button className="cp-confirm-cancel" onClick={() => { setShowUnbindConfirm(false); setUnbindStep(0) }}>
                    取消
                  </button>
                  <button className="cp-confirm-danger" onClick={handleUnbind}>
                    {unbindStep === 0 ? '确认解除' : '最终确认'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 邀请伴侣弹窗 */}
          {showInviteSheet && (
            <div className="cp-invite-overlay" onClick={() => setShowInviteSheet(false)}>
              <div className="cp-invite-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle"></div>
                <h3>邀请伴侣一起记账</h3>
                <p className="invite-desc">让对方在注册时输入此邀请码，即可自动建立伴侣关系</p>
                <div className="invite-code-display">
                  <span className="invite-code">{getInviteCode()}</span>
                </div>
                <div className="invite-btns">
                  <button className="invite-btn copy" onClick={handleCopyCode}>
                    {inviteCopied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{inviteCopied ? '已复制' : '复制邀请码'}</span>
                  </button>
                  <button className="invite-btn share" onClick={handleShareCode}>
                    <Share2 size={18} />
                    <span>分享给伴侣</span>
                  </button>
                </div>
                <button className="invite-close" onClick={() => setShowInviteSheet(false)}>关闭</button>
              </div>
            </div>
          )}
        </div>
      )}

      <DynamicIsland activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
