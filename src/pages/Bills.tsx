import { useState, useRef, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  Filter,
  Clock,
  TrendingUp,
  Wallet,
  Edit3,
  Trash2,
  X,
  CheckSquare,
  Square,
  RotateCcw,
  Loader2
} from 'lucide-react'
import BillDetail from './BillDetail'
import { type BillItem, fetchBills, updateBill, deleteBill } from '../lib/bills'
import './Bills.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'
type MemberFilter = 'all' | 'mine' | 'partner' | 'joint'
type SortType = 'time' | 'amount' | 'category'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  refreshKey?: number
  onDataChange?: () => void
}

export default function Bills({ activeTab, onTabChange, refreshKey, onDataChange }: Props) {
  const [currentMonth] = useState('2026年4月')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortType, setSortType] = useState<SortType>('time')
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all')
  const [showFilter, setShowFilter] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)

  const [bills, setBills] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailBill, setDetailBill] = useState<BillItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BillItem | null>(null)

  // 从 Supabase 加载账单
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchBills({ member: memberFilter, search: searchText || undefined })
      .then(data => { if (!cancelled) { setBills(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [memberFilter, refreshKey])

  // 筛选
  const filteredBills = bills
    .filter(b => memberFilter === 'all' || b.member === memberFilter)
    .filter(b => !searchText || b.note.includes(searchText) || b.categoryName.includes(searchText) || String(b.amount).includes(searchText))

  // 按日期分组
  const groupedBills: Record<string, BillItem[]> = {}
  filteredBills.forEach(bill => {
    if (!groupedBills[bill.date]) groupedBills[bill.date] = []
    groupedBills[bill.date].push(bill)
  })

  const totalExpense = filteredBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const totalBillCnt = filteredBills.length

  const memberLabels: Record<string, { text: string; css: string }> = {
    mine: { text: '我', css: 'member-mine' },
    partner: { text: 'TA', css: 'member-partner' },
    joint: { text: '共', css: 'member-joint' }
  }

  const sortLabels: Record<SortType, string> = {
    time: '按时间',
    amount: '按金额',
    category: '按分类'
  }

  const filterTabs: { id: MemberFilter; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'mine', label: '我的' },
    { id: 'partner', label: 'TA的' },
    { id: 'joint', label: '共同' }
  ]

  const handleSortChange = (type: SortType) => {
    setSortType(type)
    setShowSortMenu(false)
  }

  const handleTouchStart = (e: React.TouchEvent, _id: string) => {
    touchStartX.current = e.touches[0].clientX
    setSwipedId(null)
  }

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 60) setSwipedId(id)
    else if (diff < -60) setSwipedId(null)
  }

  const handleLongPress = (id: string) => {
    if (!batchMode) {
      setBatchMode(true)
      setSelectedIds(new Set([id]))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (next.size === 0) setBatchMode(false)
    setSelectedIds(next)
  }

  const exitBatchMode = () => {
    setBatchMode(false)
    setSelectedIds(new Set())
  }

  const handleSaveBill = async (updated: BillItem) => {
    try {
      const result = await updateBill(updated.id, updated)
      setBills(prev => prev.map(b => b.id === result.id ? result : b))
      onDataChange?.()
    } catch (e) {
      console.error('更新账单失败', e)
    }
  }

  const handleDeleteBill = async (id: string) => {
    try {
      await deleteBill(id)
      setBills(prev => prev.filter(b => b.id !== id))
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

  const tabs = [
    { id: 'home' as TabType, icon: Wallet, label: '主页' },
    { id: 'bills' as TabType, icon: Clock, label: '账单' },
    { id: 'reports' as TabType, icon: TrendingUp, label: '报表' },
    { id: 'profile' as TabType, icon: TrendingUp, label: '我的' }
  ]

  return (
    <div className="bills-page">
      <div className="bills-bg"></div>

      {/* 顶部 */}
      <header className="bills-header">
        {showSearch ? (
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索备注、分类、金额..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              autoFocus
            />
            <button className="search-close" onClick={() => { setShowSearch(false); setSearchText('') }}>
              <X size={18} />
            </button>
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
              <button className="icon-btn-sm" onClick={() => setShowFilter(true)}>
                <Filter size={18} />
              </button>
            </div>
          </>
        )}
      </header>

      <main className="bills-main">
        {/* 成员筛选 */}
        <div className="member-filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              className={`filter-tab-btn ${memberFilter === tab.id ? 'active' : ''}`}
              onClick={() => setMemberFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 月份和排序 */}
        <div className="month-filter-bar">
          <button className="month-selector">
            <span>{currentMonth}</span>
            <ChevronDown size={16} />
          </button>
          <div className="sort-selector">
            <button className="sort-btn" onClick={() => setShowSortMenu(!showSortMenu)}>
              <span>{sortLabels[sortType]}</span>
              <ChevronDown size={14} />
            </button>
            {showSortMenu && (
              <div className="sort-menu" onClick={() => setShowSortMenu(false)}>
                <button onClick={() => handleSortChange('time')}>按时间</button>
                <button onClick={() => handleSortChange('amount')}>按金额</button>
                <button onClick={() => handleSortChange('category')}>按分类</button>
              </div>
            )}
          </div>
        </div>

        {/* 筛选结果汇总 */}
        <div className="filter-summary">
          <span>共 {totalBillCnt} 笔</span>
          <span>合计支出 ¥{totalExpense.toFixed(2)}</span>
        </div>

        {/* 账单列表 */}
        {loading ? (
          <div className="bills-loading">
            <Loader2 size={24} className="spinning" />
            <p>加载中...</p>
          </div>
        ) : filteredBills.length === 0 ? (
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
                  >
                    <div
                      className={`bill-item ${swipedId === bill.id ? 'swiped' : ''} ${batchMode ? 'batch' : ''}`}
                      onContextMenu={(e) => { e.preventDefault(); handleLongPress(bill.id) }}
                      onClick={() => !batchMode && setDetailBill(bill)}
                    >
                      {batchMode && (
                        <button className="select-check" onClick={() => toggleSelect(bill.id)}>
                          {selectedIds.has(bill.id) ? <CheckSquare size={20} color="#A8D5BA" /> : <Square size={20} color="#B2BEC3" />}
                        </button>
                      )}
                      <span className="bill-cat">{bill.categoryIcon}</span>
                      <div className="bill-info">
                        <span className="bill-cat-name">{bill.categoryName}</span>
                        {bill.note && <span className="bill-note">{bill.note}</span>}
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
          <button className="batch-btn delete" onClick={exitBatchMode}>批量删除</button>
          <button className="batch-btn modify" onClick={exitBatchMode}>修改分类</button>
          <button className="batch-btn reset" onClick={exitBatchMode}>
            <RotateCcw size={16} />
          </button>
        </div>
      )}

      {/* 筛选抽屉 */}
      {showFilter && (
        <div className="filter-overlay" onClick={() => setShowFilter(false)}>
          <div className="filter-drawer" onClick={e => e.stopPropagation()}>
            <div className="filter-header">
              <h3>筛选条件</h3>
              <button className="filter-reset" onClick={() => { setMemberFilter('all'); setShowFilter(false) }}>重置</button>
            </div>

            <div className="filter-section">
              <h4>成员</h4>
              <div className="filter-options">
                {filterTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`filter-chip ${memberFilter === tab.id ? 'active' : ''}`}
                    onClick={() => setMemberFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>分类</h4>
              <div className="filter-options">
                {['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '教育'].map(cat => (
                  <button key={cat} className="filter-chip">{cat}</button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>金额范围</h4>
              <div className="amount-range">
                <input type="number" placeholder="最小" />
                <span>-</span>
                <input type="number" placeholder="最大" />
              </div>
            </div>

            <button className="filter-apply-btn" onClick={() => setShowFilter(false)}>确定</button>
          </div>
        </div>
      )}

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
