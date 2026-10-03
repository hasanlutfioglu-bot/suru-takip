import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {createClient} from 'jsr:@supabase/supabase-js@2.117.2';
import {createHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
Deno.serve(createHandler({url,key:Deno.env.get('SUPABASE_ANON_KEY')!,resource:url+'/functions/v1/flock-mcp',clientIds:(Deno.env.get('FLOCK_MCP_CLIENT_IDS')||'').split(',').map(s=>s.trim()).filter(Boolean),createClient}));
