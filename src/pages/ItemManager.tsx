import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import './ItemManager.css'

interface Props { onClose: () => void }

interface ManagedItem {
  id: string
  name: string
  qty: number
  location: string
}

const STORAGE_KEY = 'us_managed_items'

function load(): ManagedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(items: ManagedItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function ItemManager({ onClose }: Props) {
  const [items, setItems] = useState<ManagedItem[]>(load)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [location, setLocation] = useState('')

  useEffect(() => { save(items) }, [items])

  const add = () => {
    if (!name.trim()) return
    const item: ManagedItem = {
      id: Date.now().toString(36),
      name: name.trim(),
      qty: parseInt(qty) || 1,
      location: location.trim(),
    }
    setItems(prev => [item, ...prev])
    setName('')
    setQty('1')
    setLocation('')
  }

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="im-overlay">
      <div className="im-page">
        <header className="im-header">
          <button className="im-back" onClick={onClose}><X size={24} /></button>
          <h2>物品管理</h2>
          <div style={{ width: 40 }} />
        </header>
        <div className="im-body">
          <div className="im-form">
            <input
              className="im-input"
              placeholder="物品名称"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className="im-input im-input-sm"
              type="number"
              placeholder="数量"
              value={qty}
              onChange={e => setQty(e.target.value)}
              min="1"
            />
            <input
              className="im-input im-input-sm"
              placeholder="位置"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <button className="im-add-btn" onClick={add}>
              <Plus size={18} />
            </button>
          </div>
          {items.length === 0 ? (
            <p className="im-empty">暂无物品记录</p>
          ) : (
            <div className="im-list">
              {items.map(item => (
                <div key={item.id} className="im-item">
                  <div className="im-item-info">
                    <span className="im-item-name">{item.name}</span>
                    {item.location ? <span className="im-item-loc">📍 {item.location}</span> : null}
                  </div>
                  <span className="im-item-qty">×{item.qty}</span>
                  <button className="im-item-del" onClick={() => remove(item.id)}>
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
