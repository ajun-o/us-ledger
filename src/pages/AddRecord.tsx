import { useState, useRef, useEffect } from 'react'
import {
  X,
  Check,
  Calendar,
  Tag,
  MapPin,
  Image,
  ChevronUp,
  Clock,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { type BillItem, createBill } from '../lib/bills'
import { type Account, fetchAccounts, getAccountBalance } from '../lib/accounts'
import { hasPartner, getPartnerName } from '../lib/couple'
import './AddRecord.css'

type MemberType = 'mine' | 'partner' | 'joint'
type RecordType = 'expense' | 'income'

interface Props {
  onClose: () => void
  onSave: (message: string) => void
  onError: (message: string) => void
  defaultMember?: MemberType
}

export default function AddRecord({ onClose, onSave, onError, defaultMember = 'joint' }: Props) {
  const [amount, setAmount] = useState('')
  const [member, setMember] = useState<MemberType>(defaultMember)
  const [recordType, setRecordType] = useState<RecordType>('expense')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ amount?: boolean; category?: boolean }>({})
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<BillItem[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [showAccountSheet, setShowAccountSheet] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMention, setShowMention] = useState(false)
  const noteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const accts = fetchAccounts()
    setAccounts(accts)
    if (!account && accts.length > 0) setAccount(accts[0])
    import('../lib/bills').then(m => m.fetchBills().then(setBills).catch(() => {}))
  }, [])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const nowStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`
  const [billDate, setBillDate] = useState(todayStr)
  const [billTime, setBillTime] = useState(nowStr)

  const partnerName = getPartnerName()
  const partnerBound = hasPartner()

  const dateLabel = billDate === todayStr ? '今天' : billDate

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
    setErrors(prev => ({ ...prev, amount: false }))
  }

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1))
    setErrors(prev => ({ ...prev, amount: false }))
  }

  const handleSave = async () => {
    const newErrors: { amount?: boolean; category?: boolean } = {}
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = true
    }
    if (!selectedCategory) {
      newErrors.category = true
    }
    if (Object.keys(newErrors).length > 0 || saving) {
      setErrors(newErrors)
      setTimeout(() => setErrors({}), 600)
      return
    }

    const cat = categories.find(c => c.id === selectedCategory)
    if (!cat) return

    setSaving(true)
    try {
      await createBill({
        categoryIcon: cat.icon,
        categoryName: cat.label,
        note,
        amount: Number(amount),
        type: recordType,
        member,
        date: billDate,
        time: billTime,
        account: account?.name ?? ''
      })
      onSave('记账成功')
    } catch (e) {
      console.error('保存账单失败', e)
      const msg = e instanceof Error && e.message === 'OFFLINE_QUEUED'
        ? '已加入离线队列，联网后自动同步'
        : '保存失败，请重试'
      onError(msg)
      if (e instanceof Error && e.message === 'OFFLINE_QUEUED') {
        onClose()
      } else {
        setSaving(false)
      }
    }
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNote(val)
    if (val.endsWith('@')) {
      setShowMention(true)
    } else {
      setShowMention(false)
    }
  }

  const handleInsertMention = () => {
    setNote(prev => prev.replace(/@$/, `@${partnerName} `))
    setShowMention(false)
    noteRef.current?.focus()
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

        {/* 中间可滚动内容 */}
        <div className="record-body">
          {/* 金额输入 */}
          <div className={`amount-section ${errors.amount ? 'shake' : ''}`}>
            <span className="currency">¥</span>
            <span className="amount-display">{amount || '0.00'}</span>
          </div>

          {/* 成员选择 */}
          <div className="member-selector">
            {(Object.keys(memberLabels) as MemberType[]).map((key) => (
              <button
                key={key}
                className={`member-btn ${member === key ? 'active' : ''} ${key === 'partner' && !partnerBound ? 'disabled' : ''}`}
                onClick={() => {
                  if (key === 'partner' && !partnerBound) return
                  setMember(key)
                }}
                disabled={key === 'partner' && !partnerBound}
              >
                {memberLabels[key]}
                {key === 'partner' && !partnerBound ? ' 🔒' : ''}
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
          <div className={`category-grid ${errors.category ? 'shake' : ''}`}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-item ${selectedCategory === cat.id ? 'selected' : ''}`}
                onClick={() => { setSelectedCategory(cat.id); setErrors(prev => ({ ...prev, category: false })) }}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 账户选择 */}
          <div className="account-row">
            <button className="account-select-btn" onClick={() => setShowAccountSheet(true)}>
              <span className="account-select-icon">{account?.icon ?? ''}</span>
              <span className="account-select-name">{account?.name ?? ''}</span>
              <span className="account-select-balance">余额 ¥{(account ? getAccountBalance(account.name, bills) : 0).toFixed(2)}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 备注 */}
          {showNote ? (
            <div className="note-input-wrapper">
              <div className="note-input">
                <input
                  ref={noteRef}
                  type="text"
                  placeholder="添加备注... 输入@提及对方"
                  value={note}
                  onChange={handleNoteChange}
                  autoFocus
                />
              </div>
              {showMention && (
                <div className="mention-dropdown">
                  <button className="mention-item" onClick={handleInsertMention}>
                    <span className="mention-avatar">TA</span>
                    <span className="mention-name">@{partnerName}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="note-toggle" onClick={() => setShowNote(true)}>
              <span>添加备注</span>
            </button>
          )}

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
                <div className="option-item" onClick={() => setShowDatePicker(!showDatePicker)}>
                  <Calendar size={18} />
                  <span>日期</span>
                  <span className="option-value">{dateLabel} {billTime}</span>
                </div>
                {showDatePicker && (
                  <div className="date-picker-row">
                    <input
                      type="date"
                      value={billDate}
                      max={todayStr}
                      onChange={e => setBillDate(e.target.value)}
                      className="date-input"
                    />
                    <input
                      type="time"
                      value={billTime}
                      onChange={e => setBillTime(e.target.value)}
                      className="time-input"
                    />
                  </div>
                )}
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

          {/* 最近一笔快捷复制 */}
          <div className="recent-record">
            <Clock size={14} />
            <span>最近：午餐 ¥25.00</span>
          </div>
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
            <button className="key confirm" onClick={handleSave} disabled={saving}>{saving ? '...' : '确定'}</button>
          </div>
          <div className="keyboard-row">
            <button className="key" onClick={() => handleNumberClick('0')}>0</button>
            <button className="key" onClick={() => handleNumberClick('.')}>.</button>
            <button className="key zero">00</button>
            <button className="key confirm" onClick={handleSave} disabled={saving}>{saving ? '...' : '确定'}</button>
          </div>
        </div>
      </div>

      {/* 账户选择弹窗 */}
      {showAccountSheet && (
        <div className="account-sheet-overlay" onClick={() => setShowAccountSheet(false)}>
          <div className="account-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h3>选择账户</h3>
            <div className="account-sheet-list">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  className={`account-sheet-item ${account?.id === acc.id ? 'selected' : ''}`}
                  onClick={() => { setAccount(acc); setShowAccountSheet(false) }}
                >
                  <div className="account-sheet-left">
                    <span className="account-sheet-icon">{acc.icon}</span>
                    <div className="account-sheet-info">
                      <span className="account-sheet-name">{acc.name}</span>
                      <span className="account-sheet-balance">余额 ¥{getAccountBalance(acc.name, bills).toFixed(2)}</span>
                    </div>
                  </div>
                  {account?.id === acc.id && <span className="account-sheet-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
