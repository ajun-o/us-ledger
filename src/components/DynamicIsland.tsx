import { Wallet, FileText, BarChart3, User } from 'lucide-react'
import './DynamicIsland.css'

type TabType = 'home' | 'bills' | 'reports' | 'profile'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { id: TabType; icon: typeof Wallet; label: string }[] = [
  { id: 'home', icon: Wallet, label: '主页' },
  { id: 'bills', icon: FileText, label: '账单' },
  { id: 'reports', icon: BarChart3, label: '报表' },
  { id: 'profile', icon: User, label: '我的' }
]

export default function DynamicIsland({ activeTab, onTabChange }: Props) {
  return (
    <div className="dynamic-island">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            className={`island-tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={20} />
          </button>
        )
      })}
    </div>
  )
}
