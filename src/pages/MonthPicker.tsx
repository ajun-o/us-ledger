import { useState, useRef, useEffect, useCallback } from 'react'
import './MonthPicker.css'

interface Props {
  year: number
  month: number
  onConfirm: (year: number, month: number) => void
  onClose: () => void
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const ITEM_HEIGHT = 44

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1
const START_YEAR = 2020

const YEARS: number[] = []
for (let y = START_YEAR; y <= CURRENT_YEAR; y++) YEARS.push(y)

export default function MonthPicker({ year, month, onConfirm, onClose }: Props) {
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedMonth, setSelectedMonth] = useState(month)

  const yearRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)
  const yearTimer = useRef<ReturnType<typeof setTimeout>>()
  const monthTimer = useRef<ReturnType<typeof setTimeout>>()

  // 初始化滚动位置
  useEffect(() => {
    const yearIdx = YEARS.indexOf(year)
    if (yearRef.current && yearIdx >= 0) {
      yearRef.current.scrollTop = yearIdx * ITEM_HEIGHT
    }
    if (monthRef.current && month >= 1 && month <= 12) {
      monthRef.current.scrollTop = (month - 1) * ITEM_HEIGHT
    }
  }, [])

  const isFuture = useCallback((y: number, m: number) => {
    if (y > CURRENT_YEAR) return true
    if (y === CURRENT_YEAR && m > CURRENT_MONTH) return true
    return false
  }, [])

  const handleConfirm = () => {
    if (isFuture(selectedYear, selectedMonth)) return
    onConfirm(selectedYear, selectedMonth)
  }

  // 滚动检测 — 用 debounce 避免过度触发
  const handleYearScroll = useCallback(() => {
    if (!yearRef.current) return
    clearTimeout(yearTimer.current)
    yearTimer.current = setTimeout(() => {
      if (!yearRef.current) return
      const idx = Math.round(yearRef.current.scrollTop / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(YEARS.length - 1, idx))
      setSelectedYear(YEARS[clamped])
    }, 80)
  }, [])

  const handleMonthScroll = useCallback(() => {
    if (!monthRef.current) return
    clearTimeout(monthTimer.current)
    monthTimer.current = setTimeout(() => {
      if (!monthRef.current) return
      const idx = Math.round(monthRef.current.scrollTop / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(11, idx))
      const m = clamped + 1
      // 未来月份不可选，保持在当前最大可用月
      if (isFuture(selectedYear, m)) {
        const maxMonth = selectedYear >= CURRENT_YEAR ? CURRENT_MONTH : 12
        setSelectedMonth(maxMonth)
        if (monthRef.current) {
          monthRef.current.scrollTop = (maxMonth - 1) * ITEM_HEIGHT
        }
      } else {
        setSelectedMonth(m)
      }
    }, 80)
  }, [selectedYear, isFuture])

  // 点击选择
  const selectYear = (y: number) => {
    setSelectedYear(y)
    const idx = YEARS.indexOf(y)
    if (yearRef.current) {
      yearRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' })
    }
  }

  const selectMonth = (m: number) => {
    if (isFuture(selectedYear, m)) return
    setSelectedMonth(m)
    if (monthRef.current) {
      monthRef.current.scrollTo({ top: (m - 1) * ITEM_HEIGHT, behavior: 'smooth' })
    }
  }

  const containerHeight = ITEM_HEIGHT * 5 // 5 项可见
  const spacerHeight = ITEM_HEIGHT * 2  // 上下各留 2 项高度的空白，让首尾项也能居中

  return (
    <div className="month-picker-overlay" onClick={onClose}>
      <div className="month-picker-sheet" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <button className="picker-cancel" onClick={onClose}>取消</button>
          <span className="picker-title">选择月份</span>
          <button className="picker-confirm" onClick={handleConfirm}>确定</button>
        </div>

        <div className="picker-body">
          {/* 年份列 */}
          <div className="picker-column">
            <div className="picker-label">年</div>
            <div
              className="picker-scroll"
              ref={yearRef}
              onScroll={handleYearScroll}
              style={{ height: containerHeight }}
            >
              <div style={{ height: spacerHeight }} />
              {YEARS.map(y => (
                <div
                  key={y}
                  className={`picker-item ${y === selectedYear ? 'active' : ''}`}
                  style={{ height: ITEM_HEIGHT }}
                  onClick={() => selectYear(y)}
                >
                  {y}
                </div>
              ))}
              <div style={{ height: spacerHeight }} />
            </div>
          </div>

          {/* 月份列 */}
          <div className="picker-column">
            <div className="picker-label">月</div>
            <div
              className="picker-scroll"
              ref={monthRef}
              onScroll={handleMonthScroll}
              style={{ height: containerHeight }}
            >
              <div style={{ height: spacerHeight }} />
              {MONTHS.map((name, i) => {
                const m = i + 1
                const disabled = isFuture(selectedYear, m)
                return (
                  <div
                    key={name}
                    className={`picker-item ${m === selectedMonth ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                    style={{ height: ITEM_HEIGHT }}
                    onClick={() => selectMonth(m)}
                  >
                    {name}
                  </div>
                )
              })}
              <div style={{ height: spacerHeight }} />
            </div>
          </div>

          {/* 居中高亮条 */}
          <div className="picker-highlight" />
        </div>
      </div>
    </div>
  )
}
