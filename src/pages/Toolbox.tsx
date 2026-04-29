import { useState } from 'react'
import { X, Percent, Users, CreditCard } from 'lucide-react'
import './Toolbox.css'

interface Props { onClose: () => void }

type ToolTab = 'discount' | 'split' | 'installment'

export default function Toolbox({ onClose }: Props) {
  const [tab, setTab] = useState<ToolTab>('discount')

  // 折扣计算
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const discountPrice = (parseFloat(price) || 0) * (parseFloat(discount) || 0) / 10
  const saved = (parseFloat(price) || 0) - discountPrice

  // AA 分摊
  const [totalAmount, setTotalAmount] = useState('')
  const [people, setPeople] = useState('2')
  const perPerson = (parseFloat(totalAmount) || 0) / (parseInt(people) || 1)

  // 分期计算
  const [installAmount, setInstallAmount] = useState('')
  const [months, setMonths] = useState('3')
  const monthly = (parseFloat(installAmount) || 0) / (parseInt(months) || 1)

  return (
    <div className="tl-overlay">
      <div className="tl-page">
        <header className="tl-header">
          <button className="tl-back" onClick={onClose}><X size={24} /></button>
          <h2>小工具</h2>
          <div style={{ width: 40 }} />
        </header>
        <div className="tl-body">
          <div className="tl-tabs">
            <button className={`tl-tab ${tab === 'discount' ? 'active' : ''}`} onClick={() => setTab('discount')}>
              <Percent size={14} /> 折扣
            </button>
            <button className={`tl-tab ${tab === 'split' ? 'active' : ''}`} onClick={() => setTab('split')}>
              <Users size={14} /> AA
            </button>
            <button className={`tl-tab ${tab === 'installment' ? 'active' : ''}`} onClick={() => setTab('installment')}>
              <CreditCard size={14} /> 分期
            </button>
          </div>

          {tab === 'discount' && (
            <div className="tl-card">
              <div className="tl-label">原价（元）</div>
              <input className="tl-input" type="number" placeholder="输入原价" value={price} onChange={e => setPrice(e.target.value)} />
              <div className="tl-label" style={{ marginTop: 16 }}>折扣</div>
              <div className="tl-presets">
                {[9.5, 9, 8.5, 8, 7, 6, 5].map(d => (
                  <button key={d} className="tl-preset" onClick={() => setDiscount(String(d))}>{d}折</button>
                ))}
              </div>
              <input className="tl-input" type="number" placeholder="输入折扣（如 8.5）" value={discount} onChange={e => setDiscount(e.target.value)} step="0.1" />
              {(parseFloat(price) || 0) > 0 && (
                <div className="tl-result">
                  <div className="tl-result-amount">¥{discountPrice.toFixed(2)}</div>
                  <div className="tl-result-label">
                    折后价 {saved > 0 ? `（省了 ¥${saved.toFixed(2)}）` : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'split' && (
            <div className="tl-card">
              <div className="tl-label">总金额（元）</div>
              <input className="tl-input" type="number" placeholder="输入总金额" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
              <div className="tl-label" style={{ marginTop: 16 }}>人数</div>
              <div className="tl-presets">
                {[2, 3, 4, 5, 6, 8, 10].map(n => (
                  <button key={n} className="tl-preset" onClick={() => setPeople(String(n))}>{n}人</button>
                ))}
              </div>
              <input className="tl-input" type="number" placeholder="人数" value={people} onChange={e => setPeople(e.target.value)} />
              {(parseFloat(totalAmount) || 0) > 0 && (
                <div className="tl-result">
                  <div className="tl-result-amount">¥{perPerson.toFixed(2)}</div>
                  <div className="tl-result-label">每人应付 / {people || 1}人</div>
                </div>
              )}
            </div>
          )}

          {tab === 'installment' && (
            <div className="tl-card">
              <div className="tl-label">总金额（元）</div>
              <input className="tl-input" type="number" placeholder="输入总金额" value={installAmount} onChange={e => setInstallAmount(e.target.value)} />
              <div className="tl-label" style={{ marginTop: 16 }}>期数</div>
              <div className="tl-presets">
                {[3, 6, 12, 24, 36].map(n => (
                  <button key={n} className="tl-preset" onClick={() => setMonths(String(n))}>{n}期</button>
                ))}
              </div>
              <input className="tl-input" type="number" placeholder="期数" value={months} onChange={e => setMonths(e.target.value)} />
              {(parseFloat(installAmount) || 0) > 0 && (
                <div className="tl-result">
                  <div className="tl-result-amount">¥{monthly.toFixed(2)}</div>
                  <div className="tl-result-label">每期应付 / {months || 1} 期</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
