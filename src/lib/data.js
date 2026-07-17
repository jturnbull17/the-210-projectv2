import{hasSupabase,supabase}from'./supabase';import{fallbackCountries,fallbackLocations,fallbackMedia,fallbackComments,fallbackSettings}from'./fallback';
export async function loadPublicData(){if(!hasSupabase)return{countries:fallbackCountries,locations:fallbackLocations,media:fallbackMedia,comments:fallbackComments,settings:fallbackSettings,usingFallback:true};const[cr,lr,mr,comr,sr]=await Promise.all([supabase.from('countries').select('*').eq('is_published',true).order('route_order'),supabase.from('locations').select('*').eq('is_published',true).order('sort_order'),supabase.from('media').select('*').order('sort_order'),supabase.from('comments').select('*').order('created_at'),supabase.from('site_settings').select('*').eq('id','main').limit(1)]);return{countries:cr.data?.length?cr.data:fallbackCountries,locations:lr.data||[],media:mr.data||[],comments:comr.data||[],settings:sr.data?.[0]||fallbackSettings,usingFallback:false}}
export async function updateCountry(x){const{id,...u}=x;return supabase.from('countries').update({...u,updated_at:new Date().toISOString()}).eq('id',id).select().single()}
export async function addLocation(x){return supabase.from('locations').insert(x).select().single()}
export async function updateLocation(x){return supabase.from('locations').upsert(x).select().single()}
export async function deleteLocation(id){return supabase.from('locations').delete().eq('id',id)}
export async function updateSettings(x){return supabase.from('site_settings').upsert({id:'main',...x,updated_at:new Date().toISOString()}).select().single()}
export async function addMedia(x){return supabase.from('media').insert(x).select().single()}
export async function updateMedia(x){const{id,...u}=x;return supabase.from('media').update(u).eq('id',id).select().single()}
export async function deleteMedia(id){return supabase.from('media').delete().eq('id',id)}
export async function addComment(x){return supabase.from('comments').insert(x).select().single()}
