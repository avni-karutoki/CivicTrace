Create a standalone Authority Dashboard page for my existing CivicTrace web application.

IMPORTANT:
- This page is part of the EXISTING CivicTrace design system.
- Do NOT redesign CivicTrace or introduce a generic SaaS/admin-template aesthetic.
- Preserve the exact visual language already established: warm ivory/parchment background, dark espresso typography, muted earthy accents, editorial serif headings, clean sans-serif UI text, thin borders, framed cards, subtle paper/archival texture, and civic-document aesthetic.
- The Authority Dashboard should feel like a serious civic control room presented through an editorial interface.
- Web3 must remain subtle: verification, immutable records, timestamps, hashes and accountability — NOT crypto/DeFi/neon visuals.

PAGE PURPOSE:
This is the main control centre for authorized civic departments.
Authorities should immediately understand:
1. What needs attention
2. Which complaints are urgent
3. Which complaints are unresolved
4. Which cases are escalated
5. Which cases are waiting for resolution proof

--------------------------------------------------
1. AUTHORITY NAVIGATION
--------------------------------------------------

Create a dedicated authority navigation/header.

Left:
- CivicTrace logo
- Small label: "AUTHORITY PORTAL"

Navigation:
- Dashboard
- Complaints
- Escalations
- Analytics

Right:
- Search icon
- Notifications icon
- Authority profile/avatar
- Department name
- Small dropdown arrow

Profile dropdown should contain:
- Profile
- Settings
- Sign Out

Navigation interactions must work in Preview.

Dashboard → current page
Complaints → Authority Complaint Queue
Escalations → Escalations / Alerts page
Analytics → Civic Impact / authority analytics page
Notifications → notification panel/dropdown
Profile → profile/settings state
Sign Out → return to Authority Login

--------------------------------------------------
2. PAGE HEADER
--------------------------------------------------

Large editorial heading:

"Good governance leaves a trace."

Supporting text:

"Monitor civic issues, act on priority cases, and keep every resolution accountable."

On the right side include:
- Current date
- Department name
- Small "VERIFIED AUTHORITY" indicator

Below the heading add a thin divider.

--------------------------------------------------
3. OVERVIEW STATISTICS
--------------------------------------------------

Create a horizontal grid of key metric cards.

Cards:

PENDING
"24"

IN PROGRESS
"18"

VERY URGENT
"7"

UNRESOLVED
"5"

AWAITING PROOF
"9"

RESOLVED
"142"

Each card should include:
- Large number
- Small label
- Tiny contextual indicator
- Minimal icon if appropriate

Example contextual indicators:
"↑ 3 from yesterday"
"4 due today"
"2 approaching escalation"

Use muted status accents rather than bright colors.

Very Urgent should be visually noticeable but still consistent with CivicTrace's muted palette.

--------------------------------------------------
4. PRIORITY QUEUE
--------------------------------------------------

Create a large main section titled:

"Priority Queue"

Supporting text:

"Cases requiring attention first."

Display a structured complaint list/table.

Columns:

COMPLAINT
CATEGORY
PRIORITY
STATUS
AGE
IMPACT
ACTION

Example rows:

CTY-48291-X
Fallen Tree
Public Safety
VERY URGENT
Unresolved
2h
87
"Review"

CTY-39182-A
Water Leakage
Water & Drainage
URGENT
In Progress
1d
74
"Open"

CTY-77420-K
Overflowing Bin
Sanitation
NORMAL
Pending
3d
61
"Review"

CTY-21487-P
Broken Streetlight
Public Safety
URGENT
Awaiting Proof
5h
79
"Open"

Use realistic sample civic complaints.

Each row should be clickable.

Clicking a row or "Open/Review" should navigate to the corresponding Authority Complaint Detail page.

--------------------------------------------------
5. PRIORITY VISUAL SYSTEM
--------------------------------------------------

Use consistent status indicators:

VERY URGENT
- strongest warning treatment

URGENT
- medium warning treatment

NORMAL
- neutral treatment

Do not use excessive saturated colors.

Status indicators:

Pending
Assessed
Assigned
In Progress
Awaiting Proof
Unresolved
Escalated
Disputed
Resolved

Keep the same status language used throughout CivicTrace.

--------------------------------------------------
6. ESCALATION ALERT PANEL
--------------------------------------------------

Create a prominent but elegant panel titled:

"Needs Attention"

Show 3–4 alerts.

Examples:

"CTY-48291-X has exceeded its expected response window."
→ "Escalation required"

"CTY-21487-P is awaiting resolution evidence."
→ "Proof due"

"CTY-59301-R was reopened by a citizen."
→ "Review dispute"

Each alert should have:
- Complaint ID
- Short description
- Status
- Time indicator
- Action button

Action buttons:
"Review"
"Upload Proof"
"Open Case"

Clicking them should navigate to the relevant complaint detail/state.

--------------------------------------------------
7. DEPARTMENT PERFORMANCE SNAPSHOT
--------------------------------------------------

Create a smaller editorial analytics section.

Heading:

"Accountability Snapshot"

Show:

Resolution Rate
"91%"

Average Resolution Time
"18.4 hrs"

Reopened Cases
"6%"

Evidence Compliance
"96%"

Add a small line/chart-like visual showing resolution activity over the recent period.

Keep it visually simple and editorial.

Add a text insight:

"Resolution quality remains strong, but response time is rising for infrastructure complaints."

--------------------------------------------------
8. RECENT ACTIVITY
--------------------------------------------------

Create a timeline/list titled:

"Recent Activity"

Examples:

10:42 AM
"Resolution evidence submitted"
CTY-38192-B

09:58 AM
"Complaint assigned to Roads & Infrastructure"
CTY-48291-X

09:21 AM
"Citizen reopened complaint"
CTY-59301-R

Yesterday
"Complaint escalated automatically"
CTY-77420-K

Each item should visually communicate:
TIME → ACTION → COMPLAINT ID

--------------------------------------------------
9. BLOCKCHAIN / VERIFICATION SUMMARY
--------------------------------------------------

Include a subtle small card titled:

"Verification Layer"

Text:

"All major case events are recorded as verifiable civic events."

Show:

Last recorded event
"CTY-48291-X · Status Updated"

Timestamp
"Today · 10:42 AM"

Proof status
"Verified"

Do NOT display complicated blockchain jargon.

Optionally show a shortened hash:

"0x7A91...C42E"

Include a small button:

"View Verification"

This should navigate to the Blockchain Verification page.

--------------------------------------------------
10. QUICK ACTIONS
--------------------------------------------------

Add a compact "Quick Actions" section.

Buttons:

"View Complaints"
"Review Escalations"
"Upload Resolution Proof"
"View Civic Impact"

Each button must navigate to its respective existing page.

--------------------------------------------------
11. FUNCTIONAL PREVIEW INTERACTIONS
--------------------------------------------------

Make the dashboard genuinely interactive in Figma Make Preview.

Functional interactions:

- Navigation links work.
- Complaint rows open complaint detail.
- Review/Open buttons work.
- Notification icon opens a notification panel.
- Profile icon opens profile dropdown.
- Search opens a search state/input.
- Filter controls work visually.
- Status/priority tabs can change the visible complaint list.
- Quick action buttons navigate correctly.
- View Verification opens Blockchain Verification.
- Escalation alerts open the relevant complaint.
- Sign Out returns to Authority Login.

Use realistic prototype/demo data.

Do NOT implement real authentication, database, blockchain or API functionality here.

--------------------------------------------------
12. RESPONSIVE DESIGN
--------------------------------------------------

Desktop:
- Full editorial dashboard
- Spacious but information-dense
- Priority Queue as the main visual focus

Tablet:
- Statistics cards wrap into 2 rows
- Queue remains readable
- Secondary panels stack

Mobile:
- Single-column layout
- Compact authority header
- Stats become scrollable or stacked cards
- Complaint table transforms into complaint cards
- Priority and status remain clearly visible
- Alerts become full-width cards
- No horizontal scrolling

--------------------------------------------------
13. MICRO-INTERACTIONS
--------------------------------------------------

Add subtle:
- Card hover transitions
- Button hover states
- Row hover states
- Smooth dropdown animation
- Notification panel animation
- Search expansion
- Gentle page entrance animation
- Status indicator transitions

Keep animations elegant and restrained.

--------------------------------------------------
14. FINAL DESIGN INTENT
--------------------------------------------------

The dashboard should feel like:

"A civic command centre where every unresolved issue is visible and every authority action can be traced."

The visual hierarchy should make it immediately obvious:
URGENT → WHAT NEEDS ACTION → WHAT IS ESCALATING → WHAT IS WAITING FOR PROOF → WHAT HAS BEEN RESOLVED

Make it polished, production-quality, responsive, and fully consistent with the existing CivicTrace pages.

Do not modify the design of existing citizen/public pages.