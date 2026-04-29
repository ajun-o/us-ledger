// ======= Auth 模块 — Supabase Session 管理 =======
// 使用真实的 Supabase Auth session，替换旧的模拟 token 系统

import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

// ======= 模块级缓存（支持 App.tsx 同步调用） =======
let _cachedSessionValid = false
let _cachedUser: User | null = null

export function setCachedSessionValid(valid: boolean) {
  _cachedSessionValid = valid
}

// _cachedUser 保留供未来扩展（如离线用户信息缓存）
export function _getCachedUser(): User | null {
  return _cachedUser
}

// ======= 手机号→邮箱映射 =======

/** 将手机号映射为 Supabase 内部邮箱标识（免 OTP） */
export function phoneToEmail(phone: string): string {
  return `p${phone}@us.internal`
}

// ======= 类型 =======

export interface UserInfo {
  id: string
  nickname: string
  avatar: string
  phone?: string
  hasPartner?: boolean
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  expireIn: number // 秒
  userInfo: UserInfo
  hasPartner: boolean
  isNewUser?: boolean
  needBind?: boolean
  tempToken?: string
}

// ======= Session 操作 =======

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.access_token ?? null
}

export function getCachedAccessToken(): string | null {
  // 同步获取：从 Supabase 内部缓存的 session（需要先调用过 getSession）
  return _cachedUser ? null : null // 实际由 api.ts 异步获取
}

export async function getUserInfo(): Promise<UserInfo | null> {
  const user = await getUser()
  if (!user) return null
  return {
    id: user.id,
    nickname: (user.user_metadata as Record<string, string>)?.nickname || user.phone?.slice(-4) || '用户',
    avatar: (user.user_metadata as Record<string, string>)?.avatar_url || '',
    phone: user.phone,
  }
}

// ======= Token/登录状态判断 =======

export async function isSessionValid(): Promise<boolean> {
  const session = await getSession()
  if (!session) return false
  const buffer = 5 * 60 * 1000 // 5分钟缓冲
  return Date.now() < (session.expires_at! * 1000) - buffer
}

/** 同步版本：由 Splash 初始化缓存后供 App.tsx 使用 */
export function isTokenValid(): boolean {
  return _cachedSessionValid
}

export function hasToken(): boolean {
  return _cachedSessionValid
}

export async function isTokenExpiredButRefreshable(): Promise<boolean> {
  const session = await getSession()
  if (session) return false // 还有效 session
  // 尝试刷新
  const { data } = await supabase.auth.refreshSession()
  return !!data.session
}

// ======= 登录/登出 =======

export async function clearAuthData() {
  await supabase.auth.signOut()
  _cachedSessionValid = false
  _cachedUser = null
}

export async function silentRefresh(): Promise<boolean> {
  const { data } = await supabase.auth.refreshSession()
  if (data.session) {
    _cachedSessionValid = true
    return true
  }
  return false
}

// ======= 缓存管理 =======

/** Splash 初始化时调用，缓存 session 状态。已过期则自动续期。 */
export async function initAuthCache(): Promise<boolean> {
  const session = await getSession()
  if (session) {
    // 检查是否已过期（5分钟缓冲）
    const buffer = 5 * 60 * 1000
    if (Date.now() < (session.expires_at! * 1000) - buffer) {
      _cachedSessionValid = true
      _cachedUser = session.user
      return true
    }
    // 过期了，尝试刷新
    const { data } = await supabase.auth.refreshSession()
    if (data.session) {
      _cachedSessionValid = true
      _cachedUser = data.session.user
      return true
    }
  }
  // 无 session 或刷新失败
  _cachedSessionValid = false
  _cachedUser = null
  return false
}

// ======= 引导页 =======

const ONBOARDING_KEY = 'us_has_onboarding'

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function setOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

// ======= 隐私政策 =======

const PRIVACY_KEY = 'us_ledger_privacy_accepted'

export function hasAcceptedPrivacy(): boolean {
  return localStorage.getItem(PRIVACY_KEY) === 'true'
}

export function acceptPrivacy() {
  localStorage.setItem(PRIVACY_KEY, 'true')
}

// ======= 开发模式：模拟登录（仅微信） =======

export function simulateWechatLogin(nickname?: string, _hasPartner = false): LoginResult {
  console.warn('[DEV MODE] 模拟微信登录 — 仅用于开发测试，不会创建真实账号')
  const token = 'dev_at_' + Math.random().toString(36).slice(2)
  const refresh = 'dev_rt_' + Math.random().toString(36).slice(2)
  return {
    accessToken: token,
    refreshToken: refresh,
    expireIn: 7200,
    userInfo: {
      id: 'dev_' + Date.now().toString(36),
      nickname: nickname || '微信用户(模拟)',
      avatar: '',
    },
    hasPartner: false,
    isNewUser: !hasCompletedOnboarding(),
  }
}

export function simulatePhoneLogin(phone: string, _hasPartner = false): LoginResult {
  console.warn('[DEV MODE] 模拟手机登录 — 仅用于开发测试')
  const token = 'dev_at_' + Math.random().toString(36).slice(2)
  const refresh = 'dev_rt_' + Math.random().toString(36).slice(2)
  return {
    accessToken: token,
    refreshToken: refresh,
    expireIn: 7200,
    userInfo: {
      id: 'dev_' + Date.now().toString(36),
      nickname: phone.slice(-4),
      avatar: '',
      phone,
    },
    hasPartner: false,
    isNewUser: !hasCompletedOnboarding(),
  }
}

// ======= 兼容旧版（逐步废弃） =======

/** @deprecated 使用 initAuthCache() 替代 */
export function saveLoginResult(_result: LoginResult) {
  console.warn('[DEPRECATED] saveLoginResult — 真实 Supabase Auth 不需要手动保存 session')
}

/** @deprecated 保留旧版 key 清理 */
export function migrateLegacyAuth() {
  const legacyKey = 'us_ledger_auth'
  const oldKeys = [
    'us_access_token', 'us_refresh_token', 'us_token_expire',
    'us_user_info', 'us_has_onboarding',
  ]
  try {
    if (localStorage.getItem(legacyKey)) {
      localStorage.removeItem(legacyKey)
    }
    // 清理旧版独立 key（如果还在）
    oldKeys.forEach(k => {
      if (localStorage.getItem(k)) localStorage.removeItem(k)
    })
  } catch { /* ignore */ }
}

/** @deprecated 使用 getUserInfo() 替代 */
export function getLegacyUserInfo() {
  try {
    const raw = localStorage.getItem('us_user_info')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/** @deprecated 保留以兼容可能的调用方 */
export function getRefreshToken(): string | null {
  return null
}

/** @deprecated 保留以兼容可能的调用方 */
export function getTokenExpireTime(): number | null {
  return null
}

/** @deprecated 保留以兼容可能的调用方 */
export function updateUserInfo(_partial: Partial<UserInfo>) {
  // Supabase Auth 模式下，用户信息通过 supabase.auth.updateUser() 更新
}

/** @deprecated 保留以兼容可能的调用方 */
export function updateHasPartner(_hasPartner: boolean) {
  // 改为从 couples 表查询
}
