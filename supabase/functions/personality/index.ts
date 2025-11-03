import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    const path = url.pathname.replace('/personality', '');
    const method = req.method;

    if (method === 'GET' && path === '') {
      const { data: active, error: activeError } = await supabaseClient
        .from('personalities')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (activeError) throw activeError;

      const { data: all, error: allError } = await supabaseClient
        .from('personalities')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      return new Response(
        JSON.stringify({ active, all }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'POST' && path === '') {
      const body = await req.json();
      const { name, instructions, speaking_style, knowledge_domains, is_active } = body;

      if (!name || !instructions) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      if (is_active) {
        await supabaseClient
          .from('personalities')
          .update({ is_active: false })
          .eq('is_active', true);
      }

      const { data, error } = await supabaseClient
        .from('personalities')
        .insert({
          name,
          instructions,
          speaking_style: speaking_style || null,
          knowledge_domains: knowledge_domains || null,
          is_active: is_active || false,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, personality: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'PUT' && path.startsWith('/')) {
      const parts = path.substring(1).split('/');
      const personalityId = parts[0];
      const action = parts[1];

      if (action === 'activate') {
        await supabaseClient
          .from('personalities')
          .update({ is_active: false })
          .eq('is_active', true);

        const { data, error } = await supabaseClient
          .from('personalities')
          .update({ is_active: true })
          .eq('id', personalityId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, personality: data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        const body = await req.json();

        const { data, error } = await supabaseClient
          .from('personalities')
          .update(body)
          .eq('id', personalityId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, personality: data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
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