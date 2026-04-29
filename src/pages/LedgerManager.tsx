import { useState } from 'react'
import { X, Plus, Edit3, Archive, Trash2, Star, ChevronRight, RotateCcw } from 'lucide-react'
import './LedgerManager.css'

interface Ledger {
  id: string
  name: string
  icon: string
  members: string[] // 'me', 'partner'
  isDefault: boolean
  archived: boolean
  createdAt: string
}

interface Props {
  onClose: () => void
}

const LEDGER_KEY = 'us_ledger_ledgers'
const EMOJIS = ['🏠', '💕', '✈️', '🍜', '💼', '🎓', '💪', '🎯']
const _COLORS = ['#A8D5BA', '#F4A261', '#C8B6E2', '#74B9FF', '#FD79A8', '#F7DC6F']

function loadLedgers(): Ledger[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    { id: 'default', name: '我们的账本', icon: '🏠', members: ['me', 'partner'], isDefault: true, archived: false, createdAt: new Date().toISOString() }
  ]
}

function saveLedgers(ledgers: Ledger[]) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledgers))
}

export default function LedgerManager({ onClose }: Props) {
  const [ledgers, setLedgers] = useState<Ledger[]>(loadLedgers)
  const [showForm, setShowForm] = useState(false)
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ledger | null>(null)
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('🏠')
  const [formMembers, setFormMembers] = useState<string[]>(['me'])
  const [showDetail, setShowDetail] = useState<Ledger | null>(null)

  const activeLedgers = ledgers.filter(l => !l.archived)
  const archivedLedgers = ledgers.filter(l => l.archived)

  const handleSave = () => {
    if (!formName.trim()) return
    if (editingLedger) {
      const updated = ledgers.map(l => l.id === editingLedger.id
        ? { ...l, name: formName.trim(), icon: formIcon, members: formMembers }
        : l)
      setLedgers(updated)
      saveLedgers(updated)
    } else {
      const newLedger: Ledger = {
        id: `ledger_${Date.now()}`,
        name: formName.trim(),
        icon: formIcon,
        members: formMembers,
        isDefault: ledgers.length === 0,
        archived: false,
        createdAt: new Date().toISOString()
      }
      const updated = [...ledgers, newLedger]
      setLedgers(updated)
      saveLedgers(updated)
    }
    setShowForm(false)
    setEditingLedger(null)
    setFormName('')
  }

  const handleSetDefault = (id: string) => {
    const updated = ledgers.map(l => ({ ...l, isDefault: l.id === id }))
    setLedgers(updated)
    saveLedgers(updated)
  }

  const handleArchive = (id: string) => {
    const updated = ledgers.map(l => l.id === id ? { ...l, archived: !l.archived } : l)
    setLedgers(updated)
    saveLedgers(updated)
    setShowDetail(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const updated = ledgers.filter(l => l.id !== deleteTarget.id)
    setLedgers(updated)
    saveLedgers(updated)
    // 迁移账单到默认账本
    const raw = localStorage.getItem('us_ledger_bills')
    if (raw) {
      const bills = JSON.parse(raw)
      const defaultLedger = updated.find(l => l.isDefault)
      bills.forEach((b: any) => {
        if (b.ledgerId === deleteTarget.id) b.ledgerId = defaultLedger?.id || 'default'
      })
      localStorage.setItem('us_ledger_bills', JSON.stringify(bills))
    }
    setDeleteTarget(null)
    setShowDetail(null)
  }

  const openEdit = (ledger: Ledger) => {
    setEditingLedger(ledger)
    setFormName(ledger.name)
    setFormIcon(ledger.icon)
    setFormMembers([...ledger.members])
    setShowForm(true)
    setShowDetail(null)
  }

  const openCreate = () => {
    setEditingLedger(null)
    setFormName('')
    setFormIcon('🏠')
    setFormMembers(['me'])
    setShowForm(true)
  }

  return (
    <div className="lm-overlay">
      <div className="lm-page">
        <header className="lm-header">
          <button className="lm-back" onClick={onClose}><X size={24} /></button>
          <h2>多账本</h2>
          <button className="lm-add-btn" onClick={openCreate}><Plus size={22} /></button>
        </header>

        <div className="lm-body">
          {activeLedgers.map(ledger => (
            <div key={ledger.id} className="lm-card" onClick={() => setShowDetail(ledger)}>
              <div className="lm-card-left">
                <span className="lm-card-icon">{ledger.icon}</span>
                <div className="lm-card-info">
                  <div className="lm-card-header">
                    <span className="lm-card-name">{ledger.name}</span>
                    {ledger.isDefault && <span className="lm-default-badge"><Star size={10} />默认</span>}
                  </div>
                  <span className="lm-card-meta">
                    {ledger.members.includes('partner') ? '双人账本' : '个人账本'}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color="#B2BEC3" />
            </div>
          ))}

          {archivedLedgers.length > 0 && (
            <div className="lm-section">
              <h3>已归档</h3>
              {archivedLedgers.map(ledger => (
                <div key={ledger.id} className="lm-card archived" onClick={() => setShowDetail(ledger)}>
                  <div className="lm-card-left">
                    <span className="lm-card-icon">{ledger.icon}</span>
                    <div className="lm-card-info">
                      <span className="lm-card-name">{ledger.name}</span>
                      <span className="lm-card-meta">已归档</span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#B2BEC3" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 详情底部弹窗 */}
        {showDetail && (
          <div className="lm-detail-overlay" onClick={() => setShowDetail(null)}>
            <div className="lm-detail-sheet" onClick={e => e.stopPropagation()}>
              <div className="sheet-handle"></div>
              <h3>{showDetail.icon} {showDetail.name}</h3>
              <p className="lm-detail-meta">
                {showDetail.members.includes('partner') ? '双人' : '个人'}账本 · 创建于 {showDetail.createdAt.slice(0, 10)}
              </p>
              <div className="lm-detail-actions">
                {!showDetail.isDefault && (
                  <button className="lm-detail-btn" onClick={() => handleSetDefault(showDetail.id)}>
                    <Star size={18} /> 设为默认
                  </button>
                )}
                <button className="lm-detail-btn" onClick={() => openEdit(showDetail)}>
                  <Edit3 size={18} /> 编辑
                </button>
                <button className="lm-detail-btn" onClick={() => handleArchive(showDetail.id)}>
                  {showDetail.archived ? <RotateCcw size={18} /> : <Archive size={18} />}
                  {showDetail.archived ? '恢复' : '归档'}
                </button>
                {ledgers.length > 1 && (
                  <button className="lm-detail-btn danger" onClick={() => setDeleteTarget(showDetail)}>
                    <Trash2 size={18} /> 删除
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 新建/编辑表单 */}
        {showForm && (
          <div className="lm-form-overlay" onClick={() => { setShowForm(false); setEditingLedger(null) }}>
            <div className="lm-form" onClick={e => e.stopPropagation()}>
              <h3>{editingLedger ? '编辑账本' : '新建账本'}</h3>
              <input className="lm-form-input" placeholder="账本名称" value={formName} onChange={e => setFormName(e.target.value)} autoFocus maxLength={12} />
              <div className="lm-form-label">选择图标</div>
              <div className="lm-icon-grid">
                {EMOJIS.map(e => (
                  <button key={e} className={`lm-icon-btn ${formIcon === e ? 'active' : ''}`} onClick={() => setFormIcon(e)}>{e}</button>
                ))}
              </div>
              <div className="lm-form-label">成员</div>
              <div className="lm-member-chips">
                <button className={`lm-chip ${formMembers.includes('me') ? 'active' : ''}`} onClick={() => setFormMembers(formMembers.includes('me') ? formMembers.filter(m => m !== 'me') : [...formMembers, 'me'])}>我</button>
                <button className={`lm-chip ${formMembers.includes('partner') ? 'active' : ''}`} onClick={() => setFormMembers(formMembers.includes('partner') ? formMembers.filter(m => m !== 'partner') : [...formMembers, 'partner'])}>伴侣</button>
              </div>
              <div className="lm-form-btns">
                <button className="lm-form-cancel" onClick={() => { setShowForm(false); setEditingLedger(null) }}>取消</button>
                <button className="lm-form-confirm" onClick={handleSave}>{editingLedger ? '保存' : '创建'}</button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认 */}
        {deleteTarget && (
          <div className="lm-form-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="lm-form" onClick={e => e.stopPropagation()}>
              <h3>删除「{deleteTarget.name}」</h3>
              <p className="lm-delete-warn">该账本下的账单将迁移到默认账本</p>
              <div className="lm-form-btns">
                <button className="lm-form-cancel" onClick={() => setDeleteTarget(null)}>取消</button>
                <button className="lm-form-confirm danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
