const SUPABASE_TIMEOUT_MS = 3000

export function withTimeout<T>(thenable: PromiseLike<T>, ms: number = SUPABASE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(thenable),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), ms)
    )
  ])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseResponse<T = Record<string, any>> = { data: T | null; error: any }

/**
 * Supabase 查询超时封装。将 PostgrestBuilder（thenable 非标准 Promise）包装为带超时的标准 Promise。
 */
export function supabaseWithTimeout<T>(builder: PromiseLike<SupabaseResponse<T>>, ms?: number): Promise<SupabaseResponse<T>> {
  return withTimeout(builder, ms)
}
