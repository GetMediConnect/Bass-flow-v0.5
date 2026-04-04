import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export const BUCKET_AUDIO  = process.env.SUPABASE_BUCKET_AUDIO  ?? 'audio';
export const BUCKET_COVERS = process.env.SUPABASE_BUCKET_COVERS ?? 'covers';
