import { useState } from 'react'
import { X, Plus, Edit3, Trash2, ShoppingCart, Check } from 'lucide-react'
import './ShoppingList.css'

interface ShoppingItem {
  id: string
  name: string
  estimatedPrice: number
  actualPrice: number
  category: string
  member: string
  purchased: boolean
  note: string
}

interface Props { onClose: () => void }

const KEY = 'us_ledger_shopping_list'
const CATS = ['食品','日用品','服饰','数码','家居','其他']
const MEMBERS = [{ id: 'mine', label: '我' }, { id: 'partner', label: 'TA' }, { id: 'joint', label: '共同' }]

function load(): ShoppingItem[] {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r) } catch {}
  return []
}

export default function ShoppingList({ onClose }: Props) {
  const [items, setItems] = useState<ShoppingItem[]>(load)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShoppingItem | null>(null)
  const [form, setForm] = useState({ name: '', estimatedPrice: '', actualPrice: '', category: '食品', member: 'joint', note: '' })

  const save = (updated: ShoppingItem[]) => { setItems(updated); localStorage.setItem(KEY, JSON.stringify(updated)) }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingItem) {
      save(items.map(i => i.id === editingItem.id ? { ...i, name: form.name.trim(), estimatedPrice: parseFloat(form.estimatedPrice) || 0, actualPrice: parseFloat(form.actualPrice) || 0, category: form.category, member: form.member, note: form.note.trim() } : i))
    } else {
      save([...items, { id: `sl_${Date.now()}`, name: form.name.trim(), estimatedPrice: parseFloat(form.estimatedPrice) || 0, actualPrice: parseFloat(form.actualPrice) || 0, category: form.category, member: form.member, purchased: false, note: form.note.trim() }])
    }
    setShowForm(false); setEditingItem(null)
  }

  const togglePurchased = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i))
  }

  const openEdit = (item: ShoppingItem) => {
    setEditingItem(item)
    setForm({ name: item.name, estimatedPrice: String(item.estimatedPrice || ''), actualPrice: String(item.actualPrice || ''), category: item.category, member: item.member, note: item.note })
    setShowForm(true)
  }

  const pending = items.filter(i => !i.purchased)
  const bought = items.filter(i => i.purchased)
  const totalEst = items.reduce((s, i) => s + i.estimatedPrice, 0)
  const totalActual = items.reduce((s, i) => s + i.actualPrice, 0)

  return (
    <div className="sl-overlay">
      <div className="sl-page">
        <header className="sl-header">
          <button className="sl-back" onClick={onClose}><X size={24} /></button>
          <h2>购物清单</h2>
          <button className="sl-add" onClick={() => { setEditingItem(null); setForm({ name: '', estimatedPrice: '', actualPrice: '', category: '食品', member: 'joint', note: '' }); setShowForm(true) }}><Plus size={22} /></button>
        </header>
        <div className="sl-body">
          {items.length === 0 && <div className="sl-empty"><ShoppingCart size={40} /><p>还没有购物项</p></div>}
          {items.length > 0 && (
            <div className="sl-stats">
              <div className="sl-stat-card">
                <div className="sl-stat-value">{items.length}</div>
                <div className="sl-stat-label">共{item.length}项</div>
              </div>
              <div className="sl-stat-card">
                <div className="sl-stat-value">¥{totalEst.toFixed(0)}</div>
                <div className="sl-stat-label">预估花费</div>
              </div>
              <div className="sl-stat-card">
                <div className="sl-stat-value green">¥{totalActual.toFixed(0)}</div>
                <div className="sl-stat-label">实际花费</div>
              </div>
            </div>
          )}

          {pending.length > 0 && <div className="sl-section-title">待购买 ({pending.length})</div>}
          {pending.map(item => (
            <div key={item.id} className="sl-item" onClick={() => openEdit(item)}>
              <button className={`sl-check`} onClick={e => { e.stopPropagation(); togglePurchased(item.id) }} />
              <div className="sl-item-info">
                <span className="sl-item-name">{item.name}</span>
                <span className="sl-item-meta">
                  <span>{item.category}</span>
                  <span>{MEMBERS.find(m => m.id === item.member)?.label}</span>
                </span>
              </div>
              <div className="sl-item-price">
                {item.actualPrice > 0 ? <><span className="est">¥{item.estimatedPrice.toFixed(0)}</span><span className="actual">¥{item.actualPrice.toFixed(0)}</span></> : <span>¥{item.estimatedPrice.toFixed(0)}</span>}
              </div>
            </div>
          ))}

          {bought.length > 0 && <div className="sl-section-title" style={{ marginTop: 16 }}>已购买 ({bought.length})</div>}
          {bought.map(item => (
            <div key={item.id} className={`sl-item done`} onClick={() => openEdit(item)}>
              <button className="sl-check done" onClick={e => { e.stopPropagation(); togglePurchased(item.id) }}><Check size={14} /></button>
              <div className="sl-item-info">
                <span className="sl-item-name done">{item.name}</span>
                <span className="sl-item-meta">
                  <span>{item.category}</span>
                  <span>{MEMBERS.find(m => m.id === item.member)?.label}</span>
                </span>
              </div>
              <div className="sl-item-price">
                {item.actualPrice > 0 ? <><span className="est">¥{item.estimatedPrice.toFixed(0)}</span><span className="actual">¥{item.actualPrice.toFixed(0)}</span></> : <span>¥{item.estimatedPrice.toFixed(0)}</span>}
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="sl-modal-overlay" onClick={() => { setShowForm(false); setEditingItem(null) }}>
            <div className="sl-modal" onClick={e => e.stopPropagation()}>
              <h3>{editingItem ? '编辑项目' : '添加项目'}</h3>
              <input className="sl-input" placeholder="物品名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus maxLength={20} />
              <div className="sl-row">
                <input className="sl-input" type="number" placeholder="预估价格" value={form.estimatedPrice} onChange={e => setForm({ ...form, estimatedPrice: e.target.value })} />
                <input className="sl-input" type="number" placeholder="实际价格" value={form.actualPrice} onChange={e => setForm({ ...form, actualPrice: e.target.value })} />
              </div>
              <div className="sl-label">分类</div>
              <div className="sl-chips">
                {CATS.map(c => <button key={c} className={`sl-chip ${form.category === c ? 'active' : ''}`} onClick={() => setForm({ ...form, category: c })}>{c}</button>)}
              </div>
              <div className="sl-label">负责人</div>
              <div className="sl-chips">
                {MEMBERS.map(m => <button key={m.id} className={`sl-chip ${form.member === m.id ? 'active' : ''}`} onClick={() => setForm({ ...form, member: m.id })}>{m.label}</button>)}
              </div>
              <div className="sl-btns">
                <button className="sl-cancel" onClick={() => { setShowForm(false); setEditingItem(null) }}>取消</button>
                <button className="sl-confirm" onClick={handleSave}>{editingItem ? '保存' : '添加'}</button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="sl-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="sl-modal" onClick={e => e.stopPropagation()}>
              <h3>删除「{deleteTarget.name}」</h3>
              <div className="sl-btns">
                <button className="sl-cancel" onClick={() => setDeleteTarget(null)}>取消</button>
                <button className="sl-confirm danger" onClick={() => { save(items.filter(i => i.id !== deleteTarget.id)); setDeleteTarget(null) }}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
