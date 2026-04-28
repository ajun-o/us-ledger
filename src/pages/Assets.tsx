import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  Plus,
  Eye,
  EyeOff,
  X,
  Edit3,
  Trash2,
  ChevronRight
} from 'lucide-react'
import {
  type Account,
  type BalanceAdjustment,
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  fetchAdjustments,
  addAdjustment,
  getBillAccountNames
} from '../lib/accounts'
import { type BillItem, fetchBills } from '../lib/bills'
import './Assets.css'

interface Props {
  onBack: () => void
}

const ACCOUNT_ICONS = ['💬', '💳', '🏦', '💵', '💎', '🏠', '🐷', '📱', '💰', '🎯']

export default function Assets({ onBack }: Props) {
  const [showAmount, setShowAmount] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<BillItem[]>([])
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [detailAccount, setDetailAccount] = useState<Account | null>(null)
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([])
  const [showAdjustSheet, setShowAdjustSheet] = useState(false)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef(0)

  // 添加表单
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('💳')
  const [formInitBalance, setFormInitBalance] = useState('')

  // 编辑表单
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')

  // 调整表单
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')

  useEffect(() => {
    const accts = fetchAccounts()
    setAccounts(accts)
    fetchBills().then(setBills).catch(() => setBills([]))
  }, [])

  const refreshData = () => {
    setAccounts(fetchAccounts())
    fetchBills().then(setBills).catch(() => setBills([]))
  }

  const totalBalance = accounts.reduce((s, a) => s + getAccountBalance(a.name, bills), 0)

  const handleOpenDetail = (account: Account) => {
    setDetailAccount(account)
    setAdjustments(fetchAdjustments(account.id))
  }

  const handleAddAccount = () => {
    if (!formName.trim()) return
    createAccount({
      name: formName.trim(),
      icon: formIcon,
      initialBalance: parseFloat(formInitBalance) || 0
    })
    setFormName('')
    setFormIcon('💳')
    setFormInitBalance('')
    setShowAddSheet(false)
    refreshData()
  }

  const handleOpenEdit = (account: Account) => {
    setSwipedId(null)
    setEditTarget(account)
    setEditName(account.name)
    setEditIcon(account.icon)
  }

  const handleSaveEdit = () => {
    if (!editTarget || !editName.trim()) return
    const oldName = editTarget.name
    updateAccount(editTarget.id, { name: editName.trim(), icon: editIcon })
    // 账单中的 account 字符串也需要同步更新
    if (oldName !== editName.trim()) {
      const raw = localStorage.getItem('us_ledger_bills')
      if (raw) {
        const allBills: BillItem[] = JSON.parse(raw)
        let changed = false
        allBills.forEach(b => {
          if (b.account === oldName) { b.account = editName.trim(); changed = true }
        })
        if (changed) localStorage.setItem('us_ledger_bills', JSON.stringify(allBills))
      }
    }
    setEditTarget(null)
    refreshData()
    if (detailAccount?.id === editTarget.id) setDetailAccount(null)
  }

  const handleDeleteAccount = () => {
    if (!deleteTarget) return
    const billCounts = getBillAccountNames(bills)
    const count = billCounts.get(deleteTarget.name) || 0
    deleteAccount(deleteTarget.id)
    setDeleteTarget(null)
    if (detailAccount?.id === deleteTarget.id) setDetailAccount(null)
    refreshData()
  }

  const handleAddAdjustment = () => {
    const amount = parseFloat(adjAmount)
    if (!detailAccount || isNaN(amount) || amount === 0) return
    addAdjustment({
      accountId: detailAccount.id,
      amount,
      reason: adjReason.trim() || '手动调整'
    })
    setAdjAmount('')
    setAdjReason('')
    setShowAdjustSheet(false)
    setAdjustments(fetchAdjustments(detailAccount.id))
    refreshData()
  }

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX
    setSwipedId(null)
  }

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 60) {
      if (diff > 60) setSwipedId(id)
      else if (diff < -60) setSwipedId(null)
    }
  }

  const handleSwipeEdit = (account: Account) => {
    handleOpenEdit(account)
  }

  const handleSwipeDelete = (account: Account) => {
    setSwipedId(null)
    setDeleteTarget(account)
  }

  return (
    <div className="assets-page">
      <header className="assets-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <h1>资产管理</h1>
        <button className="add-btn" onClick={() => setShowAddSheet(true)}>
          <Plus size={20} />
        </button>
      </header>

      <main className="assets-main">
        {/* 总资产卡片 */}
        <div className="total-card">
          <span className="total-label">
            总资产（{accounts.length}个账户）
          </span>
          <div className="total-amount-row">
            <span className="total-amount" onClick={() => setShowAmount(!showAmount)}>
              ¥ {showAmount ? totalBalance.toFixed(2) : '****'}
            </span>
            <button className="eye-btn" onClick={() => setShowAmount(!showAmount)}>
              {showAmount ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        {/* 账户列表 */}
        {accounts.length === 0 ? (
          <div className="accounts-empty">
            <p>还没有账户</p>
            <button className="create-first-btn" onClick={() => setShowAddSheet(true)}>
              <Plus size={16} />
              <span>创建第一个账户</span>
            </button>
          </div>
        ) : (
          <div className="accounts-list">
            {accounts.map(account => {
              const balance = getAccountBalance(account.name, bills)
              return (
                <div
                  key={account.id}
                  className="account-item-wrapper"
                  onTouchStart={(e) => handleTouchStart(e, account.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, account.id)}
                >
                  <div
                    className={`account-item ${swipedId === account.id ? 'swiped' : ''}`}
                    onClick={() => {
                      if (swipedId) setSwipedId(null)
                      else handleOpenDetail(account)
                    }}
                  >
                    <div className="account-left">
                      <div className="account-icon">{account.icon}</div>
                      <span className="account-name">{account.name}</span>
                    </div>
                    <div className="account-right">
                      <span className="account-balance">
                        ¥ {showAmount ? balance.toFixed(2) : '****'}
                      </span>
                      <ChevronRight size={16} color="#B2BEC3" />
                    </div>
                  </div>
                  <div className="account-actions">
                    <button className="action-edit" onClick={() => handleSwipeEdit(account)}>
                      <Edit3 size={16} />
                      <span>编辑</span>
                    </button>
                    <button className="action-delete" onClick={() => handleSwipeDelete(account)}>
                      <Trash2 size={16} />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* 账户详情/调整页 */}
      {detailAccount && (() => {
        const balance = getAccountBalance(detailAccount.name, bills)
        const income = bills.filter(b => b.account === detailAccount.name && b.type === 'income').reduce((s, b) => s + b.amount, 0)
        const expense = bills.filter(b => b.account === detailAccount.name && b.type === 'expense').reduce((s, b) => s + b.amount, 0)
        const adjTotal = adjustments.reduce((s, a) => s + a.amount, 0)
        return (
          <div className="account-detail-overlay" onClick={() => setDetailAccount(null)}>
            <div className="account-detail-sheet" onClick={e => e.stopPropagation()}>
              <div className="detail-sheet-header">
                <h2>{detailAccount.icon} {detailAccount.name}</h2>
                <button onClick={() => setDetailAccount(null)}><X size={20} /></button>
              </div>

              <div className="detail-balance-card">
                <span className="detail-balance-label">当前余额</span>
                <span className="detail-balance-value">¥ {balance.toFixed(2)}</span>
              </div>

              <div className="detail-breakdown">
                <div className="breakdown-row">
                  <span>初始余额</span>
                  <span>¥ {detailAccount.initialBalance.toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                  <span>余额调整</span>
                  <span className={adjTotal >= 0 ? 'positive' : 'negative'}>
                    {adjTotal >= 0 ? '+' : ''}¥ {adjTotal.toFixed(2)}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span>累计收入</span>
                  <span className="positive">+¥ {income.toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                  <span>累计支出</span>
                  <span className="negative">-¥ {expense.toFixed(2)}</span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-header">
                  <h3>余额调整记录</h3>
                  <button onClick={() => setShowAdjustSheet(true)}>
                    <Plus size={16} />
                    <span>调整</span>
                  </button>
                </div>
                {adjustments.length === 0 ? (
                  <p className="adj-empty">暂无调整记录</p>
                ) : (
                  <div className="adj-list">
                    {adjustments.map(adj => (
                      <div key={adj.id} className="adj-item">
                        <div className="adj-info">
                          <span className="adj-reason">{adj.reason}</span>
                          <span className="adj-date">{adj.createdAt.slice(0, 10)}</span>
                        </div>
                        <span className={`adj-amount ${adj.amount >= 0 ? 'positive' : 'negative'}`}>
                          {adj.amount >= 0 ? '+' : ''}¥ {adj.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 调整余额弹窗 */}
      {showAdjustSheet && (
        <div className="sheet-overlay" onClick={() => setShowAdjustSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>调整余额</h3>
              <button onClick={() => setShowAdjustSheet(false)}><X size={20} /></button>
            </div>
            <div className="sheet-body">
              <div className="form-group">
                <label>调整金额（正数增加，负数减少）</label>
                <input
                  type="number"
                  placeholder="例如：+100 或 -50"
                  value={adjAmount}
                  onChange={e => setAdjAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>调整原因</label>
                <input
                  type="text"
                  placeholder="请输入原因"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                />
              </div>
            </div>
            <div className="sheet-footer">
              <button className="sheet-confirm-btn" onClick={handleAddAdjustment}>确认调整</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加账户弹窗 */}
      {showAddSheet && (
        <div className="sheet-overlay" onClick={() => setShowAddSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>添加账户</h3>
              <button onClick={() => setShowAddSheet(false)}><X size={20} /></button>
            </div>
            <div className="sheet-body">
              <div className="form-group">
                <label>账户名称</label>
                <input
                  type="text"
                  placeholder="例如：工商银行"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>选择图标</label>
                <div className="icon-grid">
                  {ACCOUNT_ICONS.map(icon => (
                    <button
                      key={icon}
                      className={`icon-chip ${formIcon === icon ? 'active' : ''}`}
                      onClick={() => setFormIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>初始余额</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formInitBalance}
                  onChange={e => setFormInitBalance(e.target.value)}
                />
              </div>
            </div>
            <div className="sheet-footer">
              <button className="sheet-confirm-btn" onClick={handleAddAccount}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑账户弹窗 */}
      {editTarget && (
        <div className="sheet-overlay" onClick={() => setEditTarget(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>编辑账户</h3>
              <button onClick={() => setEditTarget(null)}><X size={20} /></button>
            </div>
            <div className="sheet-body">
              <div className="form-group">
                <label>账户名称</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>选择图标</label>
                <div className="icon-grid">
                  {ACCOUNT_ICONS.map(icon => (
                    <button
                      key={icon}
                      className={`icon-chip ${editIcon === icon ? 'active' : ''}`}
                      onClick={() => setEditIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sheet-footer">
              <button className="sheet-confirm-btn" onClick={handleSaveEdit}>保存修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="sheet-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-confirm" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">删除「{deleteTarget.name}」</p>
            <p className="confirm-desc">
              {(() => {
                const counts = getBillAccountNames(bills)
                const n = counts.get(deleteTarget.name) || 0
                return n > 0
                  ? `该账户有 ${n} 笔关联账单，账户名称将保留在历史账单中。`
                  : '确定要删除这个账户吗？'
              })()}
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="confirm-btn confirm" onClick={handleDeleteAccount}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
