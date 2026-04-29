const COUPLE_PROFILE_KEY = 'us_ledger_couple_profile'
const INVITE_CODE_KEY = 'us_ledger_invite_code'
const PARTNER_PERMISSION_KEY = 'us_ledger_partner_permission'
const DATA_VISIBILITY_KEY = 'us_ledger_data_visibility'

export interface CoupleProfile {
  myName: string
  partnerName: string
  bindDate: string
}

export interface PartnerPermission {
  canEdit: boolean
  canDelete: boolean
}

export interface DataVisibility {
  showMine: boolean
  showPartner: boolean
  showJoint: boolean
}

// ======= 情侣资料 =======

export function getCoupleProfile(): CoupleProfile {
  try {
    const raw = localStorage.getItem(COUPLE_PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { myName: '阿俊', partnerName: '小美', bindDate: '2026-04-28' }
}

export function saveCoupleProfile(data: CoupleProfile) {
  localStorage.setItem(COUPLE_PROFILE_KEY, JSON.stringify(data))
}

// ======= 绑定状态 =======

export function hasPartner(): boolean {
  const profile = getCoupleProfile()
  return !!profile.partnerName
}

export function getPartnerName(): string {
  return getCoupleProfile().partnerName
}

export function getMyName(): string {
  return getCoupleProfile().myName
}

export function getBindDate(): string {
  return getCoupleProfile().bindDate
}

export function getAccountingDays(): number {
  const bindDate = new Date(getCoupleProfile().bindDate)
  if (isNaN(bindDate.getTime())) return 1
  return Math.max(1, Math.floor((Date.now() - bindDate.getTime()) / (1000 * 60 * 60 * 24)))
}

// ======= 邀请码 =======

const INVITE_EXPIRE_DAYS = 7

export function generateInviteCode(): string {
  // 6位邀请码：大写字母+数字，排除易混淆字符
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  const data = { code, createdAt: Date.now() }
  localStorage.setItem(INVITE_CODE_KEY, JSON.stringify(data))
  return code
}

export function getInviteCode(): string | null {
  try {
    const raw = localStorage.getItem(INVITE_CODE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // 检查是否过期
    if (Date.now() - data.createdAt > INVITE_EXPIRE_DAYS * 24 * 3600 * 1000) {
      localStorage.removeItem(INVITE_CODE_KEY)
      return null
    }
    return data.code
  } catch { return null }
}

export function validateInviteCode(code: string): boolean {
  if (!code || code.length !== 6) return false
  return /^[A-Z0-9]{6}$/i.test(code)
}

// ======= 伴侣权限 =======

export function getPartnerPermission(): PartnerPermission {
  try {
    const raw = localStorage.getItem(PARTNER_PERMISSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { canEdit: true, canDelete: false }
}

export function savePartnerPermission(perm: PartnerPermission) {
  localStorage.setItem(PARTNER_PERMISSION_KEY, JSON.stringify(perm))
}

// ======= 数据可见性 =======

export function getDataVisibility(): DataVisibility {
  try {
    const raw = localStorage.getItem(DATA_VISIBILITY_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { showMine: true, showPartner: true, showJoint: true }
}

export function saveDataVisibility(vis: DataVisibility) {
  localStorage.setItem(DATA_VISIBILITY_KEY, JSON.stringify(vis))
}
