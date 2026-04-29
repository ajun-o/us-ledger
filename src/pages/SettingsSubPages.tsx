import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Copy,
  Check,
  ChevronDown,
  Play,
  Image,
  Send,
  Globe,
  MessageCircle,
  ExternalLink,
  Shield,
  FileText,
  Smartphone,
  Download,
  RotateCw,
  Heart,
  Camera,
  Link,
  Star
} from 'lucide-react'
import { getInviteCode, generateInviteCode } from '../lib/couple'
import './SettingsSubPages.css'

interface SubPageProps {
  onBack: () => void
}

// ===================== 快捷指令 =====================

const QUICK_TEMPLATES = [
  { icon: '🍜', label: '记一笔午餐', type: 'expense', category: '餐饮', amount: '' },
  { icon: '🚌', label: '记一笔交通', type: 'expense', category: '交通', amount: '' },
  { icon: '🛒', label: '记一笔购物', type: 'expense', category: '购物', amount: '' },
  { icon: '☕', label: '记一笔咖啡', type: 'expense', category: '餐饮', amount: '' },
  { icon: '🎬', label: '记一笔娱乐', type: 'expense', category: '娱乐', amount: '' },
  { icon: '💰', label: '记一笔收入', type: 'income', category: '工资', amount: '' },
]

export function QuickCommandsContent({ onBack }: SubPageProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (label: string) => {
    navigator.clipboard?.writeText(label).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button className="subpage-back" onClick={onBack}><ChevronLeft size={20} /></button>
        <h2>快捷指令</h2>
        <div></div>
      </header>

      <div className="subpage-body">
        <div className="subpage-card info-card">
          <div className="info-card-icon"><Zap size={20} color="#F4A261" /></div>
          <div className="info-card-text">
            <span className="info-card-title">快速记账</span>
            <span className="info-card-desc">点击下方模板可复制指令，或添加到 Siri 快捷指令 / 桌面小组件</span>
          </div>
        </div>

        <h3 className="subpage-section-title">记账模板</h3>
        <div className="template-grid">
          {QUICK_TEMPLATES.map((t) => (
            <button key={t.label} className="template-card" onClick={() => handleCopy(t.label)}>
              <span className="template-icon">{t.icon}</span>
              <span className="template-label">{t.label}</span>
              {copied === t.label ? (
                <Check size={14} className="template-action-icon" color="#27AE60" />
              ) : (
                <Copy size={14} className="template-action-icon" color="#B2BEC3" />
              )}
            </button>
          ))}
        </div>

        <h3 className="subpage-section-title">Siri 快捷指令</h3>
        <div className="subpage-card steps-card">
          <div className="step-row">
            <div className="step-num">1</div>
            <div className="step-text">
              <span className="step-title">打开"快捷指令" App</span>
              <span className="step-desc">在 iPhone 上找到快捷指令应用</span>
            </div>
          </div>
          <div className="step-row">
            <div className="step-num">2</div>
            <div className="step-text">
              <span className="step-title">创建个人自动化</span>
              <span className="step-desc">点击 + → 添加操作 → 搜索"Us Ledger"</span>
            </div>
          </div>
          <div className="step-row">
            <div className="step-num">3</div>
            <div className="step-text">
              <span className="step-title">设置语音指令</span>
              <span className="step-desc">如"嘿 Siri，记一笔午餐" → 选择对应操作</span>
            </div>
          </div>
        </div>

        <h3 className="subpage-section-title">桌面小组件</h3>
        <div className="subpage-card widget-tip">
          <Smartphone size={40} color="#636E72" />
          <p className="widget-tip-text">长按桌面空白处 → 左上角 + → 搜索"Us Ledger" → 添加小组件</p>
        </div>
      </div>
    </div>
  )
}

// ===================== 帮助中心 =====================

const FAQ_LIST = [
  {
    q: '如何添加一笔账单？',
    a: '在主页点击底部中间 + 按钮进入记账页面，选择收入/支出、填写金额、选择分类和账户后保存即可。'
  },
  {
    q: '如何切换查看我的/TA的/共同账单？',
    a: '在主页顶部的资产卡片上左右滑动，或点击左右箭头，即可在"我的""TA的""共同"三个视角之间切换。'
  },
  {
    q: '如何绑定伴侣？',
    a: '进入个人中心 → 点击头像区域进入情侣空间 → 点击"邀请伴侣"生成邀请码 → 对方在注册时填写邀请码即可绑定。'
  },
  {
    q: '如何设置预算？',
    a: '进入个人中心 → 预算管理 → 设置总预算金额和预警阈值。还可以为每个分类单独设置预算。'
  },
  {
    q: '账单数据会丢失吗？',
    a: '账单数据存储在本地和云端（Supabase），即使更换手机，登录同一账号后数据会自动恢复。建议定期在设置中备份数据。'
  },
  {
    q: '如何删除账单？',
    a: '在主页或账单页，向左滑动账单即可看到编辑和删除按钮。删除后有3秒撤销时间。'
  },
  {
    q: '存钱计划怎么用？',
    a: '进入个人中心 → 存钱计划 → 设定目标金额和名称 → 每次存钱后记录存入金额，进度条会实时更新。达成目标后有庆祝动画。'
  },
  {
    q: '对方能看到我的所有账单吗？',
    a: '你可以在设置 → 共同数据可见性中，分别控制对方能否看到"我的账单""TA的账单"和"共同账单"。'
  },
]

export function HelpCenterContent({ onBack }: SubPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button className="subpage-back" onClick={onBack}><ChevronLeft size={20} /></button>
        <h2>帮助中心</h2>
        <div></div>
      </header>

      <div className="subpage-body">
        <h3 className="subpage-section-title">常见问题</h3>
        <div className="faq-list">
          {FAQ_LIST.map((faq, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <ChevronDown size={18} className={`faq-chevron ${openFaq === i ? 'rotated' : ''}`} />
              </button>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="subpage-section-title">新手指引</h3>
        <div className="guide-cards">
          <div className="guide-card">
            <div className="guide-card-icon" style={{ background: '#A8D5BA20' }}>
              <Play size={20} color="#A8D5BA" />
            </div>
            <div className="guide-card-text">
              <span className="guide-card-title">图文教程</span>
              <span className="guide-card-desc">从零开始，5分钟学会 Us Ledger</span>
            </div>
            <ChevronRight size={16} color="#B2BEC3" />
          </div>
          <div className="guide-card">
            <div className="guide-card-icon" style={{ background: '#F4A26120' }}>
              <Play size={20} color="#F4A261" />
            </div>
            <div className="guide-card-text">
              <span className="guide-card-title">视频教程</span>
              <span className="guide-card-desc">观看操作演示视频</span>
            </div>
            <ChevronRight size={16} color="#B2BEC3" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== 联系客服 =====================

interface ChatMessage {
  id: number
  text: string
  from: 'me' | 'support'
  time: string
  isImage?: boolean
}

const WORK_HOURS_START = 9
const WORK_HOURS_END = 21

function isWorkingHours(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return hour >= WORK_HOURS_START && hour < WORK_HOURS_END
}

const AUTO_REPLIES: Record<string, string> = {
  '你好': '你好！有什么可以帮你的吗？',
  '账单': '关于账单的问题，你可以查看帮助中心，或者告诉我具体遇到了什么问题~',
  '同步': '账单数据会自动同步到云端。如果遇到同步问题，可以尝试在设置中手动同步。',
  '备份': '你可以在设置 → 数据管理中备份和恢复数据。建议定期备份哦！',
  '邀请': '邀请伴侣的方法：进入个人中心 → 点击头像 → 邀请伴侣 → 生成邀请码分享给对方。',
  '预算': '预算设置路径：个人中心 → 预算管理。可以设置总预算和分类预算。',
  '删除': '删除的账单有3秒撤销时间，超时后无法恢复。如需彻底删除请谨慎操作。',
  '默认': '收到你的消息了，客服会在工作时间内尽快回复你！（工作时间：9:00-21:00）',
}

function getAutoReply(text: string): string {
  for (const [keyword, reply] of Object.entries(AUTO_REPLIES)) {
    if (text.includes(keyword)) return reply
  }
  return AUTO_REPLIES['默认']
}

export function CustomerServiceContent({ onBack }: SubPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, text: '你好！我是 Us Ledger 客服小U，有什么可以帮你的吗？', from: 'support', time: formatTime() },
  ])
  const [input, setInput] = useState('')
  const [msgId, setMsgId] = useState(1)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: ChatMessage = { id: msgId, text: input.trim(), from: 'me', time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setMsgId(id => id + 1)

    // 模拟客服自动回复
    setTimeout(() => {
      const reply = getAutoReply(userMsg.text)
      setMessages(prev => [...prev, { id: msgId + 1, text: reply, from: 'support', time: formatTime() }])
      setMsgId(id => id + 2)
    }, 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button className="subpage-back" onClick={onBack}><ChevronLeft size={20} /></button>
        <div className="header-center">
          <h2>联系客服</h2>
          <span className={`cs-status ${isWorkingHours() ? 'online' : 'offline'}`}>
            {isWorkingHours() ? '在线' : '离线'}
          </span>
        </div>
        <div></div>
      </header>

      <div className="subpage-body chat-body">
        <div className="chat-hours-bar">
          <Clock size={14} />
          <span>工作时间 9:00-21:00{!isWorkingHours() && '（当前离线，留言将稍后回复）'}</span>
        </div>

        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble-row ${msg.from}`}>
              <div className="chat-bubble">
                <p>{msg.text}</p>
                <span className="chat-time">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-bar">
          <button className="chat-image-btn" title="发送图片">
            <Image size={20} color="#636E72" />
          </button>
          <div className="chat-input-wrapper">
            <input
              className="chat-input"
              placeholder="输入消息..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
            <Send size={18} color={input.trim() ? '#FFFFFF' : '#B2BEC3'} />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// ===================== 官方媒体 =====================

const SOCIAL_MEDIA = [
  { icon: MessageCircle, label: '微信公众号', desc: 'Us Ledger 记账助手', color: '#07C160', action: '关注公众号，获取最新功能和优惠' },
  { icon: Globe, label: '官方微博', desc: '@Us记账', color: '#E74C3C', action: '关注微博，参与话题互动' },
  { icon: Camera, label: '小红书', desc: 'Us Ledger', color: '#FF2442', action: '查看记账攻略和用户分享' },
  { icon: Play, label: '抖音', desc: '@us_ledger', color: '#2D3436', action: '观看记账教程和功能介绍视频' },
  { icon: ExternalLink, label: '官方网站', desc: 'www.usledger.app', color: '#0984E3', action: '了解更多产品信息' },
]

export function OfficialMediaContent({ onBack }: SubPageProps) {
  return (
    <div className="subpage">
      <header className="subpage-header">
        <button className="subpage-back" onClick={onBack}><ChevronLeft size={20} /></button>
        <h2>官方媒体</h2>
        <div></div>
      </header>

      <div className="subpage-body">
        <div className="subpage-card info-card">
          <div className="info-card-icon"><Star size={20} color="#F4A261" /></div>
          <div className="info-card-text">
            <span className="info-card-title">关注我们</span>
            <span className="info-card-desc">获取最新功能更新、记账技巧和优惠活动</span>
          </div>
        </div>

        <div className="social-list">
          {SOCIAL_MEDIA.map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="social-item">
                <div className="social-icon" style={{ background: item.color + '15' }}>
                  <Icon size={22} color={item.color} />
                </div>
                <div className="social-text">
                  <span className="social-label">{item.label}</span>
                  <span className="social-desc">{item.desc}</span>
                  <span className="social-action">{item.action}</span>
                </div>
                <ChevronRight size={16} color="#B2BEC3" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===================== 分享给朋友 =====================

export function ShareAppContent({ onBack }: SubPageProps) {
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setInviteCode(getInviteCode() || generateInviteCode())
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !inviteCode) return
    drawPoster(canvasRef.current, inviteCode)
  }, [inviteCode])

  const handleCopyLink = () => {
    const link = `https://usledger.app/invite?code=${inviteCode}`
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Us Ledger — 双人记账 App',
      text: `和我一起用 Us Ledger 记账吧！邀请码：${inviteCode}`,
      url: `https://usledger.app/invite?code=${inviteCode}`,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink()
    }
  }

  const handleSavePoster = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'us-ledger-invite.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button className="subpage-back" onClick={onBack}><ChevronLeft size={20} /></button>
        <h2>分享给朋友</h2>
        <div></div>
      </header>

      <div className="subpage-body">
        <div className="poster-section">
          <canvas ref={canvasRef} width="300" height="400" className="poster-canvas" />
          <button className="poster-save-btn" onClick={handleSavePoster}>
            <Download size={16} /> 保存海报
          </button>
        </div>

        <div className="share-code-card">
          <span className="share-code-label">我的邀请码</span>
          <span className="share-code-value">{inviteCode}</span>
          <span className="share-code-tip">7天有效</span>
        </div>

        <div className="share-actions">
          <button className="share-btn wechat" onClick={handleShare}>
            <MessageCircle size={20} />
            <span>微信分享</span>
          </button>
          <button className="share-btn copy" onClick={handleCopyLink}>
            {copied ? <Check size={20} /> : <Link size={20} />}
            <span>{copied ? '已复制' : '复制链接'}</span>
          </button>
          <button className="share-btn poster" onClick={handleSavePoster}>
            <Camera size={20} />
            <span>保存图片</span>
          </button>
        </div>

        <div className="share-reward-card">
          <Heart size={18} color="#E74C3C" />
          <span>邀请好友注册，双方各获得 <strong>30天会员</strong></span>
        </div>
      </div>
    </div>
  )
}

function drawPoster(canvas: HTMLCanvasElement, inviteCode: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height

  // 背景渐变
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#A8D5BA')
  grad.addColorStop(1, '#C8B6E2')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // 白色装饰圆
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.arc(250, 80, 120, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(50, 320, 80, 0, Math.PI * 2)
  ctx.fill()

  // Logo
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 48px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Us', w / 2, 130)

  // 副标题
  ctx.font = '16px -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('双人记账，一起理财', w / 2, 165)

  // 邀请码卡片
  const cardX = 30
  const cardY = 200
  const cardW = w - 60
  const cardH = 90
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  roundRect(ctx, cardX, cardY, cardW, cardH, 16)
  ctx.fill()

  ctx.fillStyle = '#636E72'
  ctx.font = '13px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('邀请码', w / 2, cardY + 28)

  ctx.fillStyle = '#2D3436'
  ctx.font = 'bold 32px monospace'
  ctx.fillText(inviteCode, w / 2, cardY + 62)

  // 底部文字
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '12px -apple-system, sans-serif'
  ctx.fillText('扫描二维码或输入邀请码加入', w / 2, h - 30)

  // 日期水印
  const dateStr = new Date().toLocaleDateString('zh-CN')
  ctx.fillText(`生成日期：${dateStr}`, w / 2, h - 12)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ===================== 关于 =====================

export function AboutAppContent({ onBack }: SubPageProps) {
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<string | null>(null)

  const handleCheckUpdate = () => {
    setChecking(true)
    setCheckResult(null)
    setTimeout(() => {
      setChecking(false)
      setCheckResult('已是最新版本')
    }, 1500)
  }

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button className="subpage-back" onClick={onBack}><ChevronLeft size={20} /></button>
        <h2>关于</h2>
        <div></div>
      </header>

      <div className="subpage-body">
        <div className="about-brand">
          <div className="about-logo">Us</div>
          <h3 className="about-name">Us Ledger</h3>
          <p className="about-slogan">双人记账，一起理财</p>
          <p className="about-version">v1.2.0 (build 234)</p>
        </div>

        <button className="about-update-btn" onClick={handleCheckUpdate} disabled={checking}>
          {checking ? (
            <><RotateCw size={16} className="spin-icon" /> 检查中...</>
          ) : checkResult ? (
            <><Check size={16} color="#27AE60" /> {checkResult}</>
          ) : (
            '检查更新'
          )}
        </button>

        <div className="about-links">
          <div className="about-link-item">
            <div className="about-link-left">
              <Shield size={18} color="#636E72" />
              <span>隐私政策</span>
            </div>
            <ChevronRight size={16} color="#B2BEC3" />
          </div>
          <div className="about-link-item">
            <div className="about-link-left">
              <FileText size={18} color="#636E72" />
              <span>用户协议</span>
            </div>
            <ChevronRight size={16} color="#B2BEC3" />
          </div>
          <div className="about-link-item">
            <div className="about-link-left">
              <Shield size={18} color="#636E72" />
              <span>第三方 SDK 说明</span>
            </div>
            <ChevronRight size={16} color="#B2BEC3" />
          </div>
        </div>

        <div className="about-oss">
          <h4>开源组件致谢</h4>
          <div className="oss-tags">
            <span className="oss-tag">React</span>
            <span className="oss-tag">TypeScript</span>
            <span className="oss-tag">Vite</span>
            <span className="oss-tag">Supabase</span>
            <span className="oss-tag">Recharts</span>
            <span className="oss-tag">Lucide React</span>
            <span className="oss-tag">date-fns</span>
          </div>
        </div>
      </div>
    </div>
  )
}
