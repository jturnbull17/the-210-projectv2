# The 210 Project V4.7

Small, safe hotfix based on V4.7 navigation and media publishing baseline.

## Included
- Bottom nav `Map` and `AI` now work from blog/location pages as well as the homepage.
- Homepage handles hash navigation after React has rendered, so the target section is visible correctly.
- `Map` scrolls to the map panel at the top of the screen.
- `AI` scrolls with the companion/chat card centred on screen.
- Admin uploaded media now appears immediately after `Update location` / `Publish location` without needing a refresh and reselect.
- Uploaded media section auto-scrolls into view after uploading.
- Media rows keep `Copy token`, but the `Insert token` action has been removed.
- Publish/update releases the button state immediately after save instead of waiting on the refresh call.
- AI bottom navigation scrolls to the bottom of the homepage so the AI box is centred.

## Deploy
- Upload the Source ZIP contents to GitHub.
- Netlify build command: `npm run build`.
- Netlify publish directory: `dist`.

## Supabase
No new SQL is required if V4.6 SQL has already been run. The included schema is safe to run again if needed.


### V4.7.1 Notes
- No SQL changes required.
- Built from the restored V4.7 source baseline.
- Preserves country status, map phase, visited/completed styling, admin country controls and existing Supabase schema.
