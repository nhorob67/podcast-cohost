import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    const path = url.pathname.replace('/reports', '');
    const method = req.method;

    if (method === 'GET' && path === '') {
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const { data, error } = await supabaseClient
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({ reports: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'GET' && path.startsWith('/')) {
      const reportId = path.substring(1);

      const { data: report, error: reportError } = await supabaseClient
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      const { data: files, error: filesError } = await supabaseClient
        .from('report_files')
        .select('*')
        .eq('report_id', reportId);

      if (filesError) throw filesError;

      return new Response(
        JSON.stringify({ report, files }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'DELETE' && path.startsWith('/')) {
      const reportId = path.substring(1);

      const { error } = await supabaseClient
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'POST' && path === '/upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string || null;
      const tags = formData.get('tags') as string || null;

      if (!file || !title) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      const fileBytes = await file.arrayBuffer();
      const fileSize = fileBytes.byteLength;
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

      const tagsList = tags ? tags.split(',').map(t => t.trim()) : [];

      const { data: report, error: reportError } = await supabaseClient
        .from('reports')
        .insert({
          title,
          file_type: fileType,
          file_size_bytes: fileSize,
          description,
          tags: tagsList,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (reportError) throw reportError;

      const filePath = `reports/${report.id}/${file.name}`;
      const { error: storageError } = await supabaseClient.storage
        .from('report-files')
        .upload(filePath, fileBytes, {
          contentType: file.type,
          upsert: false,
        });

      if (storageError) {
        await supabaseClient.from('reports').delete().eq('id', report.id);
        throw storageError;
      }

      await supabaseClient
        .from('reports')
        .update({ processing_status: 'completed' })
        .eq('id', report.id);

      return new Response(
        JSON.stringify({ success: true, report }),
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