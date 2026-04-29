import { useState } from 'react'
import { X, ArrowLeftRight, RefreshCw } from 'lucide-react'
import './ExchangeRate.css'

interface Props { onClose: () => void }

interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
}

const CURRENCIES: Currency[] = [
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧' },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
  { code: 'THB', name: '泰铢', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', name: '林吉特', symbol: 'RM', flag: '🇲🇾' },
]

const DEFAULT_RATES: Record<string, number> = {
  CNY: 1, USD: 7.25, EUR: 7.85, JPY: 0.048, GBP: 9.15,
  HKD: 0.93, KRW: 0.0054, AUD: 4.75, CAD: 5.30, SGD: 5.40,
  THB: 0.20, MYR: 1.55,
}

const RATES_KEY = 'us_ledger_exchange_rates'
const RATES_DATE_KEY = 'us_ledger_exchange_rates_date'

function loadRates(): { rates: Record<string, number>; date: string } {
  try {
    const r = localStorage.getItem(RATES_KEY)
    const d = localStorage.getItem(RATES_DATE_KEY)
    if (r) return { rates: JSON.parse(r), date: d || '' }
  } catch {}
  return { rates: DEFAULT_RATES, date: '' }
}

export default function ExchangeRate({ onClose }: Props) {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('CNY')
  const [to, setTo] = useState('USD')
  const [ratesData, setRatesData] = useState(loadRates)
  const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null)

  const rates = ratesData.rates
  const fromRate = rates[from] || 1
  const toRate = rates[to] || 1
  const converted = (parseFloat(amount) || 0) * fromRate / toRate
  const exchangeRate = fromRate / toRate

  const swap = () => { setFrom(to); setTo(from) }

  const refreshRates = () => {
    // 模拟刷新：在默认汇率基础上加微小随机波动
    const updated = { ...DEFAULT_RATES }
    Object.keys(updated).forEach(k => {
      const variation = 1 + (Math.random() - 0.5) * 0.02
      updated[k] = Math.round(updated[k] * variation * 10000) / 10000
    })
    const date = new Date().toLocaleString('zh-CN')
    localStorage.setItem(RATES_KEY, JSON.stringify(updated))
    localStorage.setItem(RATES_DATE_KEY, date)
    setRatesData({ rates: updated, date })
  }

  const fromCurrency = CURRENCIES.find(c => c.code === from)!
  const toCurrency = CURRENCIES.find(c => c.code === to)!

  return (
    <div className="er-overlay">
      <div className="er-page">
        <header className="er-header">
          <button className="er-back" onClick={onClose}><X size={24} /></button>
          <h2>汇率换算</h2>
          <button className="er-back" onClick={refreshRates}><RefreshCw size={18} /></button>
        </header>
        <div className="er-body">
          <div className="er-card">
            <div className="er-amount-label">金额</div>
            <input
              className="er-amount-input"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="输入金额"
            />

            <div className="er-currency-row">
              <div className="er-currency-select">
                <button className="er-currency-btn" onClick={() => setShowPicker('from')}>
                  <span className="er-currency-flag">{fromCurrency.flag}</span>
                  <span className="er-currency-info">
                    <span className="er-currency-code">{fromCurrency.code}</span>
                    <span className="er-currency-name">{fromCurrency.name}</span>
                  </span>
                </button>
              </div>
              <button className="er-swap-btn" onClick={swap}><ArrowLeftRight size={18} color="#636E72" /></button>
              <div className="er-currency-select">
                <button className="er-currency-btn" onClick={() => setShowPicker('to')}>
                  <span className="er-currency-flag">{toCurrency.flag}</span>
                  <span className="er-currency-info">
                    <span className="er-currency-code">{toCurrency.code}</span>
                    <span className="er-currency-name">{toCurrency.name}</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="er-result">
              <div className="er-result-amount">
                {toCurrency.symbol}{converted.toFixed(2)}
              </div>
              <div className="er-result-rate">
                1 {from} = {exchangeRate.toFixed(4)} {to}
              </div>
            </div>
          </div>

          <div className="er-card">
            <div className="er-rate-info">
              <span className="er-rate-text">基准汇率（相对人民币）</span>
              {ratesData.date && <span className="er-rate-update">更新于 {ratesData.date}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: 8 }}>
              {CURRENCIES.map(c => (
                <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8F9FA', borderRadius: 8, fontSize: 13, color: c.code === from || c.code === to ? '#98D8C8' : '#636E72', fontWeight: c.code === from || c.code === to ? 600 : 400 }}>
                  <span>{c.flag} {c.code}</span>
                  <span>{rates[c.code]?.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showPicker && (
          <div className="er-picker-overlay" onClick={() => setShowPicker(null)}>
            <div className="er-picker" onClick={e => e.stopPropagation()}>
              <h3>选择币种</h3>
              {CURRENCIES.map(c => (
                <div
                  key={c.code}
                  className={`er-currency-option ${c.code === (showPicker === 'from' ? from : to) ? 'selected' : ''}`}
                  onClick={() => {
                    if (showPicker === 'from') setFrom(c.code)
                    else setTo(c.code)
                    setShowPicker(null)
                  }}
                >
                  <span className="flag">{c.flag}</span>
                  <span className="info">
                    <span className="code">{c.code}</span>
                    <span className="name">{c.name}</span>
                  </span>
                  {c.code === (showPicker === 'from' ? from : to) && <span className="check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
