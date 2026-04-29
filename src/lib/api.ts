// ======= API 请求封装 =======
// 统一拦截器：Token 自动携带、401 静默刷新重试、业务错误码映射、网络异常处理

import { getAccessToken, silentRefresh, clearAuthData } from './auth'

// 业务错误码映射表
const ERROR_MAP: Record<number, string> = {
  1001: '验证码错误',
  1002: '验证码过期',
  1003: '手机号已注册',
  1004: '手机号未注册',
  1005: '密码错误',
  1006: '账号被锁定',
  1007: '邀请码无效',
  1008: '邀请码已过期',
  1009: '对方已绑定其他用户',
  1010: '微信授权失败',
}

// 离线请求队列
const offlineQueue: Array<() => Promise<void>> = []

// Token 刷新中的 Promise，防止并发刷新
let refreshPromise: Promise<boolean> | null = null

function getOrRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = silentRefresh().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// ======= 路由跳转回调（由 App 层注入） =======
let onForceLogout: (() => void) | null = null

export function setForceLogoutHandler(handler: () => void) {
  onForceLogout = handler
}

// ======= 核心请求 =======

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
  skipRefresh?: boolean // 防止刷新死循环
}

export async function api<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, skipRefresh, ...fetchOptions } = options

  // 构建 Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  }

  if (!skipAuth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  // 发起请求
  let resp: Response
  try {
    resp = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: fetchOptions.signal,
    })
  } catch (err: unknown) {
    // 网络错误：无网络或超时
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('请求超时，请检查网络', 0, true)
    }
    // 离线 → 入队
    if (!navigator.onLine) {
      offlineQueue.push(() => api(url, options).then(() => {}))
      throw new ApiError('网络不稳定，请检查连接', 0, true)
    }
    throw new ApiError('网络不稳定，请检查连接', 0, true)
  }

  // 401 → 自动刷新 Token 重试
  if (resp.status === 401 && !skipRefresh) {
    const refreshed = await getOrRefresh()
    if (refreshed) {
      return api<T>(url, { ...options, skipRefresh: true })
    }
    // 刷新失败 → 清除登录态
    clearAuthData()
    onForceLogout?.()
    throw new ApiError('登录已过期，请重新登录', 401)
  }

  // 500
  if (resp.status >= 500) {
    throw new ApiError('服务繁忙，请稍后再试', resp.status)
  }

  // 解析响应
  const json = await resp.json().catch(() => null)

  // 业务错误
  if (json && json.code !== undefined && json.code !== 0) {
    const msg = ERROR_MAP[json.code] || json.message || '请求失败'
    throw new ApiError(msg, json.code)
  }

  return json as T
}

// ======= 错误类 =======

export class ApiError extends Error {
  code: number
  isNetworkError: boolean

  constructor(message: string, code: number, isNetworkError = false) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.isNetworkError = isNetworkError
  }
}

// ======= 离线队列同步 =======

export function getOfflineQueueLength(): number {
  return offlineQueue.length
}

export async function syncOfflineQueue(): Promise<number> {
  if (offlineQueue.length === 0) return 0
  const tasks = [...offlineQueue]
  offlineQueue.length = 0
  let synced = 0
  for (const task of tasks) {
    try {
      await task()
      synced++
    } catch {
      // 同步失败重新入队
      offlineQueue.push(task)
    }
  }
  return synced
}

// 监听网络恢复
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueue()
  })
}

// ======= 便捷方法 =======

export const apiGet = <T>(url: string, opts?: RequestOptions) =>
  api<T>(url, { ...opts, method: 'GET' })

export const apiPost = <T>(url: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(url, { ...opts, method: 'POST', body })

export const apiPut = <T>(url: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(url, { ...opts, method: 'PUT', body })

export const apiDelete = <T>(url: string, opts?: RequestOptions) =>
  api<T>(url, { ...opts, method: 'DELETE' })
