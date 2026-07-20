import { hasSupabase, supabase } from './supabase';
import { fallbackCountries, fallbackLocations, fallbackMedia, fallbackComments, fallbackSettings } from './fallback';

export async function loadPublicData(){
  if(!hasSupabase) return {countries:fallbackCountries,locations:fallbackLocations,media:fallbackMedia,comments:fallbackComments,settings:fallbackSettings,usingFallback:true};
  const [cr,lr,mr,comr,sr]=await Promise.all([
    supabase.from('countries').select('*').eq('is_published',true).order('route_order'),
    supabase.from('locations').select('*').eq('is_published',true).order('sort_order'),
    supabase.from('media').select('*').order('sort_order'),
    supabase.from('comments').select('*').order('created_at'),
    supabase.from('site_settings').select('*').eq('id','main').limit(1)
  ]);
  if(cr.error||lr.error||mr.error||comr.error||sr.error) return {countries:fallbackCountries,locations:fallbackLocations,media:fallbackMedia,comments:fallbackComments,settings:fallbackSettings,usingFallback:true,error:cr.error||lr.error||mr.error||comr.error||sr.error};
  return {countries:cr.data?.length?cr.data:fallbackCountries,locations:lr.data||[],media:mr.data||[],comments:comr.data||[],settings:sr.data?.[0]||fallbackSettings,usingFallback:false};
}
export async function updateCountry(country){const {id,...updates}=country;return supabase.from('countries').update({...updates,updated_at:new Date().toISOString()}).eq('id',id).select().single()}
export async function addLocation(location){return supabase.from('locations').insert(location).select().single()}
export async function updateLocation(location){return supabase.from('locations').upsert(location).select().single()}
export async function deleteLocation(id){return supabase.from('locations').delete().eq('id',id)}
export async function updateSettings(settings){return supabase.from('site_settings').upsert({id:'main',...settings,updated_at:new Date().toISOString()}).select().single()}
export async function addMedia(media){return supabase.from('media').insert(media).select().single()}
export async function updateMedia(media){const {id,...updates}=media;return supabase.from('media').update(updates).eq('id',id).select().single()}
export async function deleteMedia(id){return supabase.from('media').delete().eq('id',id)}
export async function addComment(comment){return supabase.from('comments').insert(comment).select().single()}
