// Supabase Edge Function: Vote with Rate Limiting
// Deploy: supabase functions deploy vote-action

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoteRequest {
  optionId: number;
  clientFingerprint: string; // Browser fingerprint
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { optionId, clientFingerprint }: VoteRequest = await req.json()

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check rate limit (create table: vote_logs with ip, fingerprint, voted_at, option_id)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()

    const { data: recentVotes } = await supabase
      .from('vote_logs')
      .select('*')
      .or(`ip.eq.${clientIP},fingerprint.eq.${clientFingerprint}`)
      .gte('voted_at', fiveSecondsAgo)

    if (recentVotes && recentVotes.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Rate limited',
          message: 'Vui lòng đợi 5 giây trước khi vote tiếp!'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      )
    }

    // Check if already voted for this option (24 hours)
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
    const { data: existingVote } = await supabase
      .from('vote_logs')
      .select('*')
      .or(`ip.eq.${clientIP},fingerprint.eq.${clientFingerprint}`)
      .eq('option_id', optionId)
      .gte('voted_at', oneDayAgo)
      .single()

    if (existingVote) {
      return new Response(
        JSON.stringify({
          error: 'Already voted',
          message: 'Bạn đã vote cho nội dung này rồi!'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Increment vote count (get current, then increment)
    const { data: currentOption } = await supabase
      .from('vote_options')
      .select('vote_count')
      .eq('id', optionId)
      .single()

    const { error: voteError } = await supabase
      .from('vote_options')
      .update({ vote_count: (currentOption?.vote_count || 0) + 1 })
      .eq('id', optionId)

    if (voteError) throw voteError

    // Log the vote
    await supabase
      .from('vote_logs')
      .insert({
        ip: clientIP,
        fingerprint: clientFingerprint,
        option_id: optionId,
        voted_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Vote thành công!' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
