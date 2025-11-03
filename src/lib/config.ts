const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const API_CONFIG = {
  conversations: `${SUPABASE_URL}/functions/v1/conversations`,
  reports: `${SUPABASE_URL}/functions/v1/reports`,
  personality: `${SUPABASE_URL}/functions/v1/personality`,
  settings: `${SUPABASE_URL}/functions/v1/settings`,
};

export const getHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
});

export const getFormHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
});
