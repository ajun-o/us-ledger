// ========== 账户数据层 ==========

import { type BillItem } from './bills'

export interface Account {
  id: string
  name: string
  icon: string
  initialBalance: number
  createdAt: string
}

export interface BalanceAdjustment {
  id: string
  accountId: string
  amount: number
  reason: string
  createdAt: string
}

const ACCOUNTS_KEY = 'us_ledger_accounts'
const ADJUSTMENTS_KEY = 'us_ledger_adjustments'

// ========== 默认账户 ==========
const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'wechat', name: '微信', icon: '💬', initialBalance: 0, createdAt: new Date().toISOString() },
  { id: 'alipay', name: '支付宝', icon: '💳', initialBalance: 0, createdAt: new Date().toISOString() },
  { id: 'bank', name: '银行卡', icon: '🏦', initialBalance: 0, createdAt: new Date().toISOString() },
  { id: 'cash', name: '现金', icon: '💵', initialBalance: 0, createdAt: new Date().toISOString() }
]

// ========== 账户 CRUD ==========
export function fetchAccounts(): Account[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* ignore */ }
  }
  // 首次初始化
  saveAccounts(DEFAULT_ACCOUNTS)
  return DEFAULT_ACCOUNTS
}

function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function getAccountById(id: string): Account | undefined {
  return fetchAccounts().find(a => a.id === id)
}

export function getAccountByName(name: string): Account | undefined {
  return fetchAccounts().find(a => a.name === name)
}

export function createAccount(data: Omit<Account, 'id' | 'createdAt'>): Account {
  const accounts = fetchAccounts()
  const account: Account = {
    ...data,
    id: `acct_${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  accounts.push(account)
  saveAccounts(accounts)
  return account
}

export function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>): Account | null {
  const accounts = fetchAccounts()
  const idx = accounts.findIndex(a => a.id === id)
  if (idx === -1) return null
  accounts[idx] = { ...accounts[idx], ...data }
  saveAccounts(accounts)
  return accounts[idx]
}

export function deleteAccount(id: string): boolean {
  const accounts = fetchAccounts()
  const filtered = accounts.filter(a => a.id !== id)
  if (filtered.length === accounts.length) return false
  saveAccounts(filtered)
  return true
}

// ========== 余额计算 ==========
export function getAccountBalance(accountName: string, bills: BillItem[]): number {
  const account = fetchAccounts().find(a => a.name === accountName)
  const base = account?.initialBalance ?? 0
  const adjustments = fetchAdjustments().filter(a => a.accountId === account?.id)
  const adjTotal = adjustments.reduce((s, a) => s + a.amount, 0)
  const income = bills.filter(b => b.account === accountName && b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const expense = bills.filter(b => b.account === accountName && b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  return Math.round((base + adjTotal + income - expense) * 100) / 100
}

// ========== 余额调整 ==========
export function fetchAdjustments(accountId?: string): BalanceAdjustment[] {
  const raw = localStorage.getItem(ADJUSTMENTS_KEY)
  let all: BalanceAdjustment[] = raw ? JSON.parse(raw) : []
  if (accountId) all = all.filter(a => a.accountId === accountId)
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function addAdjustment(data: Omit<BalanceAdjustment, 'id' | 'createdAt'>): BalanceAdjustment {
  const raw = localStorage.getItem(ADJUSTMENTS_KEY)
  const all: BalanceAdjustment[] = raw ? JSON.parse(raw) : []
  const adj: BalanceAdjustment = {
    ...data,
    id: `adj_${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  all.push(adj)
  localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(all))
  return adj
}

// ========== 获取账单中使用的账户列表 ==========
export function getBillAccountNames(bills: BillItem[]): Map<string, number> {
  const map = new Map<string, number>()
  bills.forEach(b => {
    if (b.account) map.set(b.account, (map.get(b.account) || 0) + 1)
  })
  return map
}
