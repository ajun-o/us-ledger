import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import './SubscriptionManager.css'

interface Props { onClose: () => void }

interface Subscription {
  id: string
  name: string
  amount: number
  cycle: 'monthly' | 'yearly' | 'weekly'
  nextDate: string
}

const STORAGE_KEY = 'us_subscriptions'
const CYCLE_LABELS: Record<string, string> = { weekly: '每周', monthly: '每月', yearly: '每年' }

function load(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(items: Subscription[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function SubscriptionManager({ onClose }: Props) {
  const [items, setItems] = useState<Subscription[]>(load)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cycle, setCycle] = useState<Subscription['cycle']>('monthly')
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => { save(items) }, [items])

  const add = () => {
    if (!name.trim() || !amount) return
    const item: Subscription = {
      id: Date.now().toString(36),
      name: name.trim(),
      amount: parseFloat(amount),
      cycle,
      nextDate,
    }
    setItems(prev => [item, ...prev])
    setName('')
    setAmount('')
    setNextDate(new Date().toISOString().slice(0, 10))
  }

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="sm-overlay">
      <div className="sm-page">
        <header className="sm-header">
          <button className="sm-back" onClick={onClose}><X size={24} /></button>
          <h2>订阅管理</h2>
          <div style={{ width: 40 }} />
        </header>
        <div className="sm-body">
          <div className="sm-form">
            <input
              className="sm-input"
              placeholder="订阅名称"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className="sm-input sm-input-sm"
              type="number"
              placeholder="金额"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
            <select
              className="sm-select"
              value={cycle}
              onChange={e => setCycle(e.target.value as Subscription['cycle'])}
            >
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="yearly">每年</option>
            </select>
            <input
              className="sm-input sm-input-sm"
              type="date"
              value={nextDate}
              onChange={e => setNextDate(e.target.value)}
            />
            <button className="sm-add-btn" onClick={add}>
              <Plus size={18} />
            </button>
          </div>
          {items.length === 0 ? (
            <p className="sm-empty">暂无订阅记录</p>
          ) : (
            <div className="sm-list">
              {items.map(item => (
                <div key={item.id} className="sm-item">
                  <div className="sm-item-info">
                    <span className="sm-item-name">{item.name}</span>
                    <span className="sm-item-meta">{CYCLE_LABELS[item.cycle]} · 下次 {item.nextDate}</span>
                  </div>
                  <span className="sm-item-amount">¥{item.amount.toFixed(2)}</span>
                  <button className="sm-item-del" onClick={() => remove(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
