// Supabase Edge Function: Admin Actions
// Deploy: supabase functions deploy admin-action

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminActionRequest {
  action: 'mark_completed' | 'mark_uncompleted' | 'delete_option';
  optionId: number;
  adminPassword: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get admin password from environment
    const ADMIN_PASSWORD_HASH = Deno.env.get('ADMIN_PASSWORD_HASH') || 'annopro1'

    // Parse request
    const { action, optionId, adminPassword }: AdminActionRequest = await req.json()

    // Validate admin password (in production, use proper hashing!)
    if (adminPassword !== ADMIN_PASSWORD_HASH) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Sai mật khẩu admin!' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Create Supabase client with SERVICE ROLE (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result

    switch (action) {
      case 'mark_completed':
        result = await supabase
          .from('vote_options')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', optionId)
        break

      case 'mark_uncompleted':
        result = await supabase
          .from('vote_options')
          .update({
            completed: false,
            completed_at: null
          })
          .eq('id', optionId)
        break

      case 'delete_option':
        result = await supabase
          .from('vote_options')
          .delete()
          .eq('id', optionId)
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
    }

    if (result.error) {
      throw result.error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Action completed successfully' }),
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
