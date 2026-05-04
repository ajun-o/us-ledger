import { supabase } from './supabase'
import { supabaseWithTimeout } from './timeout'

export interface BillItem {
  id: string
  user_id?: string
  categoryIcon: string
  categoryName: string
  note: string
  amount: number
  type: 'expense' | 'income'
  member: 'mine' | 'partner' | 'joint'
  date: string
  time: string
  account: string
}

export function resolveMemberTag(
  billUserId: string,
  myUserId: string,
  partnerUserId: string | null,
  billMember: 'mine' | 'partner' | 'joint'
): 'mine' | 'partner' | 'joint' {
  if (billUserId === myUserId) return billMember
  if (partnerUserId && billUserId === partnerUserId) {
    if (billMember === 'mine') return 'partner'
    if (billMember === 'partner') return 'mine'
    return 'joint'
  }
  return billMember
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function transformBillsPerspective(bills: BillItem[]): Promise<BillItem[]> {
  try {
    const myUserId = await getCurrentUserId()
    if (!myUserId) return bills
    const { getPartnerUserId } = await import('./couple-supabase')
    const partnerUserId = await getPartnerUserId()
    return bills.map(bill => {
      if (!bill.user_id) return bill
      const newMember = resolveMemberTag(bill.user_id, myUserId, partnerUserId, bill.member)
      return newMember !== bill.member ? { ...bill, member: newMember } : bill
    })
  } catch {
    return bills
  }
}

// ====== 内存缓存 ======

const LS_KEY = 'us_ledger_bills'
const QUEUE_KEY = 'us_ledger_queue'
const SYNC_EVENT = 'bills-synced'

let _memoryCache: BillItem[] | null = null

function loadLocal(): BillItem[] {
  if (_memoryCache) return _memoryCache
  try {
    const raw = localStorage.getItem(LS_KEY)
    const bills: BillItem[] = raw ? JSON.parse(raw) : []
    _memoryCache = bills
    return bills
  } catch {
    _memoryCache = []
    return []
  }
}

function saveLocal(bills: BillItem[]): void {
  _memoryCache = bills
  try { localStorage.setItem(LS_KEY, JSON.stringify(bills)) } catch { /* quota exceeded */ }
}

function addToLocal(bill: BillItem): void {
  const bills = loadLocal()
  const idx = bills.findIndex(b => b.id === bill.id)
  if (idx >= 0) bills[idx] = bill
  else bills.push(bill)
  saveLocal(bills)
}

function updateInLocal(id: string, partial: Partial<BillItem>): BillItem {
  const bills = loadLocal()
  const idx = bills.findIndex(b => b.id === id)
  if (idx === -1) throw new Error(`Bill not found: ${id}`)
  bills[idx] = { ...bills[idx], ...partial, id }
  saveLocal(bills)
  return bills[idx]
}

function removeFromLocal(id: string): void {
  const bills = loadLocal().filter(b => b.id !== id)
  saveLocal(bills)
}

// ====== 离线队列 ======

type QueuedBill = Omit<BillItem, 'id'> & { _queuedAt: string; _localId: string }

function loadQueue(): QueuedBill[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveQueue(queue: QueuedBill[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueueSize(): number {
  return loadQueue().length
}

export async function syncQueue(): Promise<number> {
  const queue = loadQueue()
  if (queue.length === 0) return 0
  if (!navigator.onLine) return queue.length

  let synced = 0
  const remaining: QueuedBill[] = []
  for (const item of queue) {
    try {
      const { error } = await supabaseWithTimeout(
        supabase.from('bills').insert(toDbRow(item)).select().single()
      )
      if (error) {
        remaining.push(item)
      } else {
        synced++
      }
    } catch {
      remaining.push(item)
    }
  }
  saveQueue(remaining)
  if (synced > 0) {
    _memoryCache = null
    window.dispatchEvent(new CustomEvent(SYNC_EVENT))
  }
  return remaining.length
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue().then(remaining => {
      if (remaining === 0 && loadQueue().length === 0) {
        window.dispatchEvent(new CustomEvent(SYNC_EVENT))
      }
    })
  })
}

// ====== supabase helpers ======

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBillItem(row: Record<string, any>): BillItem {
  return {
    id: row.id,
    user_id: row.user_id,
    categoryIcon: row.category_icon,
    categoryName: row.category_name,
    note: row.note || '',
    amount: Number(row.amount),
    type: row.type,
    member: row.member,
    date: row.date,
    time: row.time,
    account: row.account || ''
  }
}

function toDbRow(bill: Partial<BillItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (bill.user_id !== undefined) row.user_id = bill.user_id
  if (bill.categoryIcon !== undefined) row.category_icon = bill.categoryIcon
  if (bill.categoryName !== undefined) row.category_name = bill.categoryName
  if (bill.note !== undefined) row.note = bill.note
  if (bill.amount !== undefined) row.amount = bill.amount
  if (bill.type !== undefined) row.type = bill.type
  if (bill.member !== undefined) row.member = bill.member
  if (bill.date !== undefined) row.date = bill.date
  if (bill.time !== undefined) row.time = bill.time
  if (bill.account !== undefined) row.account = bill.account
  return row
}

// ====== Supabase 连接状态 ======

let _supabaseFailed = false

function markSupabaseFailed() {
  if (!_supabaseFailed) {
    _supabaseFailed = true
    console.warn('[bills] Supabase 不可用，使用本地数据')
  }
}

function markSupabaseOk() {
  _supabaseFailed = false
}

export function isSupabaseAvailable(): boolean {
  return !_supabaseFailed
}

// ====== 后台同步 Supabase → localStorage ======

async function backgroundSyncFromSupabase(params?: {
  member?: string
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
}): Promise<BillItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from('bills')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false })

  if (params?.member && params.member !== 'all') query = query.eq('member', params.member)
  if (params?.startDate) query = query.gte('date', params.startDate)
  if (params?.endDate) query = query.lte('date', params.endDate)
  if (params?.search) {
    const s = params.search
    query = query.or(`note.ilike.%${s}%,category_name.ilike.%${s}%`)
  }
  if (params?.limit) query = query.limit(params.limit)

  const { data, error } = await supabaseWithTimeout(query)
  if (error || !data) {
    markSupabaseFailed()
    throw new Error('Supabase sync failed')
  }

  markSupabaseOk()

  // 合并到 localStorage（以 Supabase 数据为准，更新本地缓存）
  const supabaseBills = (data as Record<string, unknown>[]).map(toBillItem)
  const supabaseIds = new Set(supabaseBills.map(b => b.id))
  const localBills = loadLocal()

  // 保留 localStorage 独有的账单（离线创建的）
  const localOnly = localBills.filter(b => !supabaseIds.has(b.id))
  const merged = [...supabaseBills, ...localOnly]
  saveLocal(merged)

  return supabaseBills
}

// ====== CRUD API（离线优先） ======

/**
 * 获取账单列表（离线优先）
 * - 立即返回 localStorage 缓存数据
 * - 后台尝试从 Supabase 同步（3s 超时）
 * - 同步完成后通过 onSync 回调通知调用方更新 UI
 */
export async function fetchBills(
  params?: {
    member?: string
    startDate?: string
    endDate?: string
    search?: string
    limit?: number
  },
  onSync?: (bills: BillItem[]) => void
): Promise<BillItem[]> {
  // 1. 立即返回本地数据
  let localBills = loadLocal()

  // 应用过滤
  if (params?.member && params.member !== 'all') {
    localBills = localBills.filter(b => b.member === params.member)
  }
  if (params?.startDate) {
    localBills = localBills.filter(b => b.date >= params.startDate!)
  }
  if (params?.endDate) {
    localBills = localBills.filter(b => b.date <= params.endDate!)
  }
  if (params?.search) {
    const s = params.search.toLowerCase()
    localBills = localBills.filter(b =>
      b.note.toLowerCase().includes(s) ||
      b.categoryName.toLowerCase().includes(s) ||
      String(b.amount).includes(s)
    )
  }

  localBills.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.time.localeCompare(a.time)
  })
  if (params?.limit) {
    localBills = localBills.slice(0, params.limit)
  }

  // 2. 后台同步 Supabase（不阻塞返回）
  if (navigator.onLine && !_supabaseFailed) {
    backgroundSyncFromSupabase(params).then(supabaseBills => {
      if (onSync) onSync(supabaseBills)
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
        detail: { bills: supabaseBills }
      }))
    }).catch(() => {
      // 超时或失败，静默处理
    })
  }

  return localBills
}

export async function createBill(bill: Omit<BillItem, 'id'>): Promise<BillItem> {
  const { data: { user } } = await supabase.auth.getUser()
  const billWithUser = { ...bill, user_id: user?.id ?? undefined }

  // 离线：直接入本地队列
  if (!navigator.onLine) {
    const queue = loadQueue()
    const localId = crypto.randomUUID()
    queue.push({ ...billWithUser, _queuedAt: new Date().toISOString(), _localId: localId })
    saveQueue(queue)
    throw new Error('OFFLINE_QUEUED')
  }

  // 在线：尝试 Supabase（3s 超时）
  try {
    const { data, error } = await supabaseWithTimeout(
      supabase.from('bills').insert(toDbRow(billWithUser)).select().single()
    )
    if (data && !error) {
      markSupabaseOk()
      const result = toBillItem(data as Record<string, unknown>)
      addToLocal(result)
      return result
    }
  } catch { /* 超时或网络错误，继续降级 */ }

  // Supabase 失败：降级到 localStorage
  markSupabaseFailed()
  const newBill: BillItem = { ...billWithUser, id: crypto.randomUUID() }
  addToLocal(newBill)
  return newBill
}

export async function updateBill(id: string, bill: Partial<BillItem>): Promise<BillItem> {
  // 先更新本地（即时响应）
  const result = updateInLocal(id, bill)

  // 后台尝试同步 Supabase
  if (navigator.onLine && !_supabaseFailed) {
    supabaseWithTimeout(
      supabase.from('bills').update(toDbRow(bill)).eq('id', id)
    ).catch(() => { /* 静默失败 */ })
  }

  return result
}

export async function deleteBill(id: string): Promise<void> {
  removeFromLocal(id)

  // 后台尝试同步 Supabase
  if (navigator.onLine && !_supabaseFailed) {
    supabaseWithTimeout(
      supabase.from('bills').delete().eq('id', id)
    ).catch(() => { /* 静默失败 */ })
  }
}

export async function fetchMonthStats(
  year?: number,
  month?: number,
  onSync?: (stats: { totalExpense: number; totalIncome: number; count: number }) => void
): Promise<{ totalExpense: number; totalIncome: number; count: number }> {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = (month ?? now.getMonth() + 1).toString().padStart(2, '0')
  const startOfMonth = `${y}-${m}-01`
  const lastDay = new Date(y, parseInt(m), 0).getDate()
  const endOfMonth = `${y}-${m}-${String(lastDay).padStart(2, '0')}`

  // 1. 立即计算本地统计
  const prefix = `${y}-${m}`
  const localBills = loadLocal().filter(b => b.date.startsWith(prefix))
  const localExpense = localBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const localIncome = localBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const localResult = { totalExpense: localExpense, totalIncome: localIncome, count: localBills.length }

  // 2. 后台同步 Supabase
  if (navigator.onLine && !_supabaseFailed) {
    supabaseWithTimeout(
      supabase.from('bills').select('*').gte('date', startOfMonth).lte('date', endOfMonth)
    ).then(({ data, error }) => {
      if (!error && data) {
        const supabaseBills = (data as Record<string, unknown>[]).map(toBillItem)
        // 合并到本地缓存
        const supabaseIds = new Set(supabaseBills.map(b => b.id))
        const localOnly = loadLocal().filter(b => !supabaseIds.has(b.id))
        saveLocal([...supabaseBills, ...localOnly])

        // 重新计算统计
        const allBills = [...supabaseBills, ...localOnly.filter(b => b.date.startsWith(prefix))]
        const expense = allBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
        const income = allBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
        const syncedResult = { totalExpense: expense, totalIncome: income, count: allBills.length }

        if (onSync) onSync(syncedResult)
      }
    }).catch(() => {})
  }

  return localResult
}
