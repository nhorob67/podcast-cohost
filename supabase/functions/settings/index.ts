import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/settings', '');
    const method = req.method;

    if (method === 'GET' && path === '') {
      const { data: settings, error } = await supabaseClient
        .from('system_settings')
        .select('*')
        .limit(10);

      if (error) throw error;

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      const { count: referenceCount } = await supabaseClient
        .from('conversation_references')
        .select('*', { count: 'exact', head: true });

      return new Response(
        JSON.stringify({
          reference_frequency: settingsMap.reference_frequency || 'medium',
          max_context_conversations: settingsMap.max_context_conversations || 5,
          reference_stats: {
            total_references: referenceCount || 0,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'PUT' && path === '/reference-frequency') {
      const body = await req.json();
      const { level, weight } = body;

      const { data, error } = await supabaseClient
        .from('system_settings')
        .upsert({
          key: 'reference_frequency',
          value: level,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, settings: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'PUT' && path === '/max-context') {
      const body = await req.json();
      const { count } = body;

      const { data, error } = await supabaseClient
        .from('system_settings')
        .upsert({
          key: 'max_context_conversations',
          value: count,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, settings: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});