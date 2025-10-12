// supabase/functions/test-webhook/index.ts
// ULTRA MINIMAL - Just responds immediately

Deno.serve(async (req) => {
    console.log('🔥 REQUEST RECEIVED')
    
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      })
    }
  
    try {
      const body = await req.json()
      console.log('📦 Body:', body)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          received: body,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    } catch (error) {
      console.error('Error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  })