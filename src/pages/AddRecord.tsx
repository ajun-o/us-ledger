import { useState } from 'react'
import {
  X,
  Check,
  Calendar,
  Tag,
  MapPin,
  Image,
  ChevronUp,
  Clock,
  Loader2
} from 'lucide-react'
import { createBill } from '../lib/bills'
import './AddRecord.css'

type MemberType = 'mine' | 'partner' | 'joint'
type RecordType = 'expense' | 'income'

interface Props {
  onClose: () => void
  onSave: () => void
}

export default function AddRecord({ onClose, onSave }: Props) {
  const [amount, setAmount] = useState('')
  const [member, setMember] = useState<MemberType>('joint')
  const [recordType, setRecordType] = useState<RecordType>('expense')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [saving, setSaving] = useState(false)

  const expenseCategories = [
    { id: 'food', icon: '🍜', label: '餐饮' },
    { id: 'transport', icon: '🚗', label: '交通' },
    { id: 'shopping', icon: '🛒', label: '购物' },
    { id: 'entertainment', icon: '🎮', label: '娱乐' },
    { id: 'housing', icon: '🏠', label: '居住' },
    { id: 'medical', icon: '💊', label: '医疗' },
    { id: 'education', icon: '📚', label: '教育' },
    { id: 'other', icon: '📌', label: '其他' }
  ]

  const incomeCategories = [
    { id: 'salary', icon: '💰', label: '工资' },
    { id: 'parttime', icon: '💼', label: '兼职' },
    { id: 'invest', icon: '📈', label: '理财' },
    { id: 'redpacket', icon: '🧧', label: '红包' },
    { id: 'other', icon: '📌', label: '其他' }
  ]

  const categories = recordType === 'expense' ? expenseCategories : incomeCategories

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return
    setAmount(prev => prev + num)
  }

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1))
  }

  const handleSave = async () => {
    if (!amount || !selectedCategory || saving) return
    const cat = categories.find(c => c.id === selectedCategory)
    if (!cat) return

    setSaving(true)
    try {
      const now = new Date()
      await createBill({
        categoryIcon: cat.icon,
        categoryName: cat.label,
        note,
        amount: Number(amount),
        type: recordType,
        member,
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        account: member === 'mine' ? '微信' : '支付宝'
      })
      onSave()
    } catch (e) {
      console.error('保存账单失败', e)
      setSaving(false)
    }
  }

  const memberLabels: Record<MemberType, string> = {
    mine: '我',
    partner: 'TA',
    joint: '共同'
  }

  return (
    <div className="add-record-overlay">
      <div className="add-record-sheet">
        {/* 顶部 */}
        <div className="sheet-header">
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>记一笔</h2>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={20} className="spinning" /> : <Check size={20} />}
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>

        {/* 金额输入 */}
        <div className="amount-section">
          <span className="currency">¥</span>
          <span className="amount-display">{amount || '0.00'}</span>
        </div>

        {/* 成员选择 */}
        <div className="member-selector">
          {(Object.keys(memberLabels) as MemberType[]).map((key) => (
            <button
              key={key}
              className={`member-btn ${member === key ? 'active' : ''}`}
              onClick={() => setMember(key)}
            >
              {memberLabels[key]}
            </button>
          ))}
        </div>

        {/* 收支切换 */}
        <div className="type-tabs">
          <button
            className={`type-tab ${recordType === 'expense' ? 'active expense' : ''}`}
            onClick={() => setRecordType('expense')}
          >
            支出
          </button>
          <button
            className={`type-tab ${recordType === 'income' ? 'active income' : ''}`}
            onClick={() => setRecordType('income')}
          >
            收入
          </button>
        </div>

        {/* 分类选择 */}
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-item ${selectedCategory === cat.id ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-label">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 更多选项 */}
        <div className="more-section">
          <button
            className="more-toggle"
            onClick={() => setShowMore(!showMore)}
          >
            <span>更多选项</span>
            <ChevronUp size={16} className={showMore ? 'rotated' : ''} />
          </button>

          {showMore && (
            <div className="more-options">
              <div className="option-item">
                <Calendar size={18} />
                <span>日期</span>
                <span className="option-value">今天</span>
              </div>
              <div className="option-item">
                <Tag size={18} />
                <span>标签</span>
              </div>
              <div className="option-item">
                <Image size={18} />
                <span>图片附件</span>
              </div>
              <div className="option-item">
                <MapPin size={18} />
                <span>位置</span>
              </div>
            </div>
          )}
        </div>

        {/* 备注 */}
        {showNote ? (
          <div className="note-input">
            <input
              type="text"
              placeholder="添加备注... 输入@提及对方"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
          </div>
        ) : (
          <button className="note-toggle" onClick={() => setShowNote(true)}>
            <span>添加备注</span>
          </button>
        )}

        {/* 最近一笔快捷复制 */}
        <div className="recent-record">
          <Clock size={14} />
          <span>最近：午餐 ¥25.00</span>
        </div>

        {/* 数字键盘 */}
        <div className="keyboard">
          <div className="keyboard-row">
            <button className="key" onClick={() => handleNumberClick('1')}>1</button>
            <button className="key" onClick={() => handleNumberClick('2')}>2</button>
            <button className="key" onClick={() => handleNumberClick('3')}>3</button>
            <button className="key delete" onClick={handleDelete}>删除</button>
          </div>
          <div className="keyboard-row">
            <button className="key" onClick={() => handleNumberClick('4')}>4</button>
            <button className="key" onClick={() => handleNumberClick('5')}>5</button>
            <button className="key" onClick={() => handleNumberClick('6')}>6</button>
            <button className="key plus" onClick={() => handleNumberClick('+')}>+</button>
          </div>
          <div className="keyboard-row">
            <button className="key" onClick={() => handleNumberClick('7')}>7</button>
            <button className="key" onClick={() => handleNumberClick('8')}>8</button>
            <button className="key" onClick={() => handleNumberClick('9')}>9</button>
            <button className="key confirm" onClick={handleSave}>确定</button>
          </div>
          <div className="keyboard-row">
            <button className="key" onClick={() => handleNumberClick('0')}>0</button>
            <button className="key" onClick={() => handleNumberClick('.')}>.</button>
            <button className="key zero">00</button>
            <button className="key confirm" onClick={handleSave}>确定</button>
          </div>
        </div>
      </div>
    </div>
  )
}
