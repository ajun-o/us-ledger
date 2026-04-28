import { useState, useEffect, useRef } from 'react'
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  FileText,
  BarChart3,
  User,
  X,
  Edit3,
  Trash2
} from 'lucide-react'
import BillDetail from './BillDetail'
import { type BillItem, fetchBills, updateBill, deleteBill, fetchMonthStats } from '../lib/bills'
import './Home.css'

type ViewMode = 'mine' | 'partner' | 'joint'
type TabType = 'home' | 'bills' | 'reports' | 'profile'

interface Props {
  theme: string | null
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddRecord: () => void
  onGoAssets: () => void
  refreshKey?: number
  onDataChange?: () => void
}

const EYE_KEY = 'us_ledger_show_amount'

export default function Home({ theme, activeTab, onTabChange, onAddRecord, onGoAssets, refreshKey, onDataChange }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('joint')
  const [showAmount, setShowAmount] = useState(() => {
    return localStorage.getItem(EYE_KEY) !== 'false'
  })
  const [showBanner, setShowBanner] = useState(true)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [hasPartner] = useState(false)
  const [animatingAmount, setAnimatingAmount] = useState(false)

  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)
  const [detailBill, setDetailBill] = useState<BillItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BillItem | null>(null)

  const [monthStats, setMonthStats] = useState({ totalExpense: 0, totalIncome: 0 })
  const [recentBills, setRecentBills] = useState<BillItem[]>([])

  // 从 Supabase 加载数据
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const today = new Date()
        const y = today.getFullYear()
        const m = String(today.getMonth() + 1).padStart(2, '0')
        const d = String(today.getDate()).padStart(2, '0')
        const threeDaysAgo = new Date(today)
        threeDaysAgo.setDate(today.getDate() - 3)
        const startDate = `${threeDaysAgo.getFullYear()}-${String(threeDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgo.getDate()).padStart(2, '0')}`

        const [stats, bills] = await Promise.all([
          fetchMonthStats(),
          fetchBills({ startDate, endDate: `${y}-${m}-${d}`, limit: 50 })
        ])

        if (!cancelled) {
          setMonthStats({ totalExpense: stats.totalExpense, totalIncome: stats.totalIncome })
          setRecentBills(bills)
        }
      } catch (e) {
        console.error('加载首页数据失败', e)
      }
    }

    load()
    return () => { cancelled = true }
  }, [refreshKey])

  // 按日期分组
  const groupedBills: Record<string, BillItem[]> = {}
  recentBills.forEach(bill => {
    if (!groupedBills[bill.date]) groupedBills[bill.date] = []
    groupedBills[bill.date].push(bill)
  })

  const dateLabels: Record<string, string> = {
    '2026-04-28': '今天',
    '2026-04-27': '昨天',
    '2026-04-26': '前天'
  }

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX
    setSwipedId(null)
  }

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 60) {
      setSwipedId(id)
    } else if (diff < -60) {
      setSwipedId(null)
    }
  }

  const handleSaveBill = async (updated: BillItem) => {
    try {
      const result = await updateBill(updated.id, updated)
      setRecentBills(prev => prev.map(b => b.id === result.id ? result : b))
      onDataChange?.()
    } catch (e) {
      console.error('更新账单失败', e)
    }
  }

  const handleDeleteBill = async (id: string) => {
    try {
      await deleteBill(id)
      setRecentBills(prev => prev.filter(b => b.id !== id))
      onDataChange?.()
    } catch (e) {
      console.error('删除账单失败', e)
    }
    setDeleteTarget(null)
  }

  const handleSwipeEdit = (bill: BillItem) => {
    setSwipedId(null)
    setDetailBill(bill)
  }

  const handleSwipeDelete = (bill: BillItem) => {
    setSwipedId(null)
    setDeleteTarget(bill)
  }

  // 动态数据（按 viewMode 分配，当前简化为全部展示）
  const currentData = {
    expense: monthStats.totalExpense.toFixed(2),
    income: monthStats.totalIncome.toFixed(2),
    balance: (monthStats.totalIncome - monthStats.totalExpense).toFixed(2)
  }

  const memberLabels: Record<string, { text: string; className: string }> = {
    mine: { text: '我', className: 'member-mine' },
    partner: { text: 'TA', className: 'member-partner' },
    joint: { text: '共', className: 'member-joint' }
  }

  const viewModes: ViewMode[] = ['mine', 'partner', 'joint']
  const viewLabels: Record<ViewMode, string> = {
    mine: '我的账单',
    partner: 'TA的账单',
    joint: '共同账单'
  }
  const viewIcons: Record<ViewMode, string> = {
    mine: '👤',
    partner: '💕',
    joint: '🤝'
  }
  const viewSubtitles: Record<ViewMode, string> = {
    mine: '只看我记的账单',
    partner: hasPartner ? '查看TA的账单' : '未绑定伴侣',
    joint: '两人共同的账单'
  }

  useEffect(() => {
    localStorage.setItem(EYE_KEY, String(showAmount))
  }, [showAmount])

  const handleViewChange = (direction: 'left' | 'right') => {
    const currentIndex = viewModes.indexOf(viewMode)
    let newIndex = currentIndex
    if (direction === 'left' && currentIndex > 0) newIndex = currentIndex - 1
    else if (direction === 'right' && currentIndex < viewModes.length - 1) newIndex = currentIndex + 1
    if (newIndex === currentIndex) return

    setAnimatingAmount(true)
    setViewMode(viewModes[newIndex])
    setTimeout(() => setAnimatingAmount(false), 300)
  }

  const handleSelectView = (mode: ViewMode) => {
    if (mode === 'partner' && !hasPartner) return
    setAnimatingAmount(true)
    setViewMode(mode)
    setShowViewSheet(false)
    setTimeout(() => setAnimatingAmount(false), 300)
  }

  const tabs = [
    { id: 'home' as TabType, icon: Wallet, label: '主页' },
    { id: 'bills' as TabType, icon: FileText, label: '账单' },
    { id: 'reports' as TabType, icon: BarChart3, label: '报表' },
    { id: 'profile' as TabType, icon: User, label: '我的' }
  ]

  return (
    <div className={`home-page ${theme || ''}`}>
      <div className="page-bg"></div>

      {/* 顶部 */}
      <header className="home-header">
        <div className="logo">US</div>
        <button className="asset-btn" onClick={onGoAssets}>
          <Wallet size={20} />
          <span>资产</span>
        </button>
      </header>

      <main className="home-main">
        {/* 资产卡片 */}
        <div className="asset-card">
          {/* 视角导航 */}
          <div className="card-nav">
            <button
              className="nav-arrow"
              onClick={() => handleViewChange('left')}
              disabled={viewMode === 'mine'}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="view-indicator" onClick={() => setShowViewSheet(true)}>
              <span className="view-icon">{viewIcons[viewMode]}</span>
              <span className="view-label">{viewLabels[viewMode]}</span>
            </div>

            <button
              className="nav-arrow"
              onClick={() => handleViewChange('right')}
              disabled={viewMode === 'joint'}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 月份 */}
          <div className="month-selector">
            <span>2026年4月</span>
            <ChevronRight size={14} />
          </div>

          {/* 支出标题 */}
          <div className="expense-header">
            <span className="expense-tag">本月支出(元)</span>
          </div>

          {/* 金额显示 */}
          <div className={`amount-display ${animatingAmount ? 'animating' : ''}`}>
            <span className="currency">¥</span>
            <span className="amount">{showAmount ? currentData.expense : '****'}</span>
            <button
              className="eye-btn"
              onClick={() => setShowAmount(!showAmount)}
            >
              {showAmount ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* 收入和结余 */}
          <div className="income-info">
            <div className="info-item">
              <span className="info-label">本月收入</span>
              <span className="info-value income">{showAmount ? currentData.income : '****'}</span>
            </div>
            <div className="info-divider"></div>
            <div className="info-item">
              <span className="info-label">月结余</span>
              <span className="info-value">{showAmount ? currentData.balance : '****'}</span>
            </div>
          </div>

          {/* 记一笔按钮 */}
          <button className="add-record-btn" onClick={onAddRecord}>
            <Plus size={20} />
            <span>记一笔</span>
          </button>

          {/* 视图指示器 */}
          <div className="view-dots">
            {viewModes.map((mode) => (
              <span
                key={mode}
                className={`dot ${viewMode === mode ? 'active' : ''}`}
              ></span>
            ))}
          </div>
        </div>

        {/* 近3日账单 */}
        <div className="recent-bills">
          <div className="section-header">
            <h2>近3日账单</h2>
            <button className="filter-btn" onClick={() => onTabChange('bills')}>
              <span>按时间</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {recentBills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <div className="empty-book">
                  <div className="book-cover"></div>
                  <div className="book-pages">
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="empty-decoration dec-1">✨</div>
                <div className="empty-decoration dec-2">💰</div>
              </div>
              <p className="empty-text">3日内暂无账单，试着记一笔~</p>
            </div>
          ) : (
            <div className="bills-list">
              {Object.entries(groupedBills).map(([date, bills]) => (
                <div key={date} className="bill-group">
                  <div className="bill-date-header">
                    <span className="date-label">{dateLabels[date] || date}</span>
                    <span className="date-expense">
                      支出 ¥{bills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0).toFixed(2)}
                    </span>
                    <span className="date-income">
                      收入 ¥{bills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  {bills.map(bill => (
                    <div
                      key={bill.id}
                      className="bill-item-wrapper"
                      onTouchStart={(e) => handleTouchStart(e, bill.id)}
                      onTouchEnd={(e) => handleTouchEnd(e, bill.id)}
                    >
                      <div
                        className={`bill-item ${swipedId === bill.id ? 'swiped' : ''}`}
                        onClick={() => setDetailBill(bill)}
                      >
                        <span className="bill-cat">{bill.categoryIcon}</span>
                        <div className="bill-info">
                          <span className="bill-cat-name">{bill.categoryName}</span>
                          {bill.note && <span className="bill-note">{bill.note}</span>}
                        </div>
                        <div className="bill-right">
                          <span className={`bill-amount ${bill.type}`}>
                            {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
                          </span>
                          <span className={`member-tag ${memberLabels[bill.member].className}`}>
                            {memberLabels[bill.member].text}
                          </span>
                        </div>
                      </div>
                      <div className="bill-actions">
                        <button className="action-edit" onClick={() => handleSwipeEdit(bill)}>
                          <Edit3 size={16} />
                          <span>编辑</span>
                        </button>
                        <button className="action-delete" onClick={() => handleSwipeDelete(bill)}>
                          <Trash2 size={16} />
                          <span>删除</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
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

      {/* 账单详情弹窗 */}
      {detailBill && (
        <BillDetail
          bill={detailBill}
          onClose={() => setDetailBill(null)}
          onSave={handleSaveBill}
          onDelete={(id) => { setDetailBill(null); handleDeleteBill(id) }}
        />
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-confirm" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">确认删除</p>
            <p className="confirm-desc">删除后无法恢复，确定要删除这笔账单吗？</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="confirm-btn confirm" onClick={() => handleDeleteBill(deleteTarget.id)}>确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 视角选择底部弹窗 */}
      {showViewSheet && (
        <div className="view-sheet-overlay" onClick={() => setShowViewSheet(false)}>
          <div className="view-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h3>选择视角</h3>
            {viewModes.map(mode => (
              <button
                key={mode}
                className={`view-sheet-item ${viewMode === mode ? 'active' : ''} ${mode === 'partner' && !hasPartner ? 'disabled' : ''}`}
                onClick={() => handleSelectView(mode)}
                disabled={mode === 'partner' && !hasPartner}
              >
                <div className="view-sheet-left">
                  <span className="view-sheet-icon">{viewIcons[mode]}</span>
                  <div className="view-sheet-text">
                    <span className="view-sheet-label">{viewLabels[mode]}</span>
                    <span className="view-sheet-sub">{viewSubtitles[mode]}</span>
                  </div>
                </div>
                {mode === viewMode && (
                  <span className="view-sheet-check">✓</span>
                )}
                {mode === 'partner' && !hasPartner && (
                  <span className="view-sheet-lock">🔒</span>
                )}
              </button>
            ))}
            {/* 伴侣信息 */}
            <div className="view-sheet-couple">
              <div className="couple-row">
                <div className="couple-ava me">我</div>
                <span className="couple-name">阿俊</span>
                {hasPartner ? (
                  <>
                    <span className="couple-heart">♥</span>
                    <div className="couple-ava partner">TA</div>
                    <span className="couple-name">小美</span>
                  </>
                ) : (
                  <>
                    <span className="couple-heart dim">♥</span>
                    <div className="couple-ava empty">+</div>
                    <span className="couple-name dim">邀请伴侣</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
