import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function compactText(value: unknown, max = 1200) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question } = await req.json()
    const cleanQuestion = compactText(question, 500)
    if (!cleanQuestion) {
      return new Response(JSON.stringify({ answer: 'Ask me a question about the journey first.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase function environment variables')
    if (!openAiKey) throw new Error('Missing OPENAI_API_KEY secret')

    const supabase = createClient(supabaseUrl, supabaseKey)
    const [countriesRes, locationsRes, settingsRes, commentsRes] = await Promise.all([
      supabase.from('countries').select('id,name,phase,route_order,dates,summary,current_location,status').eq('is_published', true).order('route_order'),
      supabase.from('locations').select('id,country_id,slug,name,date_text,summary,blog,sort_order,created_at,updated_at').eq('is_published', true).order('sort_order'),
      supabase.from('site_settings').select('*').eq('id', 'main').limit(1),
      supabase.from('comments').select('location_id,name,comment,created_at').order('created_at', { ascending: false }).limit(40),
    ])

    if (countriesRes.error) throw countriesRes.error
    if (locationsRes.error) throw locationsRes.error
    if (settingsRes.error) throw settingsRes.error
    if (commentsRes.error) throw commentsRes.error

    const countries = countriesRes.data ?? []
    const locations = locationsRes.data ?? []
    const settings = settingsRes.data?.[0] ?? {}
    const comments = commentsRes.data ?? []

    const countryMap = new Map(countries.map((country: any) => [country.id, country]))
    const currentCountry = countryMap.get(settings.current_country_id)
    const currentLocation = locations.find((location: any) => location.country_id === settings.current_country_id && location.slug === settings.current_location_slug)

    const countryContext = countries.map((country: any) => {
      const countryLocations = locations.filter((location: any) => location.country_id === country.id)
      return [
        `Country: ${country.name}`,
        `Phase: ${country.phase}`,
        `Status: ${country.status}`,
        `Dates: ${country.dates ?? ''}`,
        `Current location label: ${country.current_location ?? ''}`,
        `Country summary: ${compactText(country.summary, 900)}`,
        `Published locations: ${countryLocations.map((location: any) => `${location.name} (${location.date_text ?? 'no date'}): ${compactText(location.summary, 350)} Blog: ${compactText(location.blog, 850)}`).join(' | ')}`,
      ].join('\n')
    }).join('\n\n')

    const commentsContext = comments.map((comment: any) => {
      const location = locations.find((item: any) => item.id === comment.location_id)
      return `${location?.name ?? 'Unknown location'} comment from ${comment.name}: ${compactText(comment.comment, 220)}`
    }).join('\n')

    const systemPrompt = `You are The 210 Companion, the AI guide for Jack and Grace's public travel journal.
Answer using only the published content provided in the context.
If the answer is not in the published content, say: "That story hasn't been published yet."
Do not invent experiences, locations, opinions, dates, or facts.
Use a warm, concise travel-journal tone.
If useful, mention the relevant country or location name.
Avoid saying "based on the context".`

    const userPrompt = `Current country: ${currentCountry?.name ?? 'Not set'}
Current location: ${currentLocation?.name ?? settings.current_location_slug ?? 'Not set'}

Published journey context:
${countryContext || 'No published journey content yet.'}

Recent public comments:
${commentsContext || 'No comments yet.'}

Visitor question: ${cleanQuestion}`

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    const openAiJson = await openAiResponse.json()
    if (!openAiResponse.ok) {
      throw new Error(openAiJson?.error?.message ?? 'OpenAI request failed')
    }

    const answer = openAiJson?.choices?.[0]?.message?.content?.trim() ?? 'That story has not been published yet.'
    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ answer: 'The AI companion is not available yet.', error: String(error?.message ?? error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
