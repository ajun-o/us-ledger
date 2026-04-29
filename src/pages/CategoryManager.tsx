import { useState } from 'react'
import { X, Plus, Edit3, Trash2, EyeOff } from 'lucide-react'
import './CategoryManager.css'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  parentId?: string
  isSystem: boolean
  hidden: boolean
}

type CatType = 'expense' | 'income'

interface Props {
  onClose: () => void
}

const CATEGORIES_KEY = 'us_ledger_categories'

const EMOJIS = ['🍜', '🚗', '🛒', '🎮', '🏠', '🏥', '📚', '💻', '👕', '✈️', '🐱', '🎁', '💊', '🎬', '☕', '📱', '💡', '🔧', '💄', '🏋️']
const COLORS = ['#FF6B6B', '#E74C3C', '#F4A261', '#45B7D1', '#4ECDC4', '#A8D5BA', '#96CEB4', '#DDA0DD', '#F7DC6F', '#C8B6E2', '#74B9FF', '#636E72']

const systemExpenseCategories: Category[] = [
  { id: 'sys_food', name: '餐饮', icon: '🍜', color: '#FF6B6B', isSystem: true, hidden: false },
  { id: 'sys_transport', name: '交通', icon: '🚗', color: '#45B7D1', isSystem: true, hidden: false },
  { id: 'sys_shopping', name: '购物', icon: '🛒', color: '#F4A261', isSystem: true, hidden: false },
  { id: 'sys_entertainment', name: '娱乐', icon: '🎮', color: '#DDA0DD', isSystem: true, hidden: false },
  { id: 'sys_housing', name: '居住', icon: '🏠', color: '#636E72', isSystem: true, hidden: false },
  { id: 'sys_medical', name: '医疗', icon: '🏥', color: '#E74C3C', isSystem: true, hidden: false },
  { id: 'sys_education', name: '教育', icon: '📚', color: '#74B9FF', isSystem: true, hidden: false },
  { id: 'sys_other', name: '其他', icon: '🔧', color: '#B2BEC3', isSystem: true, hidden: false }
]

const systemIncomeCategories: Category[] = [
  { id: 'sys_salary', name: '工资', icon: '💰', color: '#27AE60', isSystem: true, hidden: false },
  { id: 'sys_parttime', name: '兼职', icon: '💼', color: '#4ECDC4', isSystem: true, hidden: false },
  { id: 'sys_investment', name: '理财', icon: '📈', color: '#45B7D1', isSystem: true, hidden: false },
  { id: 'sys_redpacket', name: '红包', icon: '🧧', color: '#E74C3C', isSystem: true, hidden: false },
  { id: 'sys_other_income', name: '其他', icon: '📦', color: '#B2BEC3', isSystem: true, hidden: false }
]

function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // 首次初始化
  const all = [...systemExpenseCategories, ...systemIncomeCategories]
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(all))
  return all
}

function saveCategories(cats: Category[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats))
}

export default function CategoryManager({ onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>(loadCategories)
  const [activeTab, setActiveTab] = useState<CatType>('expense')
  const [swipedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteAction, setDeleteAction] = useState<'migrate' | 'keep'>('keep')

  // 新分类表单
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('📦')
  const [newColor, setNewColor] = useState('#FF6B6B')
  const [newParentId, setNewParentId] = useState('')

  const filteredCats = categories.filter(c => {
    const isExpense = systemExpenseCategories.some(s => s.id === c.id) || (!systemIncomeCategories.some(s => s.id === c.id) && activeTab === 'expense')
    const isIncome = systemIncomeCategories.some(s => s.id === c.id) || (!systemExpenseCategories.some(s => s.id === c.id) && activeTab === 'income')
    if (activeTab === 'expense') return isExpense || (!c.isSystem && c.id.includes('_e_'))
    if (activeTab === 'income') return isIncome || (!c.isSystem && c.id.includes('_i_'))
    return true
  })

  const handleToggleHide = (id: string) => {
    const updated = categories.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c)
    setCategories(updated)
    saveCategories(updated)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const id = `custom_${activeTab === 'expense' ? 'e' : 'i'}_${Date.now()}`
    const cat: Category = {
      id,
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      parentId: newParentId || undefined,
      isSystem: false,
      hidden: false
    }
    const updated = [...categories, cat]
    setCategories(updated)
    saveCategories(updated)
    setShowAddForm(false)
    setNewName('')
    setNewIcon('📦')
    setNewColor('#FF6B6B')
    setNewParentId('')
  }

  const handleEdit = () => {
    if (!editingCat || !newName.trim()) return
    const updated = categories.map(c => c.id === editingCat.id
      ? { ...c, name: newName.trim(), icon: newIcon, color: newColor, parentId: newParentId || undefined }
      : c)
    setCategories(updated)
    saveCategories(updated)
    setEditingCat(null)
    setNewName('')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    let updated = categories.filter(c => c.id !== deleteTarget.id)
    // 迁移：更新账单中该分类为"未分类"
    if (deleteAction === 'migrate') {
      const raw = localStorage.getItem('us_ledger_bills')
      if (raw) {
        const bills = JSON.parse(raw)
        bills.forEach((b: any) => {
          if (b.categoryName === deleteTarget.name) {
            b.categoryName = '其他'
            b.categoryIcon = '📦'
          }
        })
        localStorage.setItem('us_ledger_bills', JSON.stringify(bills))
      }
    } else {
      // 保留：账单保持原分类不变（但分类已删除）
    }
    setCategories(updated)
    saveCategories(updated)
    setDeleteTarget(null)
    setDeleteAction('keep')
  }

  const startEdit = (cat: Category) => {
    setEditingCat(cat)
    setNewName(cat.name)
    setNewIcon(cat.icon)
    setNewColor(cat.color)
    setNewParentId(cat.parentId || '')
  }

  return (
    <div className="cm-overlay">
      <div className="cm-page">
        <header className="cm-header">
          <button className="cm-back" onClick={onClose}><X size={24} /></button>
          <h2>收支分类</h2>
          <button className="cm-add-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={22} />
          </button>
        </header>

        {/* 支出/收入切换 */}
        <div className="cm-tabs">
          <button className={`cm-tab ${activeTab === 'expense' ? 'active expense' : ''}`} onClick={() => setActiveTab('expense')}>支出</button>
          <button className={`cm-tab ${activeTab === 'income' ? 'active income' : ''}`} onClick={() => setActiveTab('income')}>收入</button>
        </div>

        <div className="cm-list">
          {filteredCats.map(cat => (
            <div
              key={cat.id}
              className={`cm-item ${cat.hidden ? 'hidden' : ''} ${swipedId === cat.id ? 'swiped' : ''}`}
            >
              <div className="cm-item-main" onClick={() => cat.isSystem ? handleToggleHide(cat.id) : startEdit(cat)}>
                <span className="cm-item-icon" style={{ background: cat.color + '20' }}>{cat.icon}</span>
                <span className="cm-item-name">{cat.name}</span>
                {cat.isSystem && (
                  <span className="cm-sys-tag">系统</span>
                )}
                {cat.hidden && <EyeOff size={14} className="cm-hidden-icon" />}
                {!cat.isSystem && (
                  <div className="cm-item-actions">
                    <button className="cm-edit-btn" onClick={(e) => { e.stopPropagation(); startEdit(cat) }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="cm-del-btn" onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat) }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 添加/编辑表单 */}
        {(showAddForm || editingCat) && (
          <div className="cm-form-overlay" onClick={() => { setShowAddForm(false); setEditingCat(null) }}>
            <div className="cm-form" onClick={e => e.stopPropagation()}>
              <h3>{editingCat ? '编辑分类' : '新建分类'}</h3>

              <input
                className="cm-form-input"
                placeholder="分类名称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                maxLength={8}
              />

              <div className="cm-form-label">选择图标</div>
              <div className="cm-emoji-grid">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    className={`cm-emoji-btn ${newIcon === emoji ? 'active' : ''}`}
                    onClick={() => setNewIcon(emoji)}
                  >{emoji}</button>
                ))}
              </div>

              <div className="cm-form-label">选择颜色</div>
              <div className="cm-color-grid">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={`cm-color-btn ${newColor === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>

              <div className="cm-form-btns">
                <button className="cm-form-cancel" onClick={() => { setShowAddForm(false); setEditingCat(null) }}>
                  取消
                </button>
                <button className="cm-form-confirm" onClick={editingCat ? handleEdit : handleAdd}>
                  {editingCat ? '保存修改' : '确认添加'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认 */}
        {deleteTarget && (
          <div className="cm-form-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="cm-form" onClick={e => e.stopPropagation()}>
              <h3>删除「{deleteTarget.name}」</h3>
              <p className="cm-delete-desc">该分类下已有账单记录，请选择处理方式：</p>
              <div className="cm-delete-options">
                <button
                  className={`cm-delete-opt ${deleteAction === 'keep' ? 'active' : ''}`}
                  onClick={() => setDeleteAction('keep')}
                >
                  保留为未分类
                </button>
                <button
                  className={`cm-delete-opt ${deleteAction === 'migrate' ? 'active' : ''}`}
                  onClick={() => setDeleteAction('migrate')}
                >
                  迁移到「其他」
                </button>
              </div>
              <div className="cm-form-btns">
                <button className="cm-form-cancel" onClick={() => setDeleteTarget(null)}>取消</button>
                <button className="cm-form-confirm danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
