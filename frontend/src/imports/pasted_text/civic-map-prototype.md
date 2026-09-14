Make the EXISTING CivicTrace "Public Civic Map" page fully interactive and functional in Preview.

IMPORTANT:
- DO NOT redesign the page.
- DO NOT change the existing visual design, typography, colors, spacing, illustrations, map style, or layout.
- Preserve the current CivicTrace editorial / archival visual aesthetic exactly.
- Only add the functionality and interactions described below.
- Use realistic mock civic complaint data for the prototype.
- No backend or blockchain connection is required yet.
- Everything must work in Figma Make Preview.

==================================================
1. INTERACTIVE CIVIC MAP
==================================================

Make the existing map interactive.

Display multiple civic issue markers on the map.

Use these status/priority meanings:

RED = Very Urgent / active
ORANGE = Urgent
BLUE = In Progress
GREEN = Resolved
YELLOW = Disputed / Reopened

Each marker must be clickable.

When a marker is clicked:
- highlight the selected marker
- open the existing complaint preview/card
- show the issue title
- complaint ID
- category
- priority
- current status
- Civic Impact Score
- supporting reports
- date reported
- approximate location

Example:

Complaint #CTY-48291-X
Large pothole near Central Road
Roads & Infrastructure
Very Urgent
Impact Score: 94
43 supporting reports
Unresolved

==================================================
2. COMPLAINT PREVIEW
==================================================

Make the complaint preview interactive.

Add a working:

"View Full Record →"

button.

When clicked, navigate to the existing
"Public Complaint Record" page/screen.

Pass the selected complaint's information into the page if possible.

Do NOT create a new visual design for this page.

==================================================
3. SEARCH
==================================================

Make the existing search field functional.

Users should be able to search by:

- Complaint ID
- Issue title
- Category
- Area/location

Example searches:

"CTY-48291-X"
"pothole"
"water"
"Central District"

As the user searches:
- filter visible complaint markers
- update the visible complaint list/results
- show "No complaints found" when nothing matches

Include a clear/reset search action.

==================================================
4. CATEGORY FILTER
==================================================

Make the existing category filter functional.

Use ONLY these six categories:

Roads & Infrastructure
Water & Drainage
Sanitation
Public Safety
Parks & Public Spaces
Environment

When a category is selected:
- show only matching complaints
- update map markers
- update complaint results

Allow:
"All Categories"

==================================================
5. STATUS FILTER
==================================================

Make the existing status filter functional.

Options:

All Statuses
Reported
Assessed
Assigned
In Progress
Proof Submitted
Resolved
Disputed / Reopened
Unresolved
Escalated

Selecting a status should immediately filter the map markers and results.

==================================================
6. PRIORITY FILTER
==================================================

Make the existing priority filter functional.

Options:

All Priorities
Normal
Urgent
Very Urgent

Selecting a priority filters the map accordingly.

==================================================
7. COMBINED FILTERS
==================================================

Filters must work together.

For example:

Category = Roads & Infrastructure
+
Priority = Very Urgent
+
Status = Unresolved

should show ONLY complaints matching all three conditions.

Add a working:
"Clear Filters"

action.

==================================================
8. MAP MARKER HOVER
==================================================

On marker hover:
- show a small tooltip
- issue title
- priority
- status
- Civic Impact Score

Keep the interaction subtle and consistent with the existing design.

==================================================
9. COMPLAINT RESULT CARDS
==================================================

If the page already contains complaint cards/list items, make them interactive.

Clicking a complaint card should:

1. Highlight the corresponding map marker.
2. Open its complaint preview.
3. Allow the user to open the full public record.

If there is no existing complaint list, create only the minimum functional result list required without changing the established layout.

==================================================
10. MAP LEGEND
==================================================

Make the existing legend interactive if possible.

Clicking a legend status should toggle that status on/off.

Example:

Click "Resolved"
→ hide/show green resolved markers.

Multiple legend statuses can be active simultaneously.

==================================================
11. RESET MAP
==================================================

Add a working reset behavior.

When filters/search are cleared:

- all complaint markers return
- all results return
- selected marker is cleared
- complaint preview closes
- map returns to its default state

==================================================
12. DEMO DATA
==================================================

Create a small realistic mock dataset containing approximately
12–20 complaints across different:

- categories
- priorities
- statuses
- locations
- Civic Impact Scores
- supporting report counts

Example IDs:

CTY-48291-X
CTY-38124-A
CTY-72910-K
CTY-19482-P
CTY-61503-R

The data should be structured so that search and filters actually work.

==================================================
13. NAVIGATION
==================================================

Ensure all existing navigation elements work.

Examples:

CivicTrace logo → Home
Dashboard → Citizen Dashboard where applicable
Complaint → Public Complaint Record
Verify → Blockchain Verification
Leaderboard → Department Leaderboard
Trust Score → Department Trust Score
Impact Dashboard → Civic Impact Dashboard

Do not create duplicate pages if these already exist.

==================================================
14. IMPORTANT PREVIEW REQUIREMENT
==================================================

This is a FUNCTIONAL PROTOTYPE request.

Do not only create visual buttons.

Every interactive element must have an actual interaction/state in Preview.

The following MUST visibly work:

✓ Marker click
✓ Marker hover
✓ Search
✓ Category filter
✓ Status filter
✓ Priority filter
✓ Combined filters
✓ Clear filters
✓ Complaint preview
✓ View Full Record
✓ Legend filtering
✓ Complaint card selection
✓ Navigation

Use local mock state/data where necessary.

Do not connect to Supabase or external APIs yet.

==================================================
FINAL REQUIREMENT
==================================================

After implementing the interactions, test the complete Civic Map flow in Preview:

Search → Filter → Select marker → Open complaint preview → View Full Record → Navigate back → Clear filters.

The existing visual design must remain unchanged.
Only functionality and interaction behavior should be added.