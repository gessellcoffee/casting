import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Hello from create-user-profile!')

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('Webhook payload:', payload)

    const { record } = payload
    
    if (!record) {
      return new Response('No record found in payload', { status: 400 })
    }

    const { id, email, raw_user_meta_data } = record
    
    const firstName = raw_user_meta_data?.first_name || ''
    const lastName = raw_user_meta_data?.last_name || ''
    const avatarUrl = raw_user_meta_data?.avatar_url || raw_user_meta_data?.picture || null

    console.log(`Creating profile for user ${id} (${email})`)

    const { error } = await supabaseClient
      .from('profiles')
      .upsert({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        profile_photo_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating profile:', error)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ message: 'Profile created successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
