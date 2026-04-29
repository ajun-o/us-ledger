// ======= 情侣系统 — localStorage 缓存 + Supabase 桥接 =======
// 所有读取走 localStorage（即时响应），同步操作走 Supabase（跨设备）

import {
  getCoupleBinding,
  getPartnerUserId,
  bindCouple as supabaseBindCouple,
  unbindCouple as supabaseUnbindCouple,
  generateInviteCodeServer,
  validateInviteCodeServer,
  useInviteCode,
} from './couple-supabase'

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

// ======= 情侣资料（localStorage 缓存） =======

export function getCoupleProfile(): CoupleProfile {
  try {
    const raw = localStorage.getItem(COUPLE_PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { myName: '我', partnerName: '', bindDate: '' }
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

// ======= Supabase 同步 =======

/** 从 Supabase 拉取情侣数据到 localStorage 缓存 */
export async function syncCoupleFromSupabase(): Promise<boolean> {
  try {
    const binding = await getCoupleBinding()
    if (!binding) {
      // 服务端无绑定 → 清空本地缓存
      const profile = getCoupleProfile()
      profile.partnerName = ''
      profile.bindDate = ''
      saveCoupleProfile(profile)
      return false
    }

    const partnerId = await getPartnerUserId()
    if (!partnerId) return false

    // 更新本地缓存
    const profile = getCoupleProfile()
    profile.bindDate = binding.created_at.split('T')[0]
    if (!profile.partnerName) {
      profile.partnerName = '伴侣'
    }
    saveCoupleProfile(profile)
    return true
  } catch {
    return false
  }
}

// ======= 邀请码 =======

const INVITE_EXPIRE_DAYS = 7

export function generateInviteCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  const data = { code, createdAt: Date.now() }
  localStorage.setItem(INVITE_CODE_KEY, JSON.stringify(data))
  return code
}

/** 服务端生成邀请码 + 本地缓存 */
export async function generateAndSyncInviteCode(): Promise<string> {
  try {
    const code = await generateInviteCodeServer()
    const data = { code, createdAt: Date.now() }
    localStorage.setItem(INVITE_CODE_KEY, JSON.stringify(data))
    return code
  } catch {
    // 降级到本地生成
    return generateInviteCode()
  }
}

export function getInviteCode(): string | null {
  try {
    const raw = localStorage.getItem(INVITE_CODE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
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

/** 通过邀请码绑定伴侣（服务端核验+绑定） */
export async function bindWithPartnerInviteCode(inviteCode: string): Promise<{ success: boolean; error?: string }> {
  const validation = await validateInviteCodeServer(inviteCode)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    await supabaseBindCouple(validation.creatorUserId!)
    await useInviteCode(inviteCode)

    // 更新本地缓存
    const profile = getCoupleProfile()
    profile.bindDate = new Date().toISOString().split('T')[0]
    if (!profile.partnerName) {
      profile.partnerName = '伴侣'
    }
    saveCoupleProfile(profile)

    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '绑定失败'
    return { success: false, error: msg }
  }
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

// ======= 解绑（同步 Supabase） =======

export async function unbindCoupleFull(): Promise<void> {
  try {
    await supabaseUnbindCouple()
  } catch { /* Supabase 挂了也要清本地 */ }
  const profile = getCoupleProfile()
  profile.partnerName = ''
  profile.bindDate = ''
  saveCoupleProfile(profile)
}
