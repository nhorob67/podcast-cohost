import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const path = url.pathname.replace('/conversations', '');
    const method = req.method;

    if (method === 'GET' && path === '') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const includeArchived = url.searchParams.get('include_archived') === 'true';

      let query = supabaseClient
        .from('conversations')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ conversations: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'GET' && path.startsWith('/')) {
      const conversationId = path.substring(1);

      const { data: conversation, error: convError } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('thread_id', conversationId)
        .single();

      if (convError) throw convError;

      const { data: messages, error: msgError } = await supabaseClient
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      return new Response(
        JSON.stringify({ conversation, messages }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'POST' && path.includes('/archive')) {
      const conversationId = path.split('/')[1];

      const { data, error } = await supabaseClient
        .from('conversations')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('thread_id', conversationId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, conversation: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'DELETE' && path.startsWith('/')) {
      const conversationId = path.substring(1);

      const { error } = await supabaseClient
        .from('conversations')
        .delete()
        .eq('thread_id', conversationId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'PUT' && path.includes('/title')) {
      const conversationId = path.split('/')[1];
      const body = await req.json();
      const title = body.title;

      const { data, error } = await supabaseClient
        .from('conversations')
        .update({ title })
        .eq('thread_id', conversationId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, conversation: data }),
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