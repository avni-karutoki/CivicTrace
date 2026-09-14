Create the Authority Complaint Detail page for the existing CivicTrace application.

IMPORTANT:
- Reuse the existing CivicTrace components and design system.
- Do NOT redesign existing pages.
- Do NOT create separate pages for Assign, Update Status, Resolution Proof, or Resolve/Reopen. These must be interactive modals/states within THIS page.
- Keep the existing warm ivory/parchment background, dark espresso typography, editorial serif headings, thin borders, muted earthy status colors, and archival civic-document aesthetic.
- Keep this page visually clean and information-dense.
- Make all important interactions functional in Preview using demo data.

PAGE TITLE:
"Complaint Detail"

Example case:
CTY-48291-X
Fallen Tree Blocking Road

CATEGORY:
Public Safety

PRIORITY:
VERY URGENT

STATUS:
UNRESOLVED

CIVIC IMPACT:
87 / 100

--------------------------------------------------
1. HEADER
--------------------------------------------------

Use the existing Authority Portal navigation.

Add breadcrumb:

Complaints / CTY-48291-X

Add a back button:
"← Complaint Queue"

--------------------------------------------------
2. CASE SUMMARY
--------------------------------------------------

Create a prominent case header showing:

CTY-48291-X
Fallen Tree Blocking Road

Public Safety
Very Urgent
Unresolved

Reported:
Today · 8:42 AM

Location:
Saket, New Delhi

Supporting Reports:
17 citizens

Civic Impact:
87 / 100

IMPORTANT PRIVACY RULE:
Do NOT display the citizen's name, phone number, email, or any identifying information.

Add a small label:
"CITIZEN IDENTITY PROTECTED"

--------------------------------------------------
3. EVIDENCE
--------------------------------------------------

Create an evidence section.

Show:
- Original complaint photo
- Location
- Capture timestamp
- Evidence verification indicator

Text:
"Evidence hash recorded"

Show a shortened example hash:
0x7A91...C42E

Add:
"View verification"

This opens/navigates to the existing Blockchain Verification page.

--------------------------------------------------
4. COMPLAINT TIMELINE
--------------------------------------------------

Create a vertical editorial timeline:

REPORTED
Today · 8:42 AM

ASSESSED
Today · 9:05 AM

ASSIGNED
Today · 9:18 AM

IN PROGRESS
Today · 10:02 AM

UNRESOLVED
Today · 12:42 PM

ESCALATED
Pending / if response window is exceeded

Each event should have a clear status indicator.

--------------------------------------------------
5. AUTHORITY ACTIONS
--------------------------------------------------

Create a clearly visible action area:

PRIMARY:
"Assign Complaint"

SECONDARY:
"Update Status"

TERTIARY:
"Upload Resolution Proof"

These buttons open MODALS, not new pages.

--------------------------------------------------
6. ASSIGN COMPLAINT MODAL
--------------------------------------------------

Clicking "Assign Complaint" opens a modal.

Fields:

Department / Team
Roads & Infrastructure

Officer / Team
Select officer

Priority
Very Urgent

Add internal note

Buttons:
"Assign Complaint"
"Cancel"

After clicking Assign Complaint:
- close modal
- update timeline to ASSIGNED
- show a small success confirmation

--------------------------------------------------
7. UPDATE STATUS MODAL
--------------------------------------------------

Clicking "Update Status" opens a modal.

Allow:

Assessed
Assigned
In Progress
Awaiting Proof
Unresolved

Add:
"Update note"

Buttons:
"Update Status"
"Cancel"

After submission:
- close modal
- update visible status
- add new timeline event
- show success confirmation

Do not allow authority to directly select "Resolved".

--------------------------------------------------
8. RESOLUTION PROOF MODAL
--------------------------------------------------

Clicking "Upload Resolution Proof" opens a larger modal.

Title:
"Resolution Evidence"

Text:
"A complaint can only move toward resolution when the fix is supported by evidence."

Include:
- Upload / drag-and-drop evidence area
- Evidence preview placeholder
- Resolution note
- Date/time

Button:
"Submit Proof"

After submission:
- status becomes "AWAITING VERIFICATION"
- add "PROOF SUBMITTED" to timeline
- show evidence verification indicator

Do NOT automatically mark the complaint Resolved.

--------------------------------------------------
9. CITIZEN VERIFICATION
--------------------------------------------------

When proof has been submitted, show a prominent section:

"Awaiting Citizen Verification"

Text:
"The submitted resolution evidence must be verified before this case is permanently resolved."

Show two actions:

"Citizen confirms fixed"
"No, issue remains"

For prototype purposes these buttons simulate the citizen response.

If "Citizen confirms fixed":
→ status becomes RESOLVED
→ timeline adds VERIFIED / RESOLVED
→ show success state

If "No, issue remains":
→ status becomes DISPUTED / REOPENED
→ show warning state
→ add REOPENED to timeline
→ show "Authority action required"

--------------------------------------------------
10. ESCALATION STATE
--------------------------------------------------

If the complaint remains inactive beyond its response window, show:

"ESCALATION TRIGGERED"

Text:
"This complaint exceeded its expected response window and has been escalated to the next authority level."

Add:
"View Escalation"

This should navigate to the existing Escalations / Alerts page.

--------------------------------------------------
11. BLOCKCHAIN VERIFICATION
--------------------------------------------------

At the bottom, add a compact verification card:

"VERIFIABLE CIVIC RECORD"

Show:

Complaint Created ✓
Assignment Recorded ✓
Status Changes ✓
Evidence Hash ✓
Resolution ✓ / Pending

Last recorded event:
Today · 12:42 PM

Transaction:
0x7A91...C42E

Button:
"View Full Verification"

Navigate to Blockchain Verification.

--------------------------------------------------
12. FUNCTIONAL PREVIEW
--------------------------------------------------

Make these interactions functional:

Back → Complaint Queue
Assign Complaint → working modal
Update Status → working modal
Upload Resolution Proof → working modal
Submit Proof → changes case state
Citizen confirms fixed → Resolved state
Issue remains → Reopened/Disputed state
View Verification → Blockchain Verification
View Escalation → Escalations page

Use local/demo state only.
Do NOT implement real backend, authentication, blockchain, or file upload.

--------------------------------------------------
13. RESPONSIVE
--------------------------------------------------

Desktop:
- Two-column case layout
- Main evidence/timeline area
- Right-side case summary/actions

Mobile:
- Single column
- Case summary first
- Evidence
- Timeline
- Actions
- Verification

All modals must work cleanly on mobile.

No horizontal scrolling.

--------------------------------------------------
14. FINAL INTENT
--------------------------------------------------

This page is the heart of the Authority workflow.

It should communicate:

SEE THE ISSUE
→ ASSESS IT
→ ASSIGN IT
→ ACT
→ SUBMIT PROOF
→ CITIZEN VERIFIES
→ RESOLVE OR REOPEN

The authority must NEVER be able to simply click "Resolved" without resolution evidence and citizen verification.

Make it polished, responsive, trustworthy, and consistent with the existing CivicTrace design.