// ======= Token 管理模块 =======
// 存储策略：独立 key，与后端 spec 对齐
// Web/H5 使用 localStorage；React Native 替换为 AsyncStorage + Keychain

const KEYS = {
  accessToken: 'us_access_token',
  refreshToken: 'us_refresh_token',
  tokenExpire: 'us_token_expire',
  userInfo: 'us_user_info',
  hasOnboarding: 'us_has_onboarding',
} as const

// 兼容旧版单 key 存储，自动迁移
const LEGACY_KEY = 'us_ledger_auth'

function migrateLegacy(): boolean {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (data.accessToken) localStorage.setItem(KEYS.accessToken, data.accessToken)
    if (data.refreshToken) localStorage.setItem(KEYS.refreshToken, data.refreshToken)
    if (data.tokenExpireTime) localStorage.setItem(KEYS.tokenExpire, String(data.tokenExpireTime))
    if (data.userInfo) localStorage.setItem(KEYS.userInfo, JSON.stringify(data.userInfo))
    localStorage.removeItem(LEGACY_KEY)
    return true
  } catch { return false }
}
migrateLegacy()

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
  expireIn: number          // 秒
  userInfo: UserInfo
  hasPartner: boolean
  isNewUser?: boolean
  needBind?: boolean
  tempToken?: string
}

// ======= 读写 =======

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.accessToken) || null
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.refreshToken) || null
}

export function getTokenExpireTime(): number | null {
  const v = localStorage.getItem(KEYS.tokenExpire)
  return v ? Number(v) : null
}

export function getUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem(KEYS.userInfo)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveLoginResult(result: LoginResult) {
  localStorage.setItem(KEYS.accessToken, result.accessToken)
  localStorage.setItem(KEYS.refreshToken, result.refreshToken)
  localStorage.setItem(KEYS.tokenExpire, String(Date.now() + result.expireIn * 1000))
  localStorage.setItem(KEYS.userInfo, JSON.stringify({
    ...result.userInfo,
    hasPartner: result.hasPartner,
  }))
}

export function clearAuthData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}

export function updateUserInfo(partial: Partial<UserInfo>) {
  const info = getUserInfo()
  if (info) {
    localStorage.setItem(KEYS.userInfo, JSON.stringify({ ...info, ...partial }))
  }
}

export function updateHasPartner(hasPartner: boolean) {
  updateUserInfo({ hasPartner })
}

// ======= Token 判断 =======

export function isTokenValid(): boolean {
  const token = getAccessToken()
  const expire = getTokenExpireTime()
  if (!token || !expire) return false
  const buffer = 5 * 60 * 1000 // 5分钟缓冲
  return Date.now() < expire - buffer
}

export function isTokenExpiredButRefreshable(): boolean {
  const refresh = getRefreshToken()
  if (!refresh) return false
  // 30天内未登录则强制重新登录
  const expire = getTokenExpireTime()
  if (expire && Date.now() - expire > 30 * 24 * 3600 * 1000) {
    clearAuthData()
    return false
  }
  return !isTokenValid()
}

export function hasToken(): boolean {
  return !!getAccessToken()
}

// ======= 刷新 =======

export async function silentRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false

  try {
    const resp = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
      signal: AbortSignal.timeout(5000),
    })

    if (!resp.ok) {
      // 多设备登录：旧设备 refreshToken 已失效
      clearAuthData()
      return false
    }

    const result: LoginResult = await resp.json()
    saveLoginResult(result)
    return true
  } catch {
    if (isTokenValid()) return true
    return false
  }
}

// ======= 引导页 =======

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(KEYS.hasOnboarding) === 'true'
}

export function setOnboardingComplete() {
  localStorage.setItem(KEYS.hasOnboarding, 'true')
}

// ======= 隐私政策 =======

const PRIVACY_KEY = 'us_ledger_privacy_accepted'

export function hasAcceptedPrivacy(): boolean {
  return localStorage.getItem(PRIVACY_KEY) === 'true'
}

export function acceptPrivacy() {
  localStorage.setItem(PRIVACY_KEY, 'true')
}

// ======= 模拟登录（开发用） =======

export function simulateWechatLogin(nickname?: string, hasPartner = false): LoginResult {
  const token = 'sim_at_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  const refresh = 'sim_rt_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  return {
    accessToken: token,
    refreshToken: refresh,
    expireIn: 7200,
    userInfo: {
      id: 'u_' + Date.now().toString(36),
      nickname: nickname || '微信用户',
      avatar: '',
    },
    hasPartner,
    isNewUser: !hasCompletedOnboarding(),
  }
}

export function simulatePhoneLogin(phone: string, hasPartner = false): LoginResult {
  const token = 'sim_at_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  const refresh = 'sim_rt_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  return {
    accessToken: token,
    refreshToken: refresh,
    expireIn: 7200,
    userInfo: {
      id: 'u_' + Date.now().toString(36),
      nickname: phone.slice(-4),
      avatar: '',
      phone,
    },
    hasPartner,
    isNewUser: !hasCompletedOnboarding(),
  }
}
