import { useState, useEffect } from 'react'
import { X, Bell, BellOff } from 'lucide-react'
import './BudgetManager.css'

interface BudgetData {
  type: 'mine' | 'joint'
  totalBudget: number
  categoryBudgets: { name: string; amount: number }[]
  warningThreshold: number // 50-100
  overBudgetAlert: boolean
}

interface Props {
  onClose: () => void
}

const BUDGET_KEY = 'us_ledger_budgets'

const expenseCats = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '教育', '其他']

function loadBudgets(): { mine: BudgetData; joint: BudgetData } {
  try {
    const raw = localStorage.getItem(BUDGET_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    mine: { type: 'mine', totalBudget: 3000, categoryBudgets: [], warningThreshold: 80, overBudgetAlert: true },
    joint: { type: 'joint', totalBudget: 5000, categoryBudgets: [], warningThreshold: 80, overBudgetAlert: true }
  }
}

export default function BudgetManager({ onClose }: Props) {
  const [budgets, setBudgets] = useState(loadBudgets)
  const [budgetTab, setBudgetTab] = useState<'mine' | 'joint'>('mine')
  const [totalBudget, setTotalBudget] = useState(String(budgets.mine.totalBudget))
  const [categoryBudgets, setCategoryBudgets] = useState<{ name: string; amount: string }[]>([])
  const [warningThreshold, setWarningThreshold] = useState(budgets.mine.warningThreshold)
  const [overBudgetAlert, setOverBudgetAlert] = useState(budgets.mine.overBudgetAlert)

  useEffect(() => {
    const b = budgets[budgetTab]
    setTotalBudget(String(b.totalBudget))
    setCategoryBudgets(b.categoryBudgets.map(c => ({ name: c.name, amount: String(c.amount) })))
    setWarningThreshold(b.warningThreshold)
    setOverBudgetAlert(b.overBudgetAlert)
  }, [budgetTab, budgets])

  const handleSave = () => {
    const parsed = {
      type: budgetTab,
      totalBudget: parseFloat(totalBudget) || 0,
      categoryBudgets: categoryBudgets.filter(c => c.name && parseFloat(c.amount) > 0).map(c => ({ name: c.name, amount: parseFloat(c.amount) || 0 })),
      warningThreshold,
      overBudgetAlert
    }
    const updated = { ...budgets, [budgetTab]: parsed }
    setBudgets(updated)
    localStorage.setItem(BUDGET_KEY, JSON.stringify(updated))
    onClose()
  }

  const addCatBudget = () => {
    // 找到还没被添加的分类
    const used = new Set(categoryBudgets.map(c => c.name))
    const next = expenseCats.find(c => !used.has(c))
    if (next) setCategoryBudgets([...categoryBudgets, { name: next, amount: '' }])
  }

  const removeCatBudget = (idx: number) => {
    setCategoryBudgets(categoryBudgets.filter((_, i) => i !== idx))
  }

  return (
    <div className="bm-overlay">
      <div className="bm-page">
        <header className="bm-header">
          <button className="bm-back" onClick={onClose}><X size={24} /></button>
          <h2>预算设置</h2>
          <button className="bm-save" onClick={handleSave}>保存</button>
        </header>

        <div className="bm-tabs">
          <button className={`bm-tab ${budgetTab === 'mine' ? 'active' : ''}`} onClick={() => setBudgetTab('mine')}>我的预算</button>
          <button className={`bm-tab ${budgetTab === 'joint' ? 'active' : ''}`} onClick={() => setBudgetTab('joint')}>共同预算</button>
        </div>

        <div className="bm-body">
          {/* 总预算 */}
          <div className="bm-section">
            <h3>总预算金额</h3>
            <div className="bm-amount-input">
              <span className="bm-currency">¥</span>
              <input type="number" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* 分类预算 */}
          <div className="bm-section">
            <h3>分类预算（可选）</h3>
            {categoryBudgets.map((cat, i) => (
              <div key={i} className="bm-cat-row">
                <span className="bm-cat-name">{cat.name}</span>
                <div className="bm-cat-amount">
                  <span>¥</span>
                  <input
                    type="number"
                    value={cat.amount}
                    onChange={e => {
                      const next = [...categoryBudgets]
                      next[i] = { ...next[i], amount: e.target.value }
                      setCategoryBudgets(next)
                    }}
                    placeholder="0"
                  />
                </div>
                <button className="bm-cat-remove" onClick={() => removeCatBudget(i)}>×</button>
              </div>
            ))}
            {categoryBudgets.length < expenseCats.length && (
              <button className="bm-add-cat" onClick={addCatBudget}>+ 添加分类预算</button>
            )}
          </div>

          {/* 预警阈值 */}
          <div className="bm-section">
            <h3>预警阈值：{warningThreshold}%</h3>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={warningThreshold}
              onChange={e => setWarningThreshold(Number(e.target.value))}
              className="bm-slider"
            />
            <p className="bm-hint">当月支出达到总预算的{warningThreshold}%时发出预警</p>
          </div>

          {/* 超预算提醒 */}
          <div className="bm-section">
            <div className="bm-toggle-row">
              <div className="bm-toggle-info">
                <h3>超预算提醒</h3>
                <p>超预算时显示红色预警横幅并推送通知</p>
              </div>
              <button
                className={`bm-toggle ${overBudgetAlert ? 'on' : 'off'}`}
                onClick={() => setOverBudgetAlert(!overBudgetAlert)}
              >
                {overBudgetAlert ? <Bell size={16} /> : <BellOff size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
