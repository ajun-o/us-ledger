import { useState } from 'react'
import {
  Heart,
  ChevronDown,
  Filter,
  Clock,
  Plus,
  Calendar as CalendarIcon,
  Wallet,
  BarChart3,
  User
} from 'lucide-react'
import './Reports.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'
type ViewMode = 'chart' | 'calendar'
type StatType = 'expense' | 'income' | 'balance' | 'net'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddRecord: () => void
}

export default function Reports({ activeTab, onTabChange, onAddRecord }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [currentMonth] = useState('2026年4月')
  const [selectedDate, setSelectedDate] = useState<number>(27)
  const [activeStat, setActiveStat] = useState<StatType>('expense')

  const statLabels: Record<StatType, string> = {
    expense: '支出',
    income: '收入',
    balance: '收支',
    net: '结余'
  }

  // 生成日历数据
  const generateCalendarDays = () => {
    const days = []
    // 4月1日是周三，前面需要2个空位（周一、周二）
    for (let i = 0; i < 2; i++) {
      days.push({ day: 0, isEmpty: true })
    }
    // 4月有30天
    for (let i = 1; i <= 30; i++) {
      days.push({
        day: i,
        isEmpty: false,
        isToday: i === 28, // 假设今天是28号
        hasBills: [5, 8, 12, 15, 18, 22, 25, 27].includes(i),
        myBills: [5, 12, 18, 25].includes(i),
        partnerBills: [8, 15, 22].includes(i),
        jointBills: [12, 27].includes(i)
      })
    }
    return days
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  const tabs = [
    { id: 'home' as TabType, icon: Wallet, label: '主页' },
    { id: 'bills' as TabType, icon: Clock, label: '账单' },
    { id: 'reports' as TabType, icon: BarChart3, label: '报表' },
    { id: 'profile' as TabType, icon: User, label: '我的' }
  ]

  return (
    <div className="reports-page">
      <div className="reports-bg"></div>

      {/* 顶部 */}
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
        {/* 月份和筛选 */}
        <div className="month-filter-bar">
          <button className="month-selector">
            <span>{currentMonth}</span>
            <ChevronDown size={16} />
          </button>
          <button className="filter-btn">
            <Filter size={16} />
            <span>筛选</span>
          </button>
        </div>

        {/* 统计标签 */}
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

        {/* 日历 */}
        <div className="calendar-card">
          {/* 星期表头 */}
          <div className="calendar-header">
            {weekDays.map((day) => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="calendar-grid">
            {calendarDays.map((item, index) => (
              <div
                key={index}
                className={`calendar-day ${item.isEmpty ? 'empty' : ''} ${item.isToday ? 'today' : ''} ${item.day === selectedDate ? 'selected' : ''}`}
                onClick={() => !item.isEmpty && setSelectedDate(item.day)}
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

          {/* 图例 */}
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

        {/* 月统计 */}
        <div className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">月支出：</span>
            <span className="summary-value expense">¥0.00</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-label">日均支出：</span>
            <span className="summary-value">¥0.00</span>
          </div>
        </div>

        {/* 选中日期账单 */}
        <div className="day-bills">
          <div className="day-bills-header">
            <span className="day-label">{currentMonth.replace('年', '月')}{selectedDate}日账单</span>
            <span className="day-amount expense">支出¥0.00</span>
            <button className="history-btn">
              <CalendarIcon size={16} />
            </button>
          </div>
          <div className="day-bills-empty">
            <p>当日暂无账单</p>
          </div>
        </div>
      </main>

      {/* 记一笔按钮 */}
      <button className="fab-btn" onClick={onAddRecord}>
        <Plus size={24} />
        <span>记一笔</span>
      </button>

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
