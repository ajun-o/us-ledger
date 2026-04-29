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
  Share2,
  Check
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
  theme: string | null
  onThemeChange: (theme: string) => void
}

const NOTIFY_KEY = 'us_ledger_notify_settings'
const SYNC_KEY = 'us_ledger_sync_method'

interface NotifySettings {
  billReminder: boolean
  budgetAlert: boolean
  coupleNotify: boolean
  dailyReport: boolean
}

function loadNotify(): NotifySettings {
  try {
    const raw = localStorage.getItem(NOTIFY_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { billReminder: true, budgetAlert: true, coupleNotify: true, dailyReport: false }
}

function saveNotify(s: NotifySettings) {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(s))
}

function loadSyncMethod(): string {
  return localStorage.getItem(SYNC_KEY) || 'realtime'
}

function saveSyncMethod(m: string) {
  localStorage.setItem(SYNC_KEY, m)
}

export default function Settings({ onBack, onLogout, onOpenCouplePage, theme, onThemeChange }: Props) {
  const [showPermDialog, setShowPermDialog] = useState(false)
  const [showVisDialog, setShowVisDialog] = useState(false)
  const [permission, setPermission] = useState(getPartnerPermission)
  const [visibility, setVisibility] = useState(getDataVisibility)
  const [subPage, setSubPage] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [notify, setNotify] = useState<NotifySettings>(loadNotify)
  const [syncMethod, setSyncMethod] = useState(loadSyncMethod)
  const [showSyncPicker, setShowSyncPicker] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleSavePermission = () => {
    savePartnerPermission(permission)
    setShowPermDialog(false)
  }

  const handleSaveVisibility = () => {
    saveDataVisibility(visibility)
    setShowVisDialog(false)
  }

  const toggleNotify = (key: keyof NotifySettings) => {
    const next = { ...notify, [key]: !notify[key] }
    setNotify(next)
    saveNotify(next)
    showToast('设置已保存')
  }

  const handleSyncChange = (method: string) => {
    setSyncMethod(method)
    saveSyncMethod(method)
    setShowSyncPicker(false)
    showToast(method === 'realtime' ? '已切换为实时同步' : method === 'wifi' ? '已切换为仅WiFi同步' : '已切换为手动同步')
  }

  const handleManualSync = async () => {
    showToast('正在同步...')
    try {
      const { syncQueue } = await import('../lib/bills')
      const remaining = await syncQueue()
      if (remaining === 0) showToast('同步完成')
      else showToast(`同步完成，${remaining} 条待同步`)
    } catch { showToast('同步失败，请检查网络') }
  }

  const handleBackup = () => {
    const data: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('us_ledger_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '')
        } catch { data[key] = localStorage.getItem(key) }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `us-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('备份文件已下载')
  }

  const handleRestore = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        let count = 0
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith('us_ledger_') && key !== 'us_ledger_auth') {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            count++
          }
        }
        showToast(`已恢复 ${count} 项数据，请刷新页面`)
      } catch { showToast('文件格式错误，无法恢复') }
    }
    input.click()
  }

  const handleExportCSV = async () => {
    try {
      const { fetchBills } = await import('../lib/bills')
      const bills = await fetchBills({ limit: 9999 })
      const header = '日期,时间,类型,分类,金额,成员,备注,账户\n'
      const rows = bills.map(b => {
        const safe = (s: string) => `"${(s || '').replace(/"/g, '""')}"`
        return [b.date, b.time, b.type === 'expense' ? '支出' : '收入', b.categoryName, b.amount, b.member, safe(b.note), safe(b.account)].join(',')
      }).join('\n')
      const BOM = '﻿'
      const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `us-ledger-bills-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast('账单已导出为 CSV')
    } catch { showToast('导出失败') }
  }

  const handleClearData = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('us_ledger_') && key !== 'us_ledger_billing_prefs' && key !== 'us_ledger_notify_settings' && key !== 'us_ledger_sync_method') {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setShowClearConfirm(false)
    showToast('数据已清空，请刷新页面')
  }

  const handleDeleteAccount = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('us_ledger_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setShowDeleteAccount(false)
    onLogout()
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
        case 'sync': setShowSyncPicker(true); break
        case 'manual-sync': handleManualSync(); break
        case 'backup': handleBackup(); break
        case 'restore': handleRestore(); break
        case 'export': handleExportCSV(); break
        case 'clear': setShowClearConfirm(true); break
        case 'dark': toggleTheme(); break
        case 'delete-account': setShowDeleteAccount(true); break
      }
      return
    }
    // 无 action 的项 → toast
    const label = 'label' in item ? item.label : ''
    showToast(`${label}功能开发中`)
  }

  const toggleTheme = () => {
    const themes = ['default', 'dark', 'warm', 'cool']
    const currentIdx = themes.indexOf(theme || 'default')
    const next = themes[(currentIdx + 1) % themes.length]
    onThemeChange(next)
    showToast(`主题已切换为: ${next}`)
  }

  const syncLabel = syncMethod === 'realtime' ? '实时同步' : syncMethod === 'wifi' ? '仅WiFi同步' : '手动同步'

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
        { icon: Bell, label: '记账提醒', toggleKey: 'billReminder' as const, color: '#636E72' },
        { icon: AlertTriangle, label: '预算预警', toggleKey: 'budgetAlert' as const, color: '#F4A261' },
        { icon: Users, label: '伴侣记账通知', toggleKey: 'coupleNotify' as const, color: '#E74C3C' },
        { icon: FileText, label: '日报/周报', toggleKey: 'dailyReport' as const, color: '#636E72' }
      ]
    },
    {
      title: '记账同步',
      items: [
        { icon: RefreshCw, label: '同步方式', description: syncLabel, color: '#27AE60', action: 'sync' as const },
        { icon: Hand, label: '手动同步', description: '立即同步离线队列', color: '#636E72', action: 'manual-sync' as const }
      ]
    },
    {
      title: '数据管理',
      items: [
        { icon: Database, label: '数据备份', description: '导出数据到文件', color: '#27AE60', action: 'backup' as const },
        { icon: Download, label: '数据恢复', description: '从备份文件恢复', color: '#0984E3', action: 'restore' as const },
        { icon: Upload, label: '导出账单', description: '导出为 CSV 文件', color: '#6C5CE7', action: 'export' as const },
        { icon: Trash2, label: '清空数据', danger: true, description: '清除所有本地数据', color: '#E74C3C', action: 'clear' as const }
      ]
    },
    {
      title: '显示',
      items: [
        { icon: Moon, label: '深色模式', description: `当前: ${theme || '默认'}`, color: '#636E72', action: 'dark' as const }
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
        { icon: UserX, label: '注销账号', danger: true, description: '永久删除所有数据', color: '#E74C3C', action: 'delete-account' as const }
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
                      {ext.toggleKey !== undefined ? (
                        <div
                          className={`toggle ${notify[ext.toggleKey as keyof NotifySettings] ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleNotify(ext.toggleKey as keyof NotifySettings) }}
                        >
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

      {/* 同步方式选择 */}
      {showSyncPicker && (
        <div className="settings-dialog-overlay" onClick={() => setShowSyncPicker(false)}>
          <div className="settings-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>同步方式</h3>
              <button className="dialog-close" onClick={() => setShowSyncPicker(false)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <div className={`dialog-item ${syncMethod === 'realtime' ? 'selected' : ''}`} onClick={() => handleSyncChange('realtime')}>
                <div className="dialog-item-left">
                  <RefreshCw size={18} color="#27AE60" />
                  <div>
                    <span className="dialog-item-label">实时同步</span>
                    <span className="dialog-item-desc">有网络时立即同步到云端</span>
                  </div>
                </div>
                {syncMethod === 'realtime' && <Check size={18} color="#27AE60" />}
              </div>
              <div className={`dialog-item ${syncMethod === 'wifi' ? 'selected' : ''}`} onClick={() => handleSyncChange('wifi')}>
                <div className="dialog-item-left">
                  <Wifi size={18} color="#0984E3" />
                  <div>
                    <span className="dialog-item-label">仅WiFi同步</span>
                    <span className="dialog-item-desc">仅在WiFi环境下同步</span>
                  </div>
                </div>
                {syncMethod === 'wifi' && <Check size={18} color="#0984E3" />}
              </div>
              <div className={`dialog-item ${syncMethod === 'manual' ? 'selected' : ''}`} onClick={() => handleSyncChange('manual')}>
                <div className="dialog-item-left">
                  <Hand size={18} color="#636E72" />
                  <div>
                    <span className="dialog-item-label">手动同步</span>
                    <span className="dialog-item-desc">仅在点击时同步</span>
                  </div>
                </div>
                {syncMethod === 'manual' && <Check size={18} color="#636E72" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 清空数据确认 */}
      {showClearConfirm && (
        <div className="settings-dialog-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="settings-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>清空数据</h3>
              <button className="dialog-close" onClick={() => setShowClearConfirm(false)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <p className="dialog-warning">确定要清空所有本地数据吗？此操作将清除账单、情侣绑定等数据。设置和偏好会保留。</p>
            </div>
            <div className="dialog-footer">
              <button className="dialog-btn secondary" onClick={() => setShowClearConfirm(false)}>取消</button>
              <button className="dialog-btn danger" onClick={handleClearData}>确认清空</button>
            </div>
          </div>
        </div>
      )}

      {/* 注销账号确认 */}
      {showDeleteAccount && (
        <div className="settings-dialog-overlay" onClick={() => setShowDeleteAccount(false)}>
          <div className="settings-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>注销账号</h3>
              <button className="dialog-close" onClick={() => setShowDeleteAccount(false)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <p className="dialog-warning">注销后将清除所有本地数据并退出登录。云端账单数据不会删除（请在 Supabase 中手动删除）。确定要继续吗？</p>
            </div>
            <div className="dialog-footer">
              <button className="dialog-btn secondary" onClick={() => setShowDeleteAccount(false)}>取消</button>
              <button className="dialog-btn danger" onClick={handleDeleteAccount}>确认注销</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="settings-toast">{toast}</div>}
    </div>
  )
}
