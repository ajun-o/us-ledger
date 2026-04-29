// ======= 情侣系统 — Supabase 服务端操作 =======
// 负责所有服务端数据操作：绑定/解绑/邀请码生成与核验
// 本地缓存由 couple.ts 管理

import { supabase } from './supabase'

export interface CoupleRow {
  id: number
  user_a: string
  user_b: string
  created_at: string
}

// ======= 情侣绑定 =======

export async function getCoupleBinding(): Promise<CoupleRow | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn('[couple] getCoupleBinding: 用户未登录')
    return null
  }

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle()

  if (error) {
    console.error('[couple] getCoupleBinding 查询失败:', error.message, error.code)
  } else {
    console.log('[couple] getCoupleBinding:', data ? `已绑定 (id=${data.id}, user_a=${data.user_a.slice(0, 8)}..., user_b=${data.user_b.slice(0, 8)}...)` : '未绑定')
  }
  return data ?? null
}

export async function getPartnerUserId(): Promise<string | null> {
  const binding = await getCoupleBinding()
  if (!binding) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return user.id === binding.user_a ? binding.user_b : binding.user_a
}

export async function checkHasPartner(): Promise<boolean> {
  const binding = await getCoupleBinding()
  return binding !== null
}

export async function bindCouple(partnerUserId: string): Promise<CoupleRow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  // 确保 user_a 总是较小的 UUID（规范排序）
  const [a, b] = [user.id, partnerUserId].sort()

  const { data, error } = await supabase
    .from('couples')
    .upsert({ user_a: a, user_b: b }, { onConflict: 'user_a,user_b' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unbindCouple(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase
    .from('couples')
    .delete()
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  if (error) throw error
}

// ======= 邀请码 =======

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

export async function generateInviteCodeServer(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeCode()
    const { error } = await supabase.from('invite_codes').insert({
      code,
      created_by: user.id,
    })
    if (!error) return code
    if (error.code !== '23505') throw error
  }
  throw new Error('生成邀请码失败，请重试')
}

export async function validateInviteCodeServer(code: string): Promise<{
  valid: boolean
  creatorUserId?: string
  error?: string
}> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error || !data) {
    return { valid: false, error: '邀请码不存在' }
  }
  if (data.used_by) {
    return { valid: false, error: '邀请码已被使用' }
  }
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: '邀请码已过期' }
  }
  return { valid: true, creatorUserId: data.created_by }
}

export async function useInviteCode(code: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase
    .from('invite_codes')
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq('code', code.toUpperCase())

  if (error) throw error
}

/** 获取当前用户创建的邀请码列表 */
export async function getMyInviteCodes(): Promise<{ code: string; created_at: string; used: boolean }[]> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('code, created_at, used_by')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return []
  return (data || []).map((r: Record<string, unknown>) => ({
    code: r.code as string,
    created_at: r.created_at as string,
    used: !!r.used_by,
  }))
}
