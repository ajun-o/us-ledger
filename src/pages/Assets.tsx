import { useState } from 'react'
import { ChevronLeft, Plus, Wallet, Smartphone, CreditCard, Building2, PiggyBank } from 'lucide-react'
import './Assets.css'

interface Props {
  onBack: () => void
}

const accounts = [
  { id: 'cash', icon: Wallet, name: '现金', balance: 0.00, color: '#27AE60' },
  { id: 'wechat', icon: Smartphone, name: '微信', balance: 0.00, color: '#07C160' },
  { id: 'alipay', icon: Smartphone, name: '支付宝', balance: 0.00, color: '#1677FF' },
  { id: 'bank', icon: Building2, name: '银行卡', balance: 0.00, color: '#636E72' },
  { id: 'savings', icon: PiggyBank, name: '储蓄', balance: 0.00, color: '#F4A261' }
]

export default function Assets({ onBack }: Props) {
  const [showAmount, setShowAmount] = useState(true)
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="assets-page">
      <header className="assets-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <h1>资产管理</h1>
        <button className="add-btn">
          <Plus size={20} />
        </button>
      </header>

      <main className="assets-main">
        {/* 总资产卡片 */}
        <div className="total-card">
          <span className="total-label">总资产</span>
          <span className="total-amount" onClick={() => setShowAmount(!showAmount)}>
            ¥ {showAmount ? totalBalance.toFixed(2) : '****'}
          </span>
        </div>

        {/* 账户列表 */}
        <div className="accounts-list">
          {accounts.map(account => {
            const Icon = account.icon
            return (
              <div key={account.id} className="account-item">
                <div className="account-left">
                  <div className="account-icon" style={{ background: account.color + '15' }}>
                    <Icon size={20} color={account.color} />
                  </div>
                  <span className="account-name">{account.name}</span>
                </div>
                <span className="account-balance">
                  ¥ {showAmount ? account.balance.toFixed(2) : '****'}
                </span>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
