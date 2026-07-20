# The 210 Project V5.0 Usability Update

Built from the V4.7 baseline with the requested V5 changes:

- Map and AI phone navigation no longer leaves `#journey-map` or `#companion` in the URL.
- Mobile nav uses a click handler and clears the URL after scrolling.
- Homepage bio updated to: `Jack and Grace's live travel journal, where we will document our experiences in South America and Asia over 210 days!`
- Country chapter summary section is now content-height responsive.
- Country chapter summary can now be edited in Admin via the country summary textarea.
- Archive Timeline removed.
- Latest Story retained.
- Duplicate admin media preview fixed with media de-duplication by ID.
- Existing locations in Admin are ordered by country route order, then location order/name.

## SQL
No new SQL should be required if your V4.6/V4.7 Supabase setup is already working, because this uses the existing `countries.summary`, `locations`, and `media` tables. The included SQL file is a safe reference only.
