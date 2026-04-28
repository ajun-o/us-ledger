import { useState } from 'react'
import {
  X,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Wallet
} from 'lucide-react'
import { type BillItem } from '../lib/bills'
import { fetchAccounts } from '../lib/accounts'
import './BillDetail.css'

type MemberType = 'mine' | 'partner' | 'joint'

interface Props {
  bill: BillItem
  onClose: () => void
  onSave: (bill: BillItem) => void
  onDelete: (bill: BillItem) => void
}

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

const accounts = fetchAccounts().map(a => a.name)

const memberLabels: Record<MemberType, string> = {
  mine: '我',
  partner: 'TA',
  joint: '共同'
}

export default function BillDetail({ bill, onClose, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editBill, setEditBill] = useState<BillItem>({ ...bill })

  const handleEdit = () => {
    setEditBill({ ...bill })
    setEditing(true)
  }

  const handleSave = () => {
    onSave(editBill)
    setEditing(false)
    onClose()
  }

  const handleDelete = () => {
    onDelete(bill)
    setShowDeleteConfirm(false)
    onClose()
  }

  const categories = editBill.type === 'expense' ? expenseCategories : incomeCategories

  return (
    <div className="bill-detail-overlay" onClick={onClose}>
      <div className="bill-detail-sheet" onClick={e => e.stopPropagation()}>
        {/* 顶部 */}
        <div className="detail-header">
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>{editing ? '编辑账单' : '账单详情'}</h2>
          {editing ? (
            <button className="save-btn" onClick={handleSave}>保存</button>
          ) : (
            <div className="header-actions">
              <button className="icon-btn" onClick={handleEdit}>
                <Edit3 size={18} />
              </button>
              <button className="icon-btn danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="detail-body">
          {/* 分类 */}
          <div className="detail-category">
            <span className="detail-cat-icon">
              {editing ? (
                <div className="category-edit-grid">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`category-edit-chip ${editBill.categoryIcon === cat.icon ? 'selected' : ''}`}
                      onClick={() => setEditBill({ ...editBill, categoryIcon: cat.icon, categoryName: cat.label })}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                bill.categoryIcon
              )}
            </span>
            {!editing && (
              <div className="detail-cat-text">
                <span className="detail-cat-name">{bill.categoryName}</span>
              </div>
            )}
          </div>

          {/* 金额 */}
          {editing ? (
            <div className="detail-amount-edit">
              <span className="currency">¥</span>
              <input
                type="number"
                value={editBill.amount}
                onChange={e => setEditBill({ ...editBill, amount: Number(e.target.value) })}
                className="amount-input"
              />
            </div>
          ) : (
            <div className="detail-amount">
              <span className={`amount-value ${bill.type}`}>
                {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
              </span>
            </div>
          )}

          {/* 类型切换（仅编辑模式） */}
          {editing && (
            <div className="edit-type-tabs">
              <button
                className={`type-tab ${editBill.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setEditBill({ ...editBill, type: 'expense', categoryIcon: '🍜', categoryName: '餐饮' })}
              >
                支出
              </button>
              <button
                className={`type-tab ${editBill.type === 'income' ? 'active income' : ''}`}
                onClick={() => setEditBill({ ...editBill, type: 'income', categoryIcon: '💰', categoryName: '工资' })}
              >
                收入
              </button>
            </div>
          )}

          {/* 详情字段 */}
          <div className="detail-fields">
            <div className="detail-field" onClick={() => editing && setShowDeleteConfirm(false)}>
              <span className="field-label">成员</span>
              {editing ? (
                <div className="edit-member-row">
                  {(Object.keys(memberLabels) as MemberType[]).map(key => (
                    <button
                      key={key}
                      className={`member-chip ${editBill.member === key ? 'active' : ''}`}
                      onClick={() => setEditBill({ ...editBill, member: key })}
                    >
                      {memberLabels[key]}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="field-value">{memberLabels[bill.member]}</span>
              )}
            </div>

            <div className="detail-field">
              <div className="field-left">
                <Calendar size={16} />
                <span className="field-label">日期</span>
              </div>
              {editing ? (
                <input
                  type="date"
                  value={editBill.date}
                  onChange={e => setEditBill({ ...editBill, date: e.target.value })}
                  className="field-input"
                />
              ) : (
                <span className="field-value">{bill.date}</span>
              )}
            </div>

            <div className="detail-field">
              <div className="field-left">
                <Clock size={16} />
                <span className="field-label">时间</span>
              </div>
              {editing ? (
                <input
                  type="time"
                  value={editBill.time}
                  onChange={e => setEditBill({ ...editBill, time: e.target.value })}
                  className="field-input"
                />
              ) : (
                <span className="field-value">{bill.time}</span>
              )}
            </div>

            <div className="detail-field">
              <div className="field-left">
                <Wallet size={16} />
                <span className="field-label">账户</span>
              </div>
              {editing ? (
                <div className="edit-account-row">
                  {accounts.map(acc => (
                    <button
                      key={acc}
                      className={`member-chip ${editBill.account === acc ? 'active' : ''}`}
                      onClick={() => setEditBill({ ...editBill, account: acc })}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="field-value">{bill.account}</span>
              )}
            </div>

            {bill.note && !editing && (
              <div className="detail-field">
                <span className="field-label">备注</span>
                <span className="field-value note">{bill.note}</span>
              </div>
            )}
            {editing && (
              <div className="detail-field">
                <span className="field-label">备注</span>
                <input
                  type="text"
                  value={editBill.note}
                  onChange={e => setEditBill({ ...editBill, note: e.target.value })}
                  className="field-input"
                  placeholder="添加备注"
                />
              </div>
            )}
          </div>
        </div>

        {/* 删除确认 */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="delete-confirm" onClick={e => e.stopPropagation()}>
              <p className="confirm-title">确认删除</p>
              <p className="confirm-desc">删除后无法恢复，确定要删除这笔账单吗？</p>
              <div className="confirm-actions">
                <button className="confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>取消</button>
                <button className="confirm-btn confirm" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
