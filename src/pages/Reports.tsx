import { useState, useEffect, useRef } from 'react'
import {
  Heart,
  ChevronDown,
  Filter,
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react'
import { type BillItem, fetchBills, fetchMonthStats } from '../lib/bills'
import MonthPicker from './MonthPicker'
import DynamicIsland from '../components/DynamicIsland'
import {
  PieChart, Pie, Cell,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import './Reports.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'
type ViewMode = 'chart' | 'calendar'
type ChartType = 'pie' | 'area' | 'bar'
type StatType = 'expense' | 'income' | 'balance' | 'net'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddRecord: () => void
  refreshKey?: number
}

export default function Reports({ activeTab, onTabChange, onAddRecord, refreshKey }: Props) {
  const now = new Date()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [chartType, setChartType] = useState<ChartType>('pie')
  const [drillDown, setDrillDown] = useState<BillItem[] | null>(null)
  const [drillTitle, setDrillTitle] = useState('')
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<number | null>(now.getDate())
  const [activeStat, setActiveStat] = useState<StatType>('expense')
  const calendarTouchStartX = useRef(0)

  const [bills, setBills] = useState<BillItem[]>([])
  const [monthStats, setMonthStats] = useState({ totalExpense: 0, totalIncome: 0, count: 0 })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const m = String(selectedMonth).padStart(2, '0')
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
        const startDate = `${selectedYear}-${m}-01`
        const endDate = `${selectedYear}-${m}-${String(daysInMonth).padStart(2, '0')}`
        const [stats, data] = await Promise.all([
          fetchMonthStats(selectedYear, selectedMonth),
          fetchBills({ startDate, endDate })
        ])
        if (!cancelled) {
          setMonthStats(stats)
          setBills(data)
        }
      } catch (e) {
        console.error('加载报表数据失败', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey, selectedYear, selectedMonth])

  const statLabels: Record<StatType, string> = {
    expense: '支出',
    income: '收入',
    balance: '收支',
    net: '结余'
  }

  const statValues: Record<StatType, string> = {
    expense: monthStats.totalExpense.toFixed(2),
    income: monthStats.totalIncome.toFixed(2),
    balance: (monthStats.totalExpense + monthStats.totalIncome).toFixed(2),
    net: (monthStats.totalIncome - monthStats.totalExpense).toFixed(2)
  }

  // 找出本月有账单的日期
  const billDates = new Map<number, { mine: boolean; partner: boolean; joint: boolean; hasExpense: boolean; hasIncome: boolean }>()
  bills.forEach(b => {
    const d = parseInt(b.date.split('-')[2], 10)
    if (isNaN(d)) return
    if (!billDates.has(d)) billDates.set(d, { mine: false, partner: false, joint: false, hasExpense: false, hasIncome: false })
    const entry = billDates.get(d)!
    if (b.member === 'mine') entry.mine = true
    if (b.member === 'partner') entry.partner = true
    if (b.member === 'joint') entry.joint = true
    if (b.type === 'expense') entry.hasExpense = true
    if (b.type === 'income') entry.hasIncome = true
  })

  // 选中日期的账单
  const selectedDateBills = selectedDate !== null
    ? bills.filter(b => {
        const d = parseInt(b.date.split('-')[2], 10)
        return d === selectedDate
      })
    : []
  const selectedDayExpense = selectedDateBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const selectedDayIncome = selectedDateBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  // 当月1日是星期几（0=周日），转为周一起始（0=周一,...,6=周日）
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay()
  const leadingBlanks = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const today = now.getDate()
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1

  const generateCalendarDays = () => {
    const days = []
    for (let i = 0; i < leadingBlanks; i++) {
      days.push({ day: 0, isEmpty: true })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateInfo = billDates.get(i)
      let hasBills = !!dateInfo
      if (dateInfo) {
        if (activeStat === 'expense') hasBills = dateInfo.hasExpense
        else if (activeStat === 'income') hasBills = dateInfo.hasIncome
      }
      days.push({
        day: i,
        isEmpty: false,
        isToday: isCurrentMonth && i === today,
        hasBills,
        myBills: dateInfo?.mine ?? false,
        partnerBills: dateInfo?.partner ?? false,
        jointBills: dateInfo?.joint ?? false
      })
    }
    return days
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  const dailyAvg = monthStats.count > 0 ? (monthStats.totalExpense / daysInMonth).toFixed(2) : '0.00'

  // 日历左右滑动切月
  const handleCalendarTouchStart = (e: React.TouchEvent) => {
    calendarTouchStartX.current = e.touches[0].clientX
  }
  const handleCalendarTouchEnd = (e: React.TouchEvent) => {
    const diff = calendarTouchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return
    if (diff > 0) {
      // 左滑 → 下个月
      if (selectedMonth === 12) {
        if (selectedYear < now.getFullYear()) { setSelectedYear(selectedYear + 1); setSelectedMonth(1) }
      } else {
        const next = new Date(selectedYear, selectedMonth, 1)
        if (next <= now) setSelectedMonth(selectedMonth + 1)
      }
    } else {
      // 右滑 → 上个月
      if (selectedMonth === 1) { setSelectedYear(selectedYear - 1); setSelectedMonth(12) }
      else setSelectedMonth(selectedMonth - 1)
    }
    setSelectedDate(null)
  }

  const handleMonthConfirm = (y: number, m: number) => {
    setSelectedYear(y)
    setSelectedMonth(m)
    setShowMonthPicker(false)
    setSelectedDate(null)
  }

  const currentMonthStr = `${selectedYear}年${selectedMonth}月`

  // 图表数据
  // 饼图：支出分类聚合
  const pieData = (() => {
    const map = new Map<string, number>()
    bills.filter(b => b.type === 'expense').forEach(b => {
      map.set(b.categoryName, (map.get(b.categoryName) || 0) + b.amount)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
  })()

  // 面积图：每日收支趋势
  const areaData = (() => {
    const map = new Map<number, { day: string; expense: number; income: number }>()
    for (let i = 1; i <= daysInMonth; i++) {
      map.set(i, { day: `${i}日`, expense: 0, income: 0 })
    }
    bills.forEach(b => {
      const d = parseInt(b.date.split('-')[2], 10)
      const entry = map.get(d)
      if (entry) {
        if (b.type === 'expense') entry.expense = Math.round((entry.expense + b.amount) * 100) / 100
        else entry.income = Math.round((entry.income + b.amount) * 100) / 100
      }
    })
    return Array.from(map.values())
  })()

  // 柱状图：成员对比
  const barData = (() => {
    const members: { name: string; expense: number; income: number }[] = [
      { name: '我', expense: 0, income: 0 },
      { name: 'TA', expense: 0, income: 0 },
      { name: '共同', expense: 0, income: 0 }
    ]
    bills.forEach(b => {
      const m = members.find(x => (b.member === 'mine' ? x.name === '我' : b.member === 'partner' ? x.name === 'TA' : x.name === '共同'))
      if (m) {
        if (b.type === 'expense') m.expense = Math.round((m.expense + b.amount) * 100) / 100
        else m.income = Math.round((m.income + b.amount) * 100) / 100
      }
    })
    return members
  })()

  const PIE_COLORS = ['#A8D5BA', '#F4A261', '#C8B6E2', '#E74C3C', '#27AE60', '#74B9FF', '#FFEAA7', '#636E72']

  // 图表下钻
  const handlePieClick = (data: { name?: string }) => {
    if (!data?.name) return
    const items = bills.filter(b => b.type === 'expense' && b.categoryName === data.name)
    setDrillDown(items)
    setDrillTitle(data.name)
  }

  const handleBarClick = (data: { name: string; expense: number; income: number }) => {
    if (!data?.name) return
    const memberMap: Record<string, string> = { '我': 'mine', 'TA': 'partner', '共同': 'joint' }
    const member = memberMap[data.name]
    const items = bills.filter(b => b.member === member)
    setDrillDown(items)
    setDrillTitle(data.name)
  }

  return (
    <div className="reports-page">
      <div className="reports-bg"></div>

      <header className="reports-header">
        <div className="segment-control">
          <button
            className={`segment-btn ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
          >
            报表
          </button>
          <button
            className={`segment-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            日历
          </button>
        </div>
        <button className="favorite-btn">
          <Heart size={20} />
        </button>
      </header>

      <main className="reports-main">
        <div className="month-filter-bar">
          <button className="month-selector" onClick={() => setShowMonthPicker(true)}>
            <span>{currentMonthStr}</span>
            <ChevronDown size={16} />
          </button>
          <button className="filter-btn">
            <Filter size={16} />
            <span>筛选</span>
          </button>
        </div>

        <div className="stat-tabs">
          {(Object.keys(statLabels) as StatType[]).map((key) => (
            <button
              key={key}
              className={`stat-tab ${activeStat === key ? 'active' : ''}`}
              onClick={() => setActiveStat(key)}
            >
              {statLabels[key]}
            </button>
          ))}
        </div>

        {/* 统计金额卡片 */}
        <div className="stat-amount-card">
          <span className="stat-currency">¥</span>
          <span className="stat-value">{statValues[activeStat]}</span>
        </div>

        {viewMode === 'calendar' ? (
          <div
            className="calendar-card"
            onTouchStart={handleCalendarTouchStart}
            onTouchEnd={handleCalendarTouchEnd}
          >
            <div className="calendar-header">
              {weekDays.map((day) => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((item, index) => (
                <div
                  key={index}
                  className={`calendar-day ${item.isEmpty ? 'empty' : ''} ${item.isToday ? 'today' : ''} ${item.day === selectedDate ? 'selected' : ''}`}
                  onClick={() => !item.isEmpty && setSelectedDate(selectedDate === item.day ? null : item.day)}
                >
                  {!item.isEmpty && (
                    <>
                      <span className="day-number">{item.day}</span>
                      {item.hasBills && (
                        <div className="bill-dots">
                          {item.myBills && <span className="dot mine"></span>}
                          {item.partnerBills && <span className="dot partner"></span>}
                          {item.jointBills && <span className="dot joint"></span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot mine"></span>
                <span>我的</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot partner"></span>
                <span>TA的</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot joint"></span>
                <span>共同</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="chart-section">
            <div className="chart-type-tabs">
              {(['pie', 'area', 'bar'] as ChartType[]).map(t => (
                <button
                  key={t}
                  className={`chart-type-tab ${chartType === t ? 'active' : ''}`}
                  onClick={() => setChartType(t)}
                >
                  {t === 'pie' ? '饼图' : t === 'area' ? '面积' : '柱状'}
                </button>
              ))}
            </div>

            <div className="chart-container">
              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name} ¥${value}`}
                      onClick={handlePieClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'area' && (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={areaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="day" fontSize={11} stroke="#B2BEC3" />
                    <YAxis fontSize={11} stroke="#B2BEC3" />
                    <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
                    <Area type="monotone" dataKey="expense" stroke="#E74C3C" fill="rgba(231,76,60,0.1)" name="支出" />
                    <Area type="monotone" dataKey="income" stroke="#27AE60" fill="rgba(39,174,96,0.1)" name="收入" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} onClick={(data: any) => data?.activePayload?.[0] && handleBarClick(data.activePayload[0].payload)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="name" fontSize={12} stroke="#2D3436" />
                    <YAxis fontSize={11} stroke="#B2BEC3" />
                    <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="expense" fill="#E74C3C" name="支出" cursor="pointer" />
                    <Bar dataKey="income" fill="#27AE60" name="收入" cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* 图表下钻列表 */}
        {drillDown && (
          <div className="chart-drilldown-overlay" onClick={() => setDrillDown(null)}>
            <div className="chart-drilldown-sheet" onClick={e => e.stopPropagation()}>
              <div className="drilldown-header">
                <h3>{drillTitle} - 账单明细</h3>
                <button onClick={() => setDrillDown(null)}>关闭</button>
              </div>
              <div className="drilldown-list">
                {drillDown.map(bill => (
                  <div key={bill.id} className="day-bill-item">
                    <span className="bill-cat">{bill.categoryIcon}</span>
                    <div className="bill-info">
                      <span className="bill-name">{bill.categoryName}</span>
                      {bill.note && <span className="bill-note">{bill.note}</span>}
                    </div>
                    <span className={`bill-amount ${bill.type}`}>
                      {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {drillDown.length === 0 && <p className="drilldown-empty">暂无账单</p>}
              </div>
            </div>
          </div>
        )}

        {/* 月统计 */}
        <div className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">月支出：</span>
            <span className="summary-value expense">¥{monthStats.totalExpense.toFixed(2)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-label">日均支出：</span>
            <span className="summary-value">¥{dailyAvg}</span>
          </div>
        </div>

        {/* 选中日期账单 */}
        {selectedDate !== null && (
          <div className="day-bills">
            <div className="day-bills-header">
              <span className="day-label">{selectedYear}年{selectedMonth}月{selectedDate}日账单</span>
              <span className="day-amount expense">支出¥{selectedDayExpense.toFixed(2)}</span>
              <span className="day-amount income">收入¥{selectedDayIncome.toFixed(2)}</span>
              <button className="history-btn">
                <CalendarIcon size={16} />
              </button>
            </div>
            {selectedDateBills.length === 0 ? (
              <div className="day-bills-empty">
                <p>当日暂无账单</p>
              </div>
            ) : (
              <div className="day-bills-list">
                {selectedDateBills.map(bill => (
                  <div key={bill.id} className="day-bill-item">
                    <span className="bill-cat">{bill.categoryIcon}</span>
                    <div className="bill-info">
                      <span className="bill-name">{bill.categoryName}</span>
                      {bill.note && <span className="bill-note">{bill.note}</span>}
                    </div>
                    <span className={`bill-amount ${bill.type}`}>
                      {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <button className="fab-btn" onClick={onAddRecord}>
        <Plus size={24} />
        <span>记一笔</span>
      </button>

      <DynamicIsland activeTab={activeTab} onTabChange={onTabChange} />

      {showMonthPicker && (
        <MonthPicker
          year={selectedYear}
          month={selectedMonth}
          onConfirm={handleMonthConfirm}
          onClose={() => setShowMonthPicker(false)}
        />
      )}
    </div>
  )
}
