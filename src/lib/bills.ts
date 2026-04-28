import { supabase } from './supabase'

export interface BillItem {
  id: string
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
  const useSupabase = await checkSupabase()

  if (useSupabase) {
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
    if (!error) return (data || []).map(toBillItem)
    if (error) markSupabaseFailed()
  }

  // localStorage fallback
  let bills = loadLocal()
  if (params?.member && params.member !== 'all') {
    bills = bills.filter(b => b.member === params.member)
  }
  if (params?.startDate) {
    bills = bills.filter(b => b.date >= params.startDate!)
  }
  if (params?.endDate) {
    bills = bills.filter(b => b.date <= params.endDate!)
  }
  if (params?.search) {
    const s = params.search.toLowerCase()
    bills = bills.filter(b =>
      b.note.toLowerCase().includes(s) ||
      b.categoryName.toLowerCase().includes(s) ||
      String(b.amount).includes(s)
    )
  }
  bills.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.time.localeCompare(a.time)
  })
  if (params?.limit) {
    bills = bills.slice(0, params.limit)
  }
  return bills
}

export async function createBill(bill: Omit<BillItem, 'id'>): Promise<BillItem> {
  const useSupabase = await checkSupabase()

  if (useSupabase) {
    // 离线时直接入队
    if (!navigator.onLine) {
      const queue = loadQueue()
      const localId = crypto.randomUUID()
      queue.push({ ...bill, _queuedAt: new Date().toISOString(), _localId: localId })
      saveQueue(queue)
      throw new Error('OFFLINE_QUEUED')
    }

    try {
      const { data, error } = await supabase
        .from('bills')
        .insert(toDbRow(bill))
        .select()
        .single()
      if (!error && data) return toBillItem(data)
      if (error) markSupabaseFailed()
    } catch (e) {
      // 网络错误，入队
      const queue = loadQueue()
      const localId = crypto.randomUUID()
      queue.push({ ...bill, _queuedAt: new Date().toISOString(), _localId: localId })
      saveQueue(queue)
      throw new Error('OFFLINE_QUEUED')
    }
  }

  // localStorage fallback
  const newBill: BillItem = {
    ...bill,
    id: crypto.randomUUID()
  }
  const bills = loadLocal()
  bills.push(newBill)
  saveLocal(bills)
  return newBill
}

export async function updateBill(id: string, bill: Partial<BillItem>): Promise<BillItem> {
  const useSupabase = await checkSupabase()

  if (useSupabase) {
    const { data, error } = await supabase
      .from('bills')
      .update(toDbRow(bill))
      .eq('id', id)
      .select()
      .single()
    if (!error && data) return toBillItem(data)
    if (error) markSupabaseFailed()
  }

  // localStorage fallback
  const bills = loadLocal()
  const index = bills.findIndex(b => b.id === id)
  if (index === -1) throw new Error(`Bill not found: ${id}`)
  bills[index] = { ...bills[index], ...bill, id }
  saveLocal(bills)
  return bills[index]
}

export async function deleteBill(id: string): Promise<void> {
  const useSupabase = await checkSupabase()

  if (useSupabase) {
    const { error } = await supabase.from('bills').delete().eq('id', id)
    if (!error) return
    markSupabaseFailed()
  }

  // localStorage fallback
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

  const useSupabase = await checkSupabase()

  if (useSupabase) {
    const { data, error } = await supabase
      .from('bills')
      .select('type, amount')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (!error && data) {
      const rows = data || []
      const expense = rows.filter((r: { type: string }) => r.type === 'expense').reduce((s: number, r: { amount: unknown }) => s + Number(r.amount), 0)
      const income = rows.filter((r: { type: string }) => r.type === 'income').reduce((s: number, r: { amount: unknown }) => s + Number(r.amount), 0)
      return { totalExpense: expense, totalIncome: income, count: rows.length }
    }
    if (error) markSupabaseFailed()
  }

  // localStorage fallback
  const prefix = `${y}-${m}`
  const bills = loadLocal().filter(b => b.date.startsWith(prefix))
  const expense = bills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const income = bills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  return { totalExpense: expense, totalIncome: income, count: bills.length }
}
