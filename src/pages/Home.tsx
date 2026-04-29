import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  Edit3,
  Trash2,
  RotateCw,
  WifiOff
} from 'lucide-react'
import BillDetail from './BillDetail'
import MonthPicker from './MonthPicker'
import DynamicIsland from '../components/DynamicIsland'
import { type BillItem, fetchBills, updateBill, deleteBill, fetchMonthStats, transformBillsPerspective } from '../lib/bills'
import { getCoupleProfile, syncCoupleFromSupabase } from '../lib/couple'
import './Home.css'

type ViewMode = 'mine' | 'partner' | 'joint'
type TabType = 'home' | 'bills' | 'reports' | 'profile'

interface Props {
  theme: string | null
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddRecord: (defaultMember?: 'mine' | 'partner' | 'joint') => void
  onGoAssets: () => void
  refreshKey?: number
  onDataChange?: () => void
}

const EYE_KEY = 'us_ledger_show_amount'

export default function Home({ theme, activeTab, onTabChange, onAddRecord, onGoAssets, refreshKey, onDataChange }: Props) {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('joint')
  const [showAmount, setShowAmount] = useState(() => {
    return localStorage.getItem(EYE_KEY) !== 'false'
  })
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [coupleProfile, setCoupleProfile] = useState(getCoupleProfile)
  const hasPartnerBound = !!coupleProfile.partnerName
  const [animatingAmount, setAnimatingAmount] = useState(false)

  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)
  const cardTouchStartX = useRef(0)
  const [detailBill, setDetailBill] = useState<BillItem | null>(null)
  const [deletedBill, setDeletedBill] = useState<BillItem | null>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // 下拉刷新
  type PullState = 'idle' | 'pulling' | 'refreshing' | 'complete' | 'error'
  const [pullDistance, setPullDistance] = useState(0)
  const [pullState, setPullState] = useState<PullState>('idle')
  const pullStartY = useRef(0)
  const lastRefreshTime = useRef(0)
  const pullContainerRef = useRef<HTMLDivElement>(null)
  const PULL_THRESHOLD = 60
  const COOLDOWN_MS = 3000

  const [monthStats, setMonthStats] = useState({ totalExpense: 0, totalIncome: 0 })
  const [recentBills, setRecentBills] = useState<BillItem[]>([])

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      const m = String(selectedMonth).padStart(2, '0')
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const endDate = `${selectedYear}-${m}-${String(lastDay).padStart(2, '0')}`
      const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
      let startDate: string
      if (isCurrentMonth) {
        const today = now.getDate()
        const threeDaysAgo = new Date(now)
        threeDaysAgo.setDate(today - 3)
        startDate = `${threeDaysAgo.getFullYear()}-${String(threeDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgo.getDate()).padStart(2, '0')}`
      } else {
        startDate = `${selectedYear}-${m}-${String(Math.max(1, lastDay - 3)).padStart(2, '0')}`
      }

      const [stats, bills] = await Promise.all([
        fetchMonthStats(selectedYear, selectedMonth),
        fetchBills({ startDate, endDate, limit: 50 })
      ])

      const transformedBills = await transformBillsPerspective(bills)

      setMonthStats({ totalExpense: stats.totalExpense, totalIncome: stats.totalIncome })
      setRecentBills(transformedBills)
      return true
    } catch (e) {
      console.error('加载首页数据失败', e)
      return false
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    loadData()
  }, [refreshKey, loadData])

  useEffect(() => {
    syncCoupleFromSupabase().then(() => {
      setCoupleProfile(getCoupleProfile())
    }).catch(() => {})
  }, [])

  // 下拉刷新处理
  const handlePullStart = useCallback((e: React.TouchEvent) => {
    // 只在页面顶部且空闲状态时响应
    if (pullState !== 'idle') return
    const el = pullContainerRef.current
    if (el && el.scrollTop > 0) return
    pullStartY.current = e.touches[0].clientY
  }, [pullState])

  const handlePullMove = useCallback((e: React.TouchEvent) => {
    if (pullState !== 'idle') return
    const el = pullContainerRef.current
    if (el && el.scrollTop > 0) return
    const diff = e.touches[0].clientY - pullStartY.current
    if (diff > 0) {
      // 阻尼效果：越拉越慢
      const damped = Math.min(diff * 0.5, 120)
      setPullDistance(damped)
      setPullState(diff > 0 ? 'pulling' : 'idle')
    }
  }, [pullState])

  const handlePullEnd = useCallback(async () => {
    if (pullState !== 'pulling') {
      setPullDistance(0)
      return
    }

    // 3秒冷却检查
    const now = Date.now()
    if (now - lastRefreshTime.current < COOLDOWN_MS) {
      setPullDistance(0)
      setPullState('idle')
      return
    }

    if (pullDistance >= PULL_THRESHOLD) {
      // 检查网络
      if (!navigator.onLine) {
        setPullState('error')
        setTimeout(() => {
          setPullDistance(0)
          setPullState('idle')
        }, 2000)
        return
      }

      setPullState('refreshing')
      lastRefreshTime.current = now

      const ok = await loadData()
      if (ok) {
        setPullState('complete')
        setTimeout(() => {
          setPullDistance(0)
          setPullState('idle')
        }, 1500)
      } else {
        setPullState('error')
        setTimeout(() => {
          setPullDistance(0)
          setPullState('idle')
        }, 2000)
      }
    } else {
      setPullDistance(0)
      setPullState('idle')
    }
  }, [pullState, pullDistance, loadData])

  // 按视角过滤账单（member 标签已经过 transformBillsPerspective 转换）
  // "共同" 视图显示所有可见账单（我的+TA的+共同标记的），作为聚合视图
  const filteredBills = recentBills.filter(bill => {
    if (viewMode === 'mine') return bill.member === 'mine'
    if (viewMode === 'partner') return bill.member === 'partner'
    return true // joint 视图：显示全部
  })

  // 按日期分组
  const groupedBills: Record<string, BillItem[]> = {}
  filteredBills.forEach(bill => {
    if (!groupedBills[bill.date]) groupedBills[bill.date] = []
    groupedBills[bill.date].push(bill)
  })

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(now.getDate() - 1)
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`
  const twoDaysAgoDate = new Date(now)
  twoDaysAgoDate.setDate(now.getDate() - 2)
  const twoDaysAgoStr = `${twoDaysAgoDate.getFullYear()}-${String(twoDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgoDate.getDate()).padStart(2, '0')}`

  const dateLabels: Record<string, string> = {
    [todayStr]: '今天',
    [yesterdayStr]: '昨天',
    [twoDaysAgoStr]: '前天'
  }

  const handleTouchStart = (e: React.TouchEvent, _id: string) => {
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

  const handleDeleteBill = async (bill: BillItem) => {
    // 保存账单数据用于撤销
    setDeletedBill(bill)
    try {
      await deleteBill(bill.id)
      setRecentBills(prev => prev.filter(b => b.id !== bill.id))
      onDataChange?.()
    } catch (e) {
      console.error('删除账单失败', e)
      setDeletedBill(null)
      return
    }
    // 3秒后清除撤销状态
    if (undoRef.current) clearTimeout(undoRef.current)
    undoRef.current = setTimeout(() => setDeletedBill(null), 3000)
    setSwipedId(null)
  }

  const handleUndoDelete = () => {
    if (!deletedBill) return
    if (undoRef.current) clearTimeout(undoRef.current)
    // 直接恢复到 localStorage
    const raw = localStorage.getItem('us_ledger_bills')
    const bills: BillItem[] = raw ? JSON.parse(raw) : []
    bills.push(deletedBill)
    localStorage.setItem('us_ledger_bills', JSON.stringify(bills))
    setRecentBills(prev => [deletedBill, ...prev])
    onDataChange?.()
    setDeletedBill(null)
  }

  const handleSwipeEdit = (bill: BillItem) => {
    setSwipedId(null)
    setDetailBill(bill)
  }

  const handleSwipeDelete = (bill: BillItem) => {
    setSwipedId(null)
    handleDeleteBill(bill)
  }

  // 按当前视角计算卡片金额
  const viewExpense = filteredBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const viewIncome = filteredBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const currentData = {
    expense: viewExpense.toFixed(2),
    income: viewIncome.toFixed(2),
    balance: (viewIncome - viewExpense).toFixed(2)
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
    partner: hasPartnerBound ? '查看TA的账单' : '未绑定伴侣',
    joint: '两人的全部账单'
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
    const target = viewModes[newIndex]
    if (target === 'partner' && !hasPartnerBound) return

    setAnimatingAmount(true)
    setViewMode(target)
    setTimeout(() => setAnimatingAmount(false), 300)
  }

  const handleSelectView = (mode: ViewMode) => {
    if (mode === 'partner' && !hasPartnerBound) return
    setAnimatingAmount(true)
    setViewMode(mode)
    setShowViewSheet(false)
    setTimeout(() => setAnimatingAmount(false), 300)
  }

  const handleCardTouchStart = (e: React.TouchEvent) => {
    cardTouchStartX.current = e.touches[0].clientX
  }

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    const diff = cardTouchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return
    const currentIdx = viewModes.indexOf(viewMode)
    if (diff > 0 && currentIdx < viewModes.length - 1) {
      // 左滑 → 下一个
      const next = viewModes[currentIdx + 1]
      if (next === 'partner' && !hasPartnerBound) return
      setAnimatingAmount(true)
      setViewMode(next)
      setTimeout(() => setAnimatingAmount(false), 300)
    } else if (diff < 0 && currentIdx > 0) {
      // 右滑 → 上一个
      const prev = viewModes[currentIdx - 1]
      if (prev === 'partner' && !hasPartnerBound) return
      setAnimatingAmount(true)
      setViewMode(prev)
      setTimeout(() => setAnimatingAmount(false), 300)
    }
  }

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

      <main
        className="home-main"
        ref={pullContainerRef}
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
      >
        {/* 下拉刷新指示器 */}
        <div
          className={`pull-indicator ${pullState}`}
          style={{
            height: pullState === 'idle' ? `${pullDistance}px` : (pullState === 'refreshing' || pullState === 'complete' || pullState === 'error' ? '60px' : `${pullDistance}px`),
            opacity: pullDistance > 0 || pullState !== 'idle' ? 1 : 0
          }}
        >
          <div className="pull-indicator-inner">
            {pullState === 'refreshing' && (
              <>
                <RotateCw size={18} className="pull-spinner" />
                <span className="pull-text">正在刷新...</span>
              </>
            )}
            {pullState === 'complete' && (
              <span className="pull-text complete">✓ 已更新</span>
            )}
            {pullState === 'error' && (
              <>
                <WifiOff size={18} />
                <span className="pull-text error">无网络，请检查连接</span>
              </>
            )}
            {pullState === 'pulling' && pullDistance >= PULL_THRESHOLD && (
              <span className="pull-text ready">松开立即刷新</span>
            )}
            {pullState === 'pulling' && pullDistance < PULL_THRESHOLD && pullDistance > 0 && (
              <span className="pull-text hint">继续下拉刷新</span>
            )}
          </div>
        </div>

        {/* 资产卡片 */}
        <div
          className="asset-card"
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
        >
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
          <button className="month-selector" onClick={() => setShowMonthPicker(true)}>
            <span>{selectedYear}年{selectedMonth}月</span>
            <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
          </button>

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
          <button className="add-record-btn" onClick={() => onAddRecord()}>
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

        {/* 未绑定伴侣横幅 */}
        {!hasPartnerBound && (
          <div className="partner-banner" onClick={() => onTabChange('profile')}>
            <div className="partner-banner-icon">💑</div>
            <div className="partner-banner-text">
              <span className="partner-banner-title">邀请伴侣，开启双人记账</span>
              <span className="partner-banner-sub">和TA一起管理财务，记账更有趣</span>
            </div>
            <div className="partner-banner-arrow">›</div>
          </div>
        )}

        {/* 近3日账单 */}
        <div className="recent-bills">
          <div className="section-header">
            <h2>近3日账单</h2>
            <button className="filter-btn" onClick={() => onTabChange('bills')}>
              <span>按时间</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {filteredBills.length === 0 ? (
            <div className="empty-state" onClick={() => onAddRecord(viewMode)}>
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

      <DynamicIsland activeTab={activeTab} onTabChange={onTabChange} />

      {/* 账单详情弹窗 */}
      {detailBill && (
        <BillDetail
          bill={detailBill}
          onClose={() => setDetailBill(null)}
          onSave={handleSaveBill}
          onDelete={(bill) => { setDetailBill(null); handleDeleteBill(bill) }}
        />
      )}

      {/* 删除撤销条 */}
      {deletedBill && (
        <div className="undo-bar">
          <span className="undo-text">已删除 1 笔账单</span>
          <button className="undo-btn" onClick={handleUndoDelete}>撤销</button>
        </div>
      )}

      {/* 月份选择器 */}
      {showMonthPicker && (
        <MonthPicker
          year={selectedYear}
          month={selectedMonth}
          onConfirm={(y, m) => { setSelectedYear(y); setSelectedMonth(m); setShowMonthPicker(false) }}
          onClose={() => setShowMonthPicker(false)}
        />
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
                className={`view-sheet-item ${viewMode === mode ? 'active' : ''} ${mode === 'partner' && !hasPartnerBound ? 'disabled' : ''}`}
                onClick={() => handleSelectView(mode)}
                disabled={mode === 'partner' && !hasPartnerBound}
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
                {mode === 'partner' && !hasPartnerBound && (
                  <span className="view-sheet-lock">🔒</span>
                )}
              </button>
            ))}
            {/* 伴侣信息 */}
            <div className="view-sheet-couple">
              <div className="couple-row">
                <div className="couple-ava me">我</div>
                <span className="couple-name">{coupleProfile.myName}</span>
                {hasPartnerBound ? (
                  <>
                    <span className="couple-heart">♥</span>
                    <div className="couple-ava partner">TA</div>
                    <span className="couple-name">{coupleProfile.partnerName}</span>
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
