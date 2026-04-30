import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import './FoodOrders.css'

interface Props { onClose: () => void }

interface FoodOrder {
  id: string
  name: string
  amount: number
  date: string
}

const STORAGE_KEY = 'us_food_orders'

function load(): FoodOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(items: FoodOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function FoodOrders({ onClose }: Props) {
  const [items, setItems] = useState<FoodOrder[]>(load)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => { save(items) }, [items])

  const add = () => {
    if (!name.trim() || !amount) return
    const item: FoodOrder = {
      id: Date.now().toString(36),
      name: name.trim(),
      amount: parseFloat(amount),
      date,
    }
    setItems(prev => [item, ...prev])
    setName('')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="fo-overlay">
      <div className="fo-page">
        <header className="fo-header">
          <button className="fo-back" onClick={onClose}><X size={24} /></button>
          <h2>外卖订单</h2>
          <div style={{ width: 40 }} />
        </header>
        <div className="fo-body">
          <div className="fo-form">
            <input
              className="fo-input"
              placeholder="外卖名称"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className="fo-input fo-input-sm"
              type="number"
              placeholder="金额"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
            <input
              className="fo-input fo-input-sm"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <button className="fo-add-btn" onClick={add}>
              <Plus size={18} />
            </button>
          </div>
          {items.length === 0 ? (
            <p className="fo-empty">暂无外卖订单记录</p>
          ) : (
            <div className="fo-list">
              {items.map(item => (
                <div key={item.id} className="fo-item">
                  <div className="fo-item-info">
                    <span className="fo-item-name">{item.name}</span>
                    <span className="fo-item-date">{item.date}</span>
                  </div>
                  <span className="fo-item-amount">¥{item.amount.toFixed(2)}</span>
                  <button className="fo-item-del" onClick={() => remove(item.id)}>
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
