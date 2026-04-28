import { useState, useRef, useEffect } from 'react'
import './MonthPicker.css'

interface Props {
  year: number
  month: number
  onConfirm: (year: number, month: number) => void
  onClose: () => void
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function MonthPicker({ year, month, onConfirm, onClose }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const startYear = 2020
  const years: number[] = []
  for (let y = startYear; y <= currentYear; y++) years.push(y)

  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedMonth, setSelectedMonth] = useState(month)

  const yearRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 滚动到选中项
    const yearIdx = years.indexOf(selectedYear)
    const monthIdx = selectedMonth - 1
    if (yearRef.current) {
      const itemHeight = 44
      yearRef.current.scrollTop = yearIdx * itemHeight - 88
    }
    if (monthRef.current) {
      const itemHeight = 44
      monthRef.current.scrollTop = monthIdx * itemHeight - 88
    }
  }, [])

  const isFutureMonth = (y: number, m: number) => {
    if (y > currentYear) return true
    if (y === currentYear && m > currentMonth) return true
    return false
  }

  const handleConfirm = () => {
    if (isFutureMonth(selectedYear, selectedMonth)) return
    onConfirm(selectedYear, selectedMonth)
  }

  const handleYearScroll = () => {
    if (!yearRef.current) return
    const itemHeight = 44
    const idx = Math.round(yearRef.current.scrollTop / itemHeight)
    if (idx >= 0 && idx < years.length) {
      setSelectedYear(years[idx])
    }
  }

  const handleMonthScroll = () => {
    if (!monthRef.current) return
    const itemHeight = 44
    const idx = Math.round(monthRef.current.scrollTop / itemHeight)
    if (idx >= 0 && idx < 12) {
      setSelectedMonth(idx + 1)
    }
  }

  return (
    <div className="month-picker-overlay" onClick={onClose}>
      <div className="month-picker-sheet" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <button className="picker-cancel" onClick={onClose}>取消</button>
          <span className="picker-title">选择月份</span>
          <button className="picker-confirm" onClick={handleConfirm}>确定</button>
        </div>

        <div className="picker-body">
          <div className="picker-column">
            <div className="picker-label">年</div>
            <div className="picker-scroll" ref={yearRef} onScroll={handleYearScroll}>
              <div className="picker-spacer"></div>
              {years.map(y => (
                <div
                  key={y}
                  className={`picker-item ${y === selectedYear ? 'active' : ''}`}
                  onClick={() => setSelectedYear(y)}
                >
                  {y}年
                </div>
              ))}
              <div className="picker-spacer"></div>
            </div>
          </div>

          <div className="picker-column">
            <div className="picker-label">月</div>
            <div className="picker-scroll" ref={monthRef} onScroll={handleMonthScroll}>
              <div className="picker-spacer"></div>
              {MONTHS.map((m, i) => {
                const disabled = isFutureMonth(selectedYear, i + 1)
                return (
                  <div
                    key={m}
                    className={`picker-item ${(i + 1) === selectedMonth ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && setSelectedMonth(i + 1)}
                  >
                    {m}
                  </div>
                )
              })}
              <div className="picker-spacer"></div>
            </div>
          </div>

          <div className="picker-highlight"></div>
        </div>
      </div>
    </div>
  )
}
