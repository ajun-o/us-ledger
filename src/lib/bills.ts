import { supabase } from './supabase'

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

/** 根据账单创建者 ID 解析当前用户的视角标签 */
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

/** 将账单列表的 member 标签转换为当前用户的视角 */
export async function transformBillsPerspective(bills: BillItem[]): Promise<BillItem[]> {
  try {
    const myUserId = await getCurrentUserId()
    if (!myUserId) {
      console.warn('[bills] transformBillsPerspective: 无法获取当前用户ID，跳过视角转换')
      return bills
    }

    const { getPartnerUserId } = await import('./couple-supabase')
    const partnerUserId = await getPartnerUserId()
    console.log('[bills] transformBillsPerspective: 我的ID=' + myUserId?.slice(0, 8) + '..., 伴侣ID=' + (partnerUserId?.slice(0, 8) + '...' || '无'))

    return bills.map(bill => {
      if (!bill.user_id) return bill
      const newMember = resolveMemberTag(bill.user_id, myUserId, partnerUserId, bill.member)
      if (newMember !== bill.member) {
        console.log(`[bills] 视角转换: 账单 ${bill.id.slice(0, 8)}... member ${bill.member} → ${newMember} (账单创建者=${bill.user_id.slice(0, 8)}...)`)
      }
      return { ...bill, member: newMember }
    })
  } catch (e) {
    console.error('[bills] transformBillsPerspective 异常:', e)
    return bills
  }
}

// ====== localStorage fallback ======

const LS_KEY = 'us_ledger_bills'
const QUEUE_KEY = 'us_ledger_queue'

function loadLocal(): BillItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocal(bills: BillItem[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(bills))
}

// ====== 离线队列 ======

type QueuedBill = Omit<BillItem, 'id'> & { _queuedAt: string; _localId: string }

function loadQueue(): QueuedBill[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
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

  const useSupabase = await checkSupabase()
  if (!useSupabase) {
    // Supabase 不可用，直接写入 localStorage
    const bills = loadLocal()
    for (const item of queue) {
      bills.push({ ...item, id: item._localId })
    }
    saveLocal(bills)
    saveQueue([])
    return 0
  }

  let synced = 0
  const remaining: QueuedBill[] = []
  for (const item of queue) {
    try {
      const { error } = await supabase.from('bills').insert(toDbRow(item)).select().single()
      if (error) {
        markSupabaseFailed()
        remaining.push(item)
      } else {
        synced++
      }
    } catch {
      remaining.push(item)
    }
  }
  saveQueue(remaining)
  return remaining.length
}

// 监听网络恢复自动同步
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue().then(remaining => {
      if (remaining === 0 && loadQueue().length > 0) {
        // 全部同步完成，触发页面刷新
        window.dispatchEvent(new CustomEvent('queue-synced'))
      }
    })
  })
}

// ====== supabase helpers (keep for future) ======

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

let supabaseReady = false
let supabaseChecked = false

async function checkSupabase(): Promise<boolean> {
  if (supabaseChecked) return supabaseReady
  supabaseChecked = true
  try {
    const { error } = await supabase.from('bills').select('id').limit(1)
    if (!error) {
      supabaseReady = true
      return true
    }
  } catch { /* fall through */ }
  return false
}

function markSupabaseFailed() {
  if (supabaseReady) {
    supabaseReady = false
    supabaseChecked = false
    console.warn('[bills] Supabase 操作失败，降级到 localStorage')
  }
}

// ====== CRUD API ======

export async function fetchBills(params?: {
  member?: string
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
}): Promise<BillItem[]> {
  // 诊断: 确认当前认证状态
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[bills] fetchBills 当前用户:', user?.id?.slice(0, 8) + '...', '手机号:', user?.phone)

  // 同时从 Supabase 和 localStorage 读取，以 ID 去重合并
  const idSet = new Set<string>()
  const bills: BillItem[] = []

  // 优先 Supabase
  try {
    let query = supabase
      .from('bills')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (params?.member && params.member !== 'all') {
      query = query.eq('member', params.member)
    }
    if (params?.startDate) query = query.gte('date', params.startDate)
    if (params?.endDate) query = query.lte('date', params.endDate)
    if (params?.search) {
      const s = params.search
      query = query.or(`note.ilike.%${s}%,category_name.ilike.%${s}%`)
    }
    if (params?.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) {
      console.error('[bills] Supabase 查询失败:', error.message, error.code, error.details)
    } else if (data) {
      console.log(`[bills] Supabase 返回 ${data.length} 条账单`)
      for (const row of data) {
        const bill = toBillItem(row)
        idSet.add(bill.id)
        bills.push(bill)
      }
    }
  } catch (err) {
    console.error('[bills] Supabase 查询异常:', err)
  }

  // 补充 localStorage 中 Supabase 没有的账单
  const localBills = loadLocal()
  let localMergeCount = 0
  for (const bill of localBills) {
    if (!idSet.has(bill.id)) {
      bills.push(bill)
      localMergeCount++
    }
  }
  console.log(`[bills] localStorage 补充 ${localMergeCount} 条，合并后共 ${bills.length} 条`)

  // 应用本地过滤（Supabase 那边已经做了服务端过滤，localStorage 补充的需补过滤）
  let result = bills
  if (params?.member && params.member !== 'all') {
    result = result.filter(b => b.member === params.member)
  }
  if (params?.startDate) {
    result = result.filter(b => b.date >= params.startDate!)
  }
  if (params?.endDate) {
    result = result.filter(b => b.date <= params.endDate!)
  }
  if (params?.search) {
    const s = params.search.toLowerCase()
    result = result.filter(b =>
      b.note.toLowerCase().includes(s) ||
      b.categoryName.toLowerCase().includes(s) ||
      String(b.amount).includes(s)
    )
  }

  result.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.time.localeCompare(a.time)
  })
  if (params?.limit) {
    result = result.slice(0, params.limit)
  }
  return result
}

export async function createBill(bill: Omit<BillItem, 'id'>): Promise<BillItem> {
  // 附上当前用户 ID
  const { data: { user } } = await supabase.auth.getUser()
  const billWithUser = { ...bill, user_id: user?.id ?? undefined }

  // 离线时直接入队
  if (!navigator.onLine) {
    const queue = loadQueue()
    const localId = crypto.randomUUID()
    queue.push({ ...billWithUser, _queuedAt: new Date().toISOString(), _localId: localId })
    saveQueue(queue)
    throw new Error('OFFLINE_QUEUED')
  }

  let supabaseOk = false
  try {
    const { data, error } = await supabase
      .from('bills')
      .insert(toDbRow(billWithUser))
      .select()
      .single()
    if (error) {
      console.error('[bills] Supabase 写入失败:', error.message, error.code, error.details)
    } else if (data) {
      supabaseOk = true
      const result = toBillItem(data)
      // 同步写入 localStorage，确保降级读取时不丢失
      const bills = loadLocal()
      const idx = bills.findIndex(b => b.id === result.id)
      if (idx >= 0) bills[idx] = result
      else bills.push(result)
      saveLocal(bills)
      return result
    }
  } catch (err) {
    console.error('[bills] Supabase 写入异常:', err)
    // 网络错误，入队
    const queue = loadQueue()
    const localId = crypto.randomUUID()
    queue.push({ ...billWithUser, _queuedAt: new Date().toISOString(), _localId: localId })
    saveQueue(queue)
    throw new Error('OFFLINE_QUEUED')
  }

  // Supabase 写入失败，降级到 localStorage
  if (!supabaseOk) {
    console.warn('[bills] Supabase 不可用，降级到 localStorage')
  }
  const newBill: BillItem = {
    ...billWithUser,
    id: crypto.randomUUID()
  }
  const bills = loadLocal()
  bills.push(newBill)
  saveLocal(bills)
  return newBill
}

export async function updateBill(id: string, bill: Partial<BillItem>): Promise<BillItem> {
  // 同时更新 Supabase 和 localStorage
  let updated = false
  try {
    const { data, error } = await supabase
      .from('bills')
      .update(toDbRow(bill))
      .eq('id', id)
      .select()
      .single()
    if (!error && data) updated = true
  } catch { /* 忽略，继续更新 localStorage */ }

  const bills = loadLocal()
  const index = bills.findIndex(b => b.id === id)
  if (index === -1 && !updated) throw new Error(`Bill not found: ${id}`)
  if (index !== -1) {
    bills[index] = { ...bills[index], ...bill, id }
    saveLocal(bills)
    return bills[index]
  }
  // 只在 Supabase 存在的情况（理论上 fetchBills 的合并逻辑会保证两端同步）
  throw new Error(`Bill not found: ${id}`)
}

export async function deleteBill(id: string): Promise<void> {
  // 同时删除 Supabase 和 localStorage
  try {
    await supabase.from('bills').delete().eq('id', id)
  } catch { /* 忽略，继续删除 localStorage */ }

  const bills = loadLocal().filter(b => b.id !== id)
  saveLocal(bills)
}

export async function fetchMonthStats(year?: number, month?: number): Promise<{
  totalExpense: number
  totalIncome: number
  count: number
}> {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = (month ?? now.getMonth() + 1).toString().padStart(2, '0')
  const startOfMonth = `${y}-${m}-01`
  // 获取当月最后一天
  const lastDay = new Date(y, parseInt(m), 0).getDate()
  const endOfMonth = `${y}-${m}-${String(lastDay).padStart(2, '0')}`

  // 合并 Supabase 和 localStorage 的统计
  const idSet = new Set<string>()
  let allBills: BillItem[] = []

  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (!error && data) {
      for (const row of data) {
        const bill = toBillItem(row)
        idSet.add(bill.id)
        allBills.push(bill)
      }
    }
  } catch { /* 降级 */ }

  const prefix = `${y}-${m}`
  for (const bill of loadLocal()) {
    if (!idSet.has(bill.id) && bill.date.startsWith(prefix)) {
      allBills.push(bill)
    }
  }

  const expense = allBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const income = allBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  return { totalExpense: expense, totalIncome: income, count: allBills.length }
}
