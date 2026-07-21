# The 210 Project V4.7

Homepage and archive UX release built on the stable V4.7.2 baseline.

## Included
- Bottom nav `Map` and `AI` now work from blog/location pages as well as the homepage.
- Homepage handles hash navigation after React has rendered, so the target section is visible correctly.
- `Map` scrolls to the map panel at the top of the screen.
- `AI` scrolls with the companion/chat card centred on screen.
- Admin uploaded media now appears immediately after `Update location` / `Publish location` without needing a refresh and reselect.
- Uploaded media section auto-scrolls into view after uploading.
- Media rows now have `Copy token` and `Insert token` actions.
- `Insert token` appends `[[media:...]]` into the blog editor so you can embed media faster from a phone.

## Deploy
- Upload the Source ZIP contents to GitHub.
- Netlify build command: `npm run build`.
- Netlify publish directory: `dist`.

## Supabase
No new SQL is required if V4.6 SQL has already been run. The included schema is safe to run again if needed.


### V5.0 Added
- Latest Story card on the homepage.
- Archive timeline on the homepage.
- More prominent visual status system for Live, Completed and Coming Soon countries.
- Expandable country timeline cards showing location/story links.
- Keeps V4.7.2 hotfixes: Insert Token removed, AI nav scroll improved, and publish button busy state fixed.
- No SQL changes required.


### V5.2 AI Companion added
- Adds a Supabase Edge Function at `supabase/functions/ask-companion/index.ts`.
- Uses OpenAI `gpt-4o-mini`.
- Pulls published countries, locations, blogs, site settings and recent comments from Supabase.
- The homepage AI Companion now calls the real function instead of using a mock answer.
- No database SQL changes are required.

### Setup
1. Add your OpenAI key to Supabase secrets:
   `supabase secrets set OPENAI_API_KEY=your_openai_key`
2. Deploy the Edge Function:
   `supabase functions deploy ask-companion --no-verify-jwt`
3. Deploy the website as usual through GitHub/Netlify.
