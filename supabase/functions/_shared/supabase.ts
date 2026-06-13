import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function requiredEnv(primaryName: string, fallbackName?: string) {
  const value = Deno.env.get(primaryName) ?? (fallbackName ? Deno.env.get(fallbackName) : undefined)
  if (!value) throw new Error(`Missing required secret: ${primaryName}${fallbackName ? ` or ${fallbackName}` : ''}`)
  return value
}

export function serviceClient() {
  return createClient(
    requiredEnv('SUPABASE_URL', 'URL_SUPABASE'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY_SUPABASE'),
  )
}

export async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing authorization header')

  const client = createClient(requiredEnv('SUPABASE_URL', 'URL_SUPABASE'), requiredEnv('SUPABASE_ANON_KEY', 'ANON_KEY_SUPABASE'), {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('Unauthorized')
  return data.user
}
