import { supabase } from './supabase';

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getClient() {
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabase.from('clients').select('*').eq('id', user.id).single();
  return data;
}

export async function getClientAudits() {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase.from('audits').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
  return data || [];
}

export async function getClientPosts() {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase.from('gmb_posts').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
  return data || [];
}

export async function getClientPositions() {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase.from('keyword_positions').select('*').eq('client_id', user.id).order('checked_at', { ascending: false });
  return data || [];
}

export async function signOut() {
  await supabase.auth.signOut();
}
