# The 210 Project V4.7

Small hotfix based on the restored V4.7 baseline.

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


### V4.7.2 Notes
- No SQL changes required.
- Built from the restored V4.7 baseline.
- Preserves country status values, map phase controls, visited/completed styling and existing Supabase schema.
- Main publish-button fix: `finally{setBusy('')}` instead of leaving `busy` as `location`.
