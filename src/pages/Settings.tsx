import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Smartphone,
  MessageCircle,
  Apple,
  Bell,
  AlertTriangle,
  Users,
  FileText,
  Database,
  Download,
  Upload,
  Trash2,
  Info,
  Shield,
  UserX,
  Moon,
  Wifi,
  RefreshCw,
  Hand
} from 'lucide-react'
import './Settings.css'

interface Props {
  onBack: () => void
}

export default function Settings({ onBack }: Props) {
  const sections = [
    {
      title: '伴侣管理',
      items: [
        { icon: Users, label: '伴侣绑定管理', description: '查看/解除绑定', color: '#E74C3C' },
        { icon: UserX, label: '对方权限设置', description: '管理数据可见性', color: '#F4A261' },
        { icon: Shield, label: '共同数据可见性', description: '设置哪些数据对方可见', color: '#A8D5BA' }
      ]
    },
    {
      title: '账户安全',
      items: [
        { icon: Lock, label: '修改密码', color: '#636E72' },
        { icon: Smartphone, label: '绑定手机', description: '138****8888', color: '#636E72' },
        { icon: MessageCircle, label: '微信绑定', description: '已绑定', color: '#07C160' },
        { icon: Apple, label: 'Apple ID 绑定', description: '未绑定', color: '#2D3436' }
      ]
    },
    {
      title: '通知设置',
      items: [
        { icon: Bell, label: '记账提醒', toggle: true, color: '#636E72' },
        { icon: AlertTriangle, label: '预算预警', toggle: true, color: '#F4A261' },
        { icon: Users, label: '伴侣记账通知', toggle: true, color: '#E74C3C' },
        { icon: FileText, label: '日报/周报', toggle: false, color: '#636E72' }
      ]
    },
    {
      title: '记账同步',
      items: [
        { icon: RefreshCw, label: '同步方式', description: '实时同步', color: '#27AE60' },
        { icon: Wifi, label: '仅WiFi同步', toggle: false, color: '#0984E3' },
        { icon: Hand, label: '手动同步', color: '#636E72' }
      ]
    },
    {
      title: '数据管理',
      items: [
        { icon: Database, label: '数据备份', color: '#27AE60' },
        { icon: Download, label: '数据恢复', color: '#0984E3' },
        { icon: Upload, label: '导出账单', color: '#6C5CE7' },
        { icon: Trash2, label: '清空数据', danger: true, color: '#E74C3C' }
      ]
    },
    {
      title: '显示',
      items: [
        { icon: Moon, label: '深色模式', description: '跟随系统', color: '#636E72' }
      ]
    },
    {
      title: '关于',
      items: [
        { icon: Info, label: '版本信息', description: 'v1.0.0', color: '#636E72' },
        { icon: Shield, label: '隐私政策', color: '#636E72' },
        { icon: FileText, label: '用户协议', color: '#636E72' },
        { icon: UserX, label: '注销账号', danger: true, color: '#E74C3C' }
      ]
    }
  ]

  return (
    <div className="settings-page">
      {/* 顶部 */}
      <header className="settings-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <h1>设置</h1>
        <div></div>
      </header>

      {/* 设置列表 */}
      <main className="settings-main">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="settings-section">
            <h3 className="section-title">{section.title}</h3>
            <div className="section-list">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon
                return (
                  <div key={itemIndex} className={`settings-item ${(item as Record<string, unknown>).danger ? 'danger' : ''}`}>
                    <div className="item-left">
                      <div className="item-icon" style={{ background: item.color + '15' }}>
                        <Icon size={18} color={item.color} />
                      </div>
                      <div className="item-text">
                        <span className="item-label">{item.label}</span>
                        {item.description && (
                          <span className="item-description">{item.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="item-right">
                      {(item as Record<string, unknown>).toggle !== undefined ? (
                        <div className={`toggle ${(item as Record<string, unknown>).toggle ? 'active' : ''}`}>
                          <div className="toggle-knob"></div>
                        </div>
                      ) : (
                        <ChevronRight size={16} className="arrow" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </main>

      {/* 退出登录 */}
      <div className="logout-section">
        <button className="logout-btn">退出登录</button>
      </div>
    </div>
  )
}
