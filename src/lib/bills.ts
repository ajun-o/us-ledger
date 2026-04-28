import { supabase } from './supabase'

// 前端统一使用的账单类型（camelCase）
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

// DB snake_case → 前端 camelCase
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

// 前端 camelCase → DB snake_case
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

function tableNotReady(err: { code?: string }): boolean {
  return err.code === '42P01' || err.code === 'PGRST205'
}

// ====== CRUD API ======

export async function fetchBills(params?: {
  member?: string
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
}): Promise<BillItem[]> {
  let query = supabase
    .from('bills')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false })

  if (params?.member && params.member !== 'all') {
    query = query.eq('member', params.member)
  }
  if (params?.startDate) {
    query = query.gte('date', params.startDate)
  }
  if (params?.endDate) {
    query = query.lte('date', params.endDate)
  }
  if (params?.search) {
    const s = params.search
    query = query.or(`note.ilike.%${s}%,category_name.ilike.%${s}%`)
  }
  if (params?.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query

  if (error) {
    if (tableNotReady(error)) return []
    throw error
  }

  return (data || []).map(toBillItem)
}

export async function createBill(bill: Omit<BillItem, 'id'>): Promise<BillItem> {
  const { data, error } = await supabase
    .from('bills')
    .insert(toDbRow(bill))
    .select()
    .single()

  if (error) {
    if (tableNotReady(error)) throw new Error('bills 表尚未创建')
    throw error
  }

  return toBillItem(data)
}

export async function updateBill(id: string, bill: Partial<BillItem>): Promise<BillItem> {
  const { data, error } = await supabase
    .from('bills')
    .update(toDbRow(bill))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return toBillItem(data)
}

export async function deleteBill(id: string): Promise<void> {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function fetchMonthStats(): Promise<{
  totalExpense: number
  totalIncome: number
  count: number
}> {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const startOfMonth = `${y}-${m}-01`
  const endOfMonth = `${y}-${m}-31`

  const { data, error } = await supabase
    .from('bills')
    .select('type, amount')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  if (error) {
    if (tableNotReady(error)) return { totalExpense: 0, totalIncome: 0, count: 0 }
    throw error
  }

  const rows = data || []
  const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
  const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)

  return { totalExpense: expense, totalIncome: income, count: rows.length }
}
