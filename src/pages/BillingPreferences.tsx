import { useState } from 'react'
import { X, Check } from 'lucide-react'
import './BillingPreferences.css'

const PREF_KEY = 'us_ledger_billing_prefs'

interface BillingPrefs {
  defaultMember: 'mine' | 'partner' | 'joint'
  defaultType: 'expense' | 'income'
}

function loadPrefs(): BillingPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { defaultMember: 'mine', defaultType: 'expense' }
}

export function getBillingPrefs(): BillingPrefs {
  return loadPrefs()
}

interface Props {
  onClose: () => void
}

export default function BillingPreferences({ onClose }: Props) {
  const [prefs, setPrefs] = useState<BillingPrefs>(loadPrefs)

  const handleSave = () => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
    onClose()
  }

  const members: { key: BillingPrefs['defaultMember']; label: string }[] = [
    { key: 'mine', label: '我的' },
    { key: 'partner', label: 'TA的' },
    { key: 'joint', label: '共同' },
  ]

  const types: { key: BillingPrefs['defaultType']; label: string }[] = [
    { key: 'expense', label: '支出' },
    { key: 'income', label: '收入' },
  ]

  return (
    <div className="bp-overlay" onClick={onClose}>
      <div className="bp-sheet" onClick={e => e.stopPropagation()}>
        <div className="bp-header">
          <button className="bp-close" onClick={onClose}><X size={20} /></button>
          <h3>记账偏好</h3>
          <button className="bp-save" onClick={handleSave}><Check size={20} /></button>
        </div>

        <div className="bp-body">
          <div className="bp-section">
            <h4>默认记账人</h4>
            <p className="bp-desc">记账时默认选中的成员</p>
            <div className="bp-options">
              {members.map(m => (
                <button
                  key={m.key}
                  className={`bp-option ${prefs.defaultMember === m.key ? 'active' : ''}`}
                  onClick={() => setPrefs(prev => ({ ...prev, defaultMember: m.key }))}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bp-section">
            <h4>默认收支类型</h4>
            <p className="bp-desc">记账时默认选中的类型</p>
            <div className="bp-options">
              {types.map(t => (
                <button
                  key={t.key}
                  className={`bp-option ${prefs.defaultType === t.key ? 'active' : ''}`}
                  onClick={() => setPrefs(prev => ({ ...prev, defaultType: t.key }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
