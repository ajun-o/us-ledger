import { useState } from 'react'
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
  Hand,
  X,
  Eye,
  Edit3,
  Zap,
  HelpCircle,
  Headphones,
  Globe,
  Share2
} from 'lucide-react'
import {
  getPartnerPermission,
  savePartnerPermission,
  getDataVisibility,
  saveDataVisibility
} from '../lib/couple'
import {
  QuickCommandsContent,
  HelpCenterContent,
  CustomerServiceContent,
  OfficialMediaContent,
  ShareAppContent,
  AboutAppContent
} from './SettingsSubPages'
import './Settings.css'

interface Props {
  onBack: () => void
  onLogout: () => void
  onOpenCouplePage?: () => void
}

export default function Settings({ onBack, onLogout, onOpenCouplePage }: Props) {
  const [showPermDialog, setShowPermDialog] = useState(false)
  const [showVisDialog, setShowVisDialog] = useState(false)
  const [permission, setPermission] = useState(getPartnerPermission)
  const [visibility, setVisibility] = useState(getDataVisibility)
  const [subPage, setSubPage] = useState<string | null>(null)

  const handleSavePermission = () => {
    savePartnerPermission(permission)
    setShowPermDialog(false)
  }

  const handleSaveVisibility = () => {
    saveDataVisibility(visibility)
    setShowVisDialog(false)
  }

  const handleItemClick = (item: typeof sections[0]['items'][0]) => {
    const ext = item as Record<string, unknown>
    if (ext.action) {
      const action = ext.action as string
      switch (action) {
        case 'couple': onOpenCouplePage?.(); break
        case 'perm': setShowPermDialog(true); break
        case 'vis': setShowVisDialog(true); break
        case 'quick': setSubPage('quick-commands'); break
        case 'share': setSubPage('share'); break
        case 'help': setSubPage('help'); break
        case 'service': setSubPage('customer-service'); break
        case 'media': setSubPage('official-media'); break
        case 'about': setSubPage('about'); break
      }
    }
  }

  const sections = [
    {
      title: '伴侣管理',
      items: [
        { icon: Users, label: '伴侣绑定管理', description: '查看/解除绑定', color: '#E74C3C', action: 'couple' as const },
        { icon: UserX, label: '对方权限设置', description: '管理数据可见性', color: '#F4A261', action: 'perm' as const },
        { icon: Shield, label: '共同数据可见性', description: '设置哪些数据对方可见', color: '#A8D5BA', action: 'vis' as const }
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
      title: '工具',
      items: [
        { icon: Zap, label: '快捷指令', description: 'Siri/桌面小组件', color: '#F4A261', action: 'quick' as const },
      ]
    },
    {
      title: '社交',
      items: [
        { icon: Share2, label: '分享给朋友', description: '邀请好友一起记账', color: '#E74C3C', action: 'share' as const },
      ]
    },
    {
      title: '支持',
      items: [
        { icon: HelpCircle, label: '帮助中心', description: '常见问题与新手指引', color: '#0984E3', action: 'help' as const },
        { icon: Headphones, label: '联系客服', description: '9:00-21:00', color: '#27AE60', action: 'service' as const },
        { icon: Globe, label: '官方媒体', description: '公众号/微博/抖音', color: '#6C5CE7', action: 'media' as const },
      ]
    },
    {
      title: '关于',
      items: [
        { icon: Info, label: '关于 Us Ledger', description: 'v1.2.0 (build 234)', color: '#636E72', action: 'about' as const },
      ]
    },
    {
      title: '账户操作',
      items: [
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
                const ext = item as Record<string, unknown>
                return (
                  <div
                    key={itemIndex}
                    className={`settings-item ${ext.danger ? 'danger' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="item-left">
                      <div className="item-icon" style={{ background: item.color + '15' }}>
                        <Icon size={18} color={item.color} />
                      </div>
                      <div className="item-text">
                        <span className="item-label">{item.label}</span>
                        {'description' in item && typeof item.description === 'string' && (
                          <span className="item-description">{item.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="item-right">
                      {ext.toggle !== undefined ? (
                        <div className={`toggle ${ext.toggle ? 'active' : ''}`}>
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
        <button className="logout-btn" onClick={onLogout}>退出登录</button>
      </div>

      {/* 对方权限设置弹窗 */}
      {showPermDialog && (
        <div className="settings-dialog-overlay" onClick={() => setShowPermDialog(false)}>
          <div className="settings-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>对方权限设置</h3>
              <button className="dialog-close" onClick={() => setShowPermDialog(false)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <div className="dialog-item" onClick={() => setPermission(prev => ({ ...prev, canEdit: !prev.canEdit }))}>
                <div className="dialog-item-left">
                  <Edit3 size={18} color="#F4A261" />
                  <div>
                    <span className="dialog-item-label">允许对方编辑账单</span>
                    <span className="dialog-item-desc">伴侣可以编辑你们共同的账单</span>
                  </div>
                </div>
                <div className={`toggle ${permission.canEdit ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className="dialog-item" onClick={() => setPermission(prev => ({ ...prev, canDelete: !prev.canDelete }))}>
                <div className="dialog-item-left">
                  <Trash2 size={18} color="#E74C3C" />
                  <div>
                    <span className="dialog-item-label">允许对方删除账单</span>
                    <span className="dialog-item-desc">伴侣可以删除你们共同的账单（谨慎开启）</span>
                  </div>
                </div>
                <div className={`toggle ${permission.canDelete ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="dialog-btn secondary" onClick={() => setShowPermDialog(false)}>取消</button>
              <button className="dialog-btn primary" onClick={handleSavePermission}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 子页面 */}
      {subPage === 'quick-commands' && <QuickCommandsContent onBack={() => setSubPage(null)} />}
      {subPage === 'help' && <HelpCenterContent onBack={() => setSubPage(null)} />}
      {subPage === 'customer-service' && <CustomerServiceContent onBack={() => setSubPage(null)} />}
      {subPage === 'official-media' && <OfficialMediaContent onBack={() => setSubPage(null)} />}
      {subPage === 'share' && <ShareAppContent onBack={() => setSubPage(null)} />}
      {subPage === 'about' && <AboutAppContent onBack={() => setSubPage(null)} />}

      {/* 共同数据可见性弹窗 */}
      {showVisDialog && (
        <div className="settings-dialog-overlay" onClick={() => setShowVisDialog(false)}>
          <div className="settings-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>共同数据可见性</h3>
              <button className="dialog-close" onClick={() => setShowVisDialog(false)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <div className="dialog-item" onClick={() => setVisibility(prev => ({ ...prev, showMine: !prev.showMine }))}>
                <div className="dialog-item-left">
                  <Eye size={18} color="#27AE60" />
                  <div>
                    <span className="dialog-item-label">我的账单</span>
                    <span className="dialog-item-desc">对方可以看到我记的账单</span>
                  </div>
                </div>
                <div className={`toggle ${visibility.showMine ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className="dialog-item" onClick={() => setVisibility(prev => ({ ...prev, showPartner: !prev.showPartner }))}>
                <div className="dialog-item-left">
                  <Eye size={18} color="#F4A261" />
                  <div>
                    <span className="dialog-item-label">TA的账单</span>
                    <span className="dialog-item-desc">我可以看到对方记的账单</span>
                  </div>
                </div>
                <div className={`toggle ${visibility.showPartner ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className="dialog-item" onClick={() => setVisibility(prev => ({ ...prev, showJoint: !prev.showJoint }))}>
                <div className="dialog-item-left">
                  <Eye size={18} color="#C8B6E2" />
                  <div>
                    <span className="dialog-item-label">共同账单</span>
                    <span className="dialog-item-desc">双方都可以看到共同账单</span>
                  </div>
                </div>
                <div className={`toggle ${visibility.showJoint ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="dialog-btn secondary" onClick={() => setShowVisDialog(false)}>取消</button>
              <button className="dialog-btn primary" onClick={handleSaveVisibility}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
