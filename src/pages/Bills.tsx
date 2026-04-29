import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search,
  ChevronDown,
  Filter,
  Edit3,
  Trash2,
  X,
  CheckSquare,
  Square,
  RotateCcw,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import BillDetail from './BillDetail'
import DynamicIsland from '../components/DynamicIsland'
import { type BillItem, fetchBills, updateBill, deleteBill, transformBillsPerspective } from '../lib/bills'
import { fetchAccounts } from '../lib/accounts'
import './Bills.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'
type MemberFilter = 'all' | 'mine' | 'partner' | 'joint'
type SortType = 'time-desc' | 'time-asc' | 'amount-desc' | 'amount-asc' | 'category'
type BillType = 'all' | 'expense' | 'income'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  refreshKey?: number
  onDataChange?: () => void
}

const sortLabels: Record<SortType, string> = {
  'time-desc': '时间 新→旧',
  'time-asc': '时间 旧→新',
  'amount-desc': '金额 高→低',
  'amount-asc': '金额 低→高',
  'category': '按分类'
}

const accounts = fetchAccounts().map(a => a.name)

const expenseCats = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '教育', '其他']
const incomeCats = ['工资', '兼职', '理财', '红包', '其他']

export default function Bills({ activeTab, onTabChange, refreshKey, onDataChange }: Props) {
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortType, setSortType] = useState<SortType>('time-desc')
  const [showFilter, setShowFilter] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // 筛选状态
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [billType, setBillType] = useState<BillType>('all')

  // 筛选抽屉内的临时状态
  const [draftMember, setDraftMember] = useState<MemberFilter>('all')
  const [draftCats, setDraftCats] = useState<Set<string>>(new Set())
  const [draftAmountMin, setDraftAmountMin] = useState('')
  const [draftAmountMax, setDraftAmountMax] = useState('')
  const [draftAccounts, setDraftAccounts] = useState<Set<string>>(new Set())
  const [draftBillType, setDraftBillType] = useState<BillType>('all')
  const [filterCatTab, setFilterCatTab] = useState<'expense' | 'income'>('expense')

  const [bills, setBills] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailBill, setDetailBill] = useState<BillItem | null>(null)
  const [deletedBill, setDeletedBill] = useState<BillItem | null>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [showStatsDetail, setShowStatsDetail] = useState(false)

  // 搜索防抖 300ms
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const handleSearchChange = useCallback((val: string) => {
    setSearchText(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300)
  }, [])

  // 加载账单
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchBills({ member: memberFilter !== 'all' ? memberFilter : undefined, search: debouncedSearch || undefined })
      .then(transformBillsPerspective)
      .then(data => { if (!cancelled) { setBills(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [memberFilter, debouncedSearch, refreshKey])

  // 客户端筛选
  const filteredBills = bills.filter(b => {
    // 类型筛选
    if (billType !== 'all' && b.type !== billType) return false
    // 分类筛选
    if (selectedCats.size > 0 && !selectedCats.has(b.categoryName)) return false
    // 金额范围
    const min = parseFloat(amountMin)
    const max = parseFloat(amountMax)
    if (!isNaN(min) && b.amount < min) return false
    if (!isNaN(max) && b.amount > max) return false
    // 账户筛选
    if (selectedAccounts.size > 0 && !selectedAccounts.has(b.account)) return false
    return true
  })

  // 排序
  const sortedBills = [...filteredBills].sort((a, b) => {
    switch (sortType) {
      case 'time-desc': return b.date.localeCompare(a.date) || b.time.localeCompare(a.time)
      case 'time-asc': return a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
      case 'amount-desc': return b.amount - a.amount
      case 'amount-asc': return a.amount - b.amount
      case 'category': return a.categoryName.localeCompare(b.categoryName)
      default: return 0
    }
  })

  // 按日期分组
  const groupedBills: Record<string, BillItem[]> = {}
  sortedBills.forEach(bill => {
    if (!groupedBills[bill.date]) groupedBills[bill.date] = []
    groupedBills[bill.date].push(bill)
  })

  const totalExpense = filteredBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const totalIncome = filteredBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const totalBillCnt = filteredBills.length

  // 月统计计算
  const nowDate = new Date()
  const currentYear = nowDate.getFullYear()
  const currentMonth = nowDate.getMonth() + 1
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const monthBills = bills.filter(b => b.date.startsWith(monthPrefix))
  const monthExpense = monthBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const monthIncome = monthBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const monthBalance = monthIncome - monthExpense
  const dailyAvg = daysInMonth > 0 ? monthExpense / daysInMonth : 0

  // 筛选标签
  const activeFilters: { label: string; onRemove: () => void }[] = []
  if (memberFilter !== 'all') {
    const labels: Record<string, string> = { mine: '我', partner: 'TA', joint: '共同' }
    activeFilters.push({ label: labels[memberFilter], onRemove: () => setMemberFilter('all') })
  }
  selectedCats.forEach(cat => {
    activeFilters.push({ label: cat, onRemove: () => { const next = new Set(selectedCats); next.delete(cat); setSelectedCats(next) } })
  })
  if (amountMin) activeFilters.push({ label: `≥¥${amountMin}`, onRemove: () => setAmountMin('') })
  if (amountMax) activeFilters.push({ label: `≤¥${amountMax}`, onRemove: () => setAmountMax('') })
  selectedAccounts.forEach(acc => {
    activeFilters.push({ label: acc, onRemove: () => { const next = new Set(selectedAccounts); next.delete(acc); setSelectedAccounts(next) } })
  })
  if (billType !== 'all') {
    activeFilters.push({ label: billType === 'expense' ? '支出' : '收入', onRemove: () => setBillType('all') })
  }

  const memberLabels: Record<string, { text: string; css: string }> = {
    mine: { text: '我', css: 'member-mine' },
    partner: { text: 'TA', css: 'member-partner' },
    joint: { text: '共', css: 'member-joint' }
  }

  const filterTabs: { id: MemberFilter; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'mine', label: '我的' },
    { id: 'partner', label: 'TA的' },
    { id: 'joint', label: '共同' }
  ]

  // 打开筛选时初始化草稿
  const handleOpenFilter = () => {
    setDraftMember(memberFilter)
    setDraftCats(new Set(selectedCats))
    setDraftAmountMin(amountMin)
    setDraftAmountMax(amountMax)
    setDraftAccounts(new Set(selectedAccounts))
    setDraftBillType(billType)
    setShowFilter(true)
  }

  const handleApplyFilter = () => {
    setMemberFilter(draftMember)
    setSelectedCats(draftCats)
    setAmountMin(draftAmountMin)
    setAmountMax(draftAmountMax)
    setSelectedAccounts(draftAccounts)
    setBillType(draftBillType)
    setShowFilter(false)
  }

  const handleResetFilter = () => {
    setDraftMember('all')
    setDraftCats(new Set())
    setDraftAmountMin('')
    setDraftAmountMax('')
    setDraftAccounts(new Set())
    setDraftBillType('all')
    setMemberFilter('all')
    setSelectedCats(new Set())
    setAmountMin('')
    setAmountMax('')
    setSelectedAccounts(new Set())
    setBillType('all')
    setShowFilter(false)
  }

  const toggleDraftCat = (cat: string) => {
    const next = new Set(draftCats)
    if (next.has(cat)) next.delete(cat); else next.add(cat)
    setDraftCats(next)
  }

  const toggleDraftAccount = (acc: string) => {
    const next = new Set(draftAccounts)
    if (next.has(acc)) next.delete(acc); else next.add(acc)
    setDraftAccounts(next)
  }

  // 触摸滑动
  const handleTouchStart = (e: React.TouchEvent, _id: string) => {
    touchStartX.current = e.touches[0].clientX
    setSwipedId(null)
    if (!batchMode) {
      longPressTimer.current = setTimeout(() => {
        setBatchMode(true)
        setSelectedIds(new Set([_id]))
      }, 600)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 60) {
      if (diff > 60) setSwipedId(id)
      else if (diff < -60) setSwipedId(null)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    if (next.size === 0) setBatchMode(false)
    setSelectedIds(next)
  }

  const exitBatchMode = () => {
    setBatchMode(false)
    setSelectedIds(new Set())
  }

  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      try { await deleteBill(id) } catch (e) { console.error('批量删除失败', e) }
    }
    setBills(prev => prev.filter(b => !selectedIds.has(b.id)))
    onDataChange?.()
    exitBatchMode()
  }

  const handleBatchModifyCategory = () => {
    // TODO: 弹出分类选择器批量修改
    exitBatchMode()
  }

  // 编辑/删除
  const handleSaveBill = async (updated: BillItem) => {
    try {
      const result = await updateBill(updated.id, updated)
      setBills(prev => prev.map(b => b.id === result.id ? result : b))
      onDataChange?.()
    } catch (e) { console.error('更新账单失败', e) }
  }

  const handleDeleteBill = async (bill: BillItem) => {
    setDeletedBill(bill)
    try {
      await deleteBill(bill.id)
      setBills(prev => prev.filter(b => b.id !== bill.id))
      onDataChange?.()
    } catch (e) {
      console.error('删除账单失败', e)
      setDeletedBill(null)
      return
    }
    if (undoRef.current) clearTimeout(undoRef.current)
    undoRef.current = setTimeout(() => setDeletedBill(null), 3000)
    setSwipedId(null)
  }

  const handleUndoDelete = () => {
    if (!deletedBill) return
    if (undoRef.current) clearTimeout(undoRef.current)
    const raw = localStorage.getItem('us_ledger_bills')
    const allBills: BillItem[] = raw ? JSON.parse(raw) : []
    allBills.push(deletedBill)
    localStorage.setItem('us_ledger_bills', JSON.stringify(allBills))
    setBills(prev => [deletedBill, ...prev])
    onDataChange?.()
    setDeletedBill(null)
  }

  const handleSwipeEdit = (bill: BillItem) => { setSwipedId(null); setDetailBill(bill) }
  const handleSwipeDelete = (bill: BillItem) => { setSwipedId(null); handleDeleteBill(bill) }

  // 高亮匹配文字
  const highlightText = (text: string) => {
    if (!debouncedSearch) return <>{text}</>
    const idx = text.toLowerCase().indexOf(debouncedSearch.toLowerCase())
    if (idx === -1) return <>{text}</>
    return (
      <>
        {text.slice(0, idx)}
        <mark className="highlight">{text.slice(idx, idx + debouncedSearch.length)}</mark>
        {text.slice(idx + debouncedSearch.length)}
      </>
    )
  }

  return (
    <div className="bills-page">
      <div className="bills-bg"></div>

      <header className="bills-header">
        {showSearch ? (
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜索备注、分类、金额..."
              value={searchText}
              onChange={e => handleSearchChange(e.target.value)}
              autoFocus
            />
            {searchText && (
              <button className="search-clear" onClick={() => handleSearchChange('')}>
                <X size={16} />
              </button>
            )}
            <button className="search-close-btn" onClick={() => { setShowSearch(false); handleSearchChange('') }}>取消</button>
          </div>
        ) : batchMode ? (
          <>
            <h2>已选择 {selectedIds.size} 项</h2>
            <button className="batch-exit" onClick={exitBatchMode}>取消</button>
          </>
        ) : (
          <>
            <h1>账单</h1>
            <div className="header-actions">
              <button className="icon-btn-sm" onClick={() => setShowSearch(true)}>
                <Search size={18} />
              </button>
              <button className="icon-btn-sm" onClick={handleOpenFilter}>
                <Filter size={18} />
                {activeFilters.length > 0 && <span className="filter-dot"></span>}
              </button>
            </div>
          </>
        )}
      </header>

      {/* 收支切换 */}
      <div className="bill-type-tabs">
        <button className={`type-tab-btn ${billType === 'all' ? 'active' : ''}`} onClick={() => setBillType('all')}>全部</button>
        <button className={`type-tab-btn expense ${billType === 'expense' ? 'active' : ''}`} onClick={() => setBillType(billType === 'expense' ? 'all' : 'expense')}>支出</button>
        <button className={`type-tab-btn income ${billType === 'income' ? 'active' : ''}`} onClick={() => setBillType(billType === 'income' ? 'all' : 'income')}>收入</button>
      </div>

      {/* 筛选标签 */}
      {activeFilters.length > 0 && (
        <div className="filter-tags">
          {activeFilters.map((f, i) => (
            <span key={i} className="filter-tag">
              {f.label}
              <button onClick={f.onRemove}><X size={12} /></button>
            </span>
          ))}
          <button className="filter-tag-reset" onClick={() => {
            setMemberFilter('all')
            setSelectedCats(new Set())
            setAmountMin('')
            setAmountMax('')
            setSelectedAccounts(new Set())
            setBillType('all')
          }}>清空</button>
        </div>
      )}

      <main className="bills-main">
        {/* 统计栏 */}
        <div className="bills-stats-bar" onClick={() => setShowStatsDetail(true)}>
          <div className="bills-stat-item">
            <span className="bills-stat-label">月结余</span>
            <span className={`bills-stat-value ${monthBalance >= 0 ? 'positive' : 'negative'}`}>
              ¥{monthBalance.toFixed(2)}
            </span>
          </div>
          <div className="bills-stat-divider"></div>
          <div className="bills-stat-item">
            <span className="bills-stat-label">日均支出</span>
            <span className="bills-stat-value">¥{dailyAvg.toFixed(2)}</span>
          </div>
          <div className="bills-stat-divider"></div>
          <div className="bills-stat-item">
            <span className="bills-stat-label">共{totalBillCnt}笔</span>
            <span className="bills-stat-value">{billType === 'all' ? '' : billType === 'expense' ? '支出' : '收入'} ¥{(billType === 'income' ? totalIncome : totalExpense).toFixed(2)}</span>
          </div>
        </div>

        {/* 计算说明浮层 */}
        {showStatsDetail && (
          <div className="bills-stats-overlay" onClick={() => setShowStatsDetail(false)}>
            <div className="bills-stats-detail" onClick={e => e.stopPropagation()}>
              <div className="sheet-handle"></div>
              <h3>计算说明</h3>
              <div className="stats-detail-row">
                <span className="stats-detail-label">月结余</span>
                <span className="stats-detail-formula">= 月收入 - 月支出</span>
              </div>
              <div className="stats-detail-row">
                <span></span>
                <span className="stats-detail-formula">= ¥{monthIncome.toFixed(2)} - ¥{monthExpense.toFixed(2)}</span>
              </div>
              <div className="stats-detail-row result">
                <span></span>
                <span className={`stats-detail-value ${monthBalance >= 0 ? 'positive' : 'negative'}`}>
                  = ¥{monthBalance >= 0 ? '+' : ''}{monthBalance.toFixed(2)}
                </span>
              </div>
              <div className="stats-detail-divider"></div>
              <div className="stats-detail-row">
                <span className="stats-detail-label">日均支出</span>
                <span className="stats-detail-formula">= 月支出 ÷ 当月天数</span>
              </div>
              <div className="stats-detail-row">
                <span></span>
                <span className="stats-detail-formula">= ¥{monthExpense.toFixed(2)} ÷ {daysInMonth}天</span>
              </div>
              <div className="stats-detail-row result">
                <span></span>
                <span className="stats-detail-value">
                  = ¥{dailyAvg.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 排序 */}
        <div className="sort-bar">
          <button className="sort-btn" onClick={() => setShowSortMenu(!showSortMenu)}>
            {sortType === 'time-asc' || sortType === 'amount-asc' ? <ArrowUp size={14} /> : sortType === 'amount-desc' || sortType === 'time-desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
            <span>{sortLabels[sortType]}</span>
            <ChevronDown size={14} />
          </button>
          {showSortMenu && (
            <>
              <div className="sort-menu-overlay" onClick={() => setShowSortMenu(false)}></div>
              <div className="sort-menu">
                {(Object.keys(sortLabels) as SortType[]).map(key => (
                  <button
                    key={key}
                    className={sortType === key ? 'active' : ''}
                    onClick={() => { setSortType(key); setShowSortMenu(false) }}
                  >
                    {sortLabels[key]}
                    {sortType === key && <span className="sort-check">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 账单列表 */}
        {loading ? (
          <div className="bills-loading">
            <Loader2 size={24} className="spinning" />
            <p>加载中...</p>
          </div>
        ) : sortedBills.length === 0 ? (
          <div className="bills-empty">
            <p>未发现账单哦，试着记一笔~</p>
          </div>
        ) : (
          <div className="bills-list">
            {Object.entries(groupedBills).map(([date, dateBills]) => (
              <div key={date} className="bill-group">
                <div className="bill-date-header">
                  <span>{date}</span>
                  <span className="date-summary">
                    支出 ¥{dateBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0).toFixed(2)}
                    {' '}收入 ¥{dateBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0).toFixed(2)}
                  </span>
                </div>

                {dateBills.map(bill => (
                  <div
                    key={bill.id}
                    className="bill-item-wrapper"
                    onTouchStart={(e) => handleTouchStart(e, bill.id)}
                    onTouchEnd={(e) => handleTouchEnd(e, bill.id)}
                    onTouchMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }}
                  >
                    <div
                      className={`bill-item ${swipedId === bill.id ? 'swiped' : ''} ${batchMode ? 'batch' : ''}`}
                      onClick={() => {
                        if (batchMode) toggleSelect(bill.id)
                        else if (!swipedId) setDetailBill(bill)
                        else setSwipedId(null)
                      }}
                    >
                      {batchMode && (
                        <button className="select-check" onClick={(e) => { e.stopPropagation(); toggleSelect(bill.id) }}>
                          {selectedIds.has(bill.id) ? <CheckSquare size={20} color="#A8D5BA" /> : <Square size={20} color="#B2BEC3" />}
                        </button>
                      )}
                      <span className="bill-cat">{bill.categoryIcon}</span>
                      <div className="bill-info">
                        <span className="bill-cat-name">{highlightText(bill.categoryName)}</span>
                        {bill.note && <span className="bill-note">{highlightText(bill.note)}</span>}
                      </div>
                      <div className="bill-right">
                        <span className={`bill-amount ${bill.type}`}>
                          {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
                        </span>
                        <div className="bill-meta">
                          <span className="bill-account">{bill.account}</span>
                          <span className={`member-tag ${memberLabels[bill.member].css}`}>
                            {memberLabels[bill.member].text}
                          </span>
                        </div>
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
      </main>

      {/* 批量操作栏 */}
      {batchMode && (
        <div className="batch-bar">
          <button className="batch-btn delete" onClick={handleBatchDelete}>批量删除 ({selectedIds.size})</button>
          <button className="batch-btn modify" onClick={handleBatchModifyCategory}>修改分类</button>
          <button className="batch-btn reset" onClick={exitBatchMode}>
            <RotateCcw size={16} />
          </button>
        </div>
      )}

      {/* 筛选抽屉 */}
      {showFilter && (
        <div className="bills-filter-overlay" onClick={() => setShowFilter(false)}>
          <div className="bills-filter-drawer" onClick={e => e.stopPropagation()}>
            <div className="filter-drawer-header">
              <h3>筛选条件</h3>
              <button className="filter-drawer-reset" onClick={handleResetFilter}>重置</button>
            </div>

            <div className="filter-drawer-body">
              {/* 成员 */}
              <div className="filter-section">
                <h4>成员</h4>
                <div className="filter-options">
                  {filterTabs.map(tab => (
                    <button
                      key={tab.id}
                      className={`filter-chip ${draftMember === tab.id ? 'active' : ''}`}
                      onClick={() => setDraftMember(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 类型 */}
              <div className="filter-section">
                <h4>类型</h4>
                <div className="filter-options">
                  {(['all', 'expense', 'income'] as BillType[]).map(t => (
                    <button
                      key={t}
                      className={`filter-chip ${draftBillType === t ? 'active' : ''}`}
                      onClick={() => setDraftBillType(t)}
                    >
                      {t === 'all' ? '全部' : t === 'expense' ? '支出' : '收入'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分类 */}
              <div className="filter-section">
                <h4>分类</h4>
                <div className="filter-cat-tabs">
                  <button className={`cat-tab ${filterCatTab === 'expense' ? 'active' : ''}`} onClick={() => setFilterCatTab('expense')}>支出</button>
                  <button className={`cat-tab ${filterCatTab === 'income' ? 'active' : ''}`} onClick={() => setFilterCatTab('income')}>收入</button>
                </div>
                <div className="filter-options">
                  {(filterCatTab === 'expense' ? expenseCats : incomeCats).map(cat => (
                    <button
                      key={cat}
                      className={`filter-chip ${draftCats.has(cat) ? 'active' : ''}`}
                      onClick={() => toggleDraftCat(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 金额范围 */}
              <div className="filter-section">
                <h4>金额范围</h4>
                <div className="amount-range">
                  <input type="number" placeholder="最小" value={draftAmountMin} onChange={e => setDraftAmountMin(e.target.value)} />
                  <span>—</span>
                  <input type="number" placeholder="最大" value={draftAmountMax} onChange={e => setDraftAmountMax(e.target.value)} />
                </div>
              </div>

              {/* 账户 */}
              <div className="filter-section">
                <h4>账户</h4>
                <div className="filter-options">
                  {accounts.map(acc => (
                    <button
                      key={acc}
                      className={`filter-chip ${draftAccounts.has(acc) ? 'active' : ''}`}
                      onClick={() => toggleDraftAccount(acc)}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-drawer-footer">
              <button className="filter-apply-btn" onClick={handleApplyFilter}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 账单详情 */}
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

      <DynamicIsland activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
