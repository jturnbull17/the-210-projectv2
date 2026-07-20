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


### V5.1 patch added
- Fixed mobile Map/AI navigation so URL hashes do not persist.
- Updated bio copy.
- Removed Archive Timeline rendering while keeping Latest Story.
- Added editable Country chapter summary in Admin.
- De-duplicated Admin media rows by media ID.
- Ordered Admin existing locations by country travel order.
- Preserved Admin footer and original map styling.
