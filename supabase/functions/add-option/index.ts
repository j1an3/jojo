// Supabase Edge Function: Add Option with Rate Limiting
// Deploy: supabase functions deploy add-option

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddOptionRequest {
  content: string;
  clientFingerprint: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, clientFingerprint }: AddOptionRequest = await req.json()

    // Validate content
    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content required', message: 'Nội dung không được để trống!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (content.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Content too long', message: 'Nội dung quá dài! Tối đa 100 ký tự.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate content format (only letters, numbers, spaces, Vietnamese)
    const validContentRegex = /^[a-zA-ZÀ-ỹ0-9\s\-\_\.]+$/
    if (!validContentRegex.test(content)) {
      return new Response(
        JSON.stringify({ error: 'Invalid content', message: 'Nội dung chứa ký tự không hợp lệ!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rate limiting: 10 seconds cooldown
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: recentAdds } = await supabase
      .from('add_logs')
      .select('*')
      .or(`ip.eq.${clientIP},fingerprint.eq.${clientFingerprint}`)
      .gte('added_at', tenSecondsAgo)

    if (recentAdds && recentAdds.length > 0) {
      const timeLeft = Math.ceil((new Date(recentAdds[0].added_at).getTime() + 10000 - Date.now()) / 1000)
      return new Response(
        JSON.stringify({
          error: 'Rate limited',
          message: `Vui lòng đợi ${timeLeft} giây!`,
          timeLeft
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // Session limit: max 1 option per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { data: sessionAdds, count } = await supabase
      .from('add_logs')
      .select('*', { count: 'exact' })
      .or(`ip.eq.${clientIP},fingerprint.eq.${clientFingerprint}`)
      .gte('added_at', oneHourAgo)

    if (count && count >= 1) {
      return new Response(
        JSON.stringify({
          error: 'Session limit',
          message: 'Bạn đã đề xuất nội dung rồi! Vui lòng đợi 1 tiếng.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // Check for duplicates (case-insensitive, normalized)
    const normalizedContent = content.toLowerCase().replace(/\s+/g, ' ').trim()
    const { data: existingOptions } = await supabase
      .from('vote_options')
      .select('content')

    if (existingOptions) {
      const isDuplicate = existingOptions.some(option => {
        const existingNormalized = option.content.toLowerCase().replace(/\s+/g, ' ').trim()
        return existingNormalized === normalizedContent
      })

      if (isDuplicate) {
        return new Response(
          JSON.stringify({
            error: 'Duplicate',
            message: '⚠️ Nội dung này đã tồn tại! Vui lòng đề xuất nội dung khác. MUDA!'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Insert new option
    const { error: insertError } = await supabase
      .from('vote_options')
      .insert({ content: content.trim(), vote_count: 0 })

    if (insertError) throw insertError

    // Log the addition
    await supabase
      .from('add_logs')
      .insert({
        ip: clientIP,
        fingerprint: clientFingerprint,
        content: content.trim(),
        added_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Đề xuất thành công! ORA ORA!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
