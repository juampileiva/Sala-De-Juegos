import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eizjsrprnvbbhzbyadou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XrXmnE4y6iSoXG-E24URag_zleqWJmr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);