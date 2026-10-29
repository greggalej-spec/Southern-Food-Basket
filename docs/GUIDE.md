# Southern Food Basket concept: how to use the site

An unofficial concept by Trinovata for a real south-Trinidad grocer: a public website, members' offers with codes, a
weekly e-mail, a careers and hiring portal, a staff portal, and an office console. **Nothing you type leaves your
browser.** Changes are saved in that browser only, so another device or browser starts fresh, and no e-mail is ever
sent: every message the site "sends" lands in the demo outbox at `/outbox`.

Real: the logo, product photos and special prices (the company's public Instagram), and store addresses, hours and phone
numbers (each store's Google Maps listing). Demo: every person, job, application, payslip, code, subscriber and e-mail.

## Open it

| Where | Link | Notes |
|---|---|---|
| Latest preview (Next.js rebuild, 29 Oct 2026, commit `b2cc915`) | https://southern-food-basket-next-ccic4vsin-greggs-projects-fbe529a0.vercel.app | Opens only after you sign in to Vercel. |
| Your machine | In the `next-rebuild` worktree run `npm run dev -- --port 4176`, then open http://localhost:4176 | Same site; fastest for showing it. |
| Public link | https://southern-food-basket.vercel.app | The older static version you deploy yourself. It has none of the 29 Oct work. |

**Sharing:** the public link may go to the business. Keep the site off trinovata.com/work and social media until they
agree: it uses their photos and logo without permission.

## Start with the tour

Open **`/tour`** (also linked from the concept banner and the home footer). It has eight chapters. Each one signs in as
the person who would do that job, opens the real page, rings the control to look at, and says what to try. You click
the real buttons yourself; the tour only moves between pages and people.

| Chapter | Who you play | What it shows |
|---|---|---|
| The shop | Any shopper | Specials, the weekly e-mail sign-up, members' offers |
| A code, from phone to till | Marisa, a shopper; Keisha on the San Fernando till | Taking a code, checking it at the till, refusals with reasons |
| An offer, drafted and approved | Tricia, marketing; Vishala, the owner's office | Nobody approves their own offer |
| The weekly e-mail | Tricia; Vishala | A newsletter built from the specials, sent only to confirmed subscribers |
| Staff updates, the internal newsletter | Vishala; Marsha, store admin for Princes Town | Read receipts, and a sender limited to her own store |
| Hiring, with care | Aaliyah, Kwame and Shanice, applicants; Devon, HR | Plain stages, and decisions that arrive as a sealed update |
| An employee's week | Keisha, Checkout Supervisor | Shift, staff updates, rota, payslips |
| Who can see what | Vishala | Access by person, store and end date; the audit log |

Leave **"Reset the demo first"** ticked when you start a chapter, so the data is as the chapter expects. **Hide**
tucks the card into a small "Show the tour" button; **Escape** does the same. **End tour** stops it.

## A ten-minute demo by hand

1. **Home `/`.** Scroll the Grand Entrance: the store front, this week's specials, departments, the five stores and
   careers. Each band links to its page.
2. **Weekly e-mail.** On `/specials`, sign up at the bottom with any address and tick the box. Open `/outbox`: the
   confirmation e-mail is there, and its button confirms the address. Every newsletter after that carries a link to
   change or stop it.
3. **An offer and its code.** Open `/offers`, then the cake offer. Press **Sign in to take your code**, use
   `marisa.singh@example.com`, and open the sign-in link from `/outbox`. Marisa's account shows her two codes.
4. **At the till.** Go to `/portal?as=employee` (Keisha), then **Check a code**. Enter `P4NF-7GAE`: refused, because it
   is for the Couva store. Enter `K7QM-4XDP`: recorded. Enter it again: refused, already used.
5. **Approve an offer.** Go to `/portal?as=owner` (Vishala), **Promotions**. Tricia's "Christmas shop" is waiting:
   approve it, or send it back with a note.
6. **A sealed hiring decision.** On `/tour`, play **Hiring, with care** (Kwame and Shanice have no sign-in card of
   their own). Both cards look the same until opened; one is a kind "not selected", the other an offer.
7. **Access.** As Vishala, **Staff access**: revoke someone with a reason, then look at `/portal`. Their card can no
   longer be used. Restore it. Both moves are in the **Audit log**.

**Reset demo** (bottom of the staff menu) or **Reset demo data** (site footer) clears every change in this browser and
signs you out.

## Signing in

**Staff and applicants:** `/portal` has one card per person and no passwords. Each card says what that person can and
cannot see. To jump straight in, add `?as=` to the address.

| Card | Person | Shortcut | Can | Cannot |
|---|---|---|---|---|
| Applicant | Aaliyah Persad, applying for Checkout Associate, San Fernando | `/portal?as=applicant` | Her own application and documents | Anything else |
| Employee | Keisha Ramlogan, Checkout Supervisor, San Fernando | `/portal?as=employee` | Her shifts, leave and pay; checking codes at her till | Other people's records; other stores' codes |
| HR | Devon Baptiste, HR Manager, Princes Town | `/portal?as=hr` | Applications, jobs, staff documents, staff updates | The mailing list, promotions |
| Store admin | Ria Mohammed, Store Operations Lead, head office | `/portal?as=admin` | Specials, store hours, notices, staff updates, code redemptions | Applicants, promotions, the mailing list |
| Marketing | Tricia Baboolal, Marketing Coordinator, head office | `/portal?as=marketing` | Drafting offers and newsletters; the list with addresses hidden | Approving any offer; full addresses; export; applicants |
| Owner's office | Vishala Rampersad, Operations Director, head office | `/portal?as=owner` | Approving offers, staff access, audit log, full list and export, everything in the office console | Applicant and staff files, unless given a separate HR grant |

Marsha Gopaul (store admin for Princes Town only, until 15 November) has no card: the tour's staff-updates chapter
signs in as her to show a sender limited to one store.

**Shoppers** sign in at `/account/sign-in` with an e-mail address. A link arrives in `/outbox`; it works once, for 15
minutes. There is no password. The hint under the field shows Marisa's demo address so the codes are one click away.

On a phone, the staff menu sits behind **Menu** at the top left. **Switch role** and **Reset demo** are at the bottom
of that menu.

## The public site

| Page | What to show |
|---|---|
| Home `/` | The core of everything below, with a link from each band to its page. |
| Specials `/specials` | This week's deals with prices from Instagram; filter by department; the weekly e-mail sign-up. |
| Offers `/offers` | Members' offers. Anyone can read them; taking a code needs a free sign-in. Each says which stores take it and until when, in Trinidad time. |
| Departments `/departments` | Each department with its specials, plus the six counters: bakery, restaurant, fresh produce, butcher, household and pharmacy. |
| Wholesale `/wholesale` | Supply by the bag, case or pallet, and a trade-account enquiry form (demo; it sends nothing). |
| Locations `/locations` | All five stores: hours for the week, phone, map and directions. |
| About `/about` | The family, the memorial card for Nazim Mohammed, the store route map, and the public record. |
| Careers `/careers` | Open roles, how hiring works, and the documents you will need. |
| Demo outbox `/outbox` | Every e-mail the demo would have sent, newest first. |

## What each person can do

**Shopper (Marisa).** Take one code per offer, see it in **My offers** in large type for the counter, and change or
stop the weekly e-mail from the link in any newsletter. Signing up for a job or an account never adds anyone to the
mailing list; only the sign-up box does.

**Applicant.** Follow plain stages, each saying what happens and how long it usually takes. The document checklist
marks each item uploaded, verified or needing a fix, with what to do. When HR decides, the e-mail says only that there
is an update; the page shows a sealed card that looks the same either way. Opening it shows the decision, written with
care: a "not selected" thanks them, points to other open roles near them, and says when their documents are deleted;
an offer gives the pay, start date and what to bring.

**Employee (Keisha).**
- **Home:** today's shift, notices for her store, and anything she must do.
- **Staff updates:** the internal newsletter. Opening one marks it read; **I have read this** is the record that she
  was told.
- **Check a code:** at her own store only. Five refused checks in ten minutes pause her till's checks for five minutes.
- **Schedule, Leave, Pay, Documents & training, Profile:** her own records only.

**HR (Devon).**
- **Hiring pipeline:** open an application to check documents (**Verify** or **Flag** with a reason the applicant
  sees), move stages, and reach the **Decision** step. It previews exactly what the applicant will read and keeps HR's
  own reason separate from the message.
- **Jobs**, **Compliance** (documents, training due, leave to approve) and **Staff updates**.

**Office console (`/admin`).** It opens on **Today**: what needs this person now, worked out from their own access
(an offer to approve, a newsletter going out, specials more than four weeks old, someone's access about to end).
The menu shows only what the person's job uses.
- **Website:** Specials, Post maker (Instagram image and caption), Stores and hours, Publish (download the data file
  for the web team).
- **Staff:** Staff updates (stores and teams, a count of who it reaches, a test to your own work address, read
  receipts, **Remind** only the people still waiting) and Staff notices.
- **Marketing:** Promotions (draft, preview as shoppers see it, send for approval; the writer can never approve),
  Codes and redemptions (by store; codes appear only as their last four characters), Newsletter (built from the
  specials; test sends go to your own address; schedule or send now), Mailing list.
- **Owner's office:** Staff access (each grant names the role, stores and end date; revoke needs a reason) and the
  Audit log.

## Demo codes

| Code | Belongs to | What happens at Keisha's San Fernando till |
|---|---|---|
| `K7QM-4XDP` | Marisa, cake offer | Recorded the first time; "already used" after that |
| `P4NF-7GAE` | Marisa, Couva cut-veg offer | Refused: wrong store |
| `H9TW-3RVC` | Already used at San Fernando | Refused: already used, with when and where |

## Data and access rules

- Each sign-in card, menu and screen shows only what that person's grant allows, at the stores it covers, until its end
  date. Every write checks the grant again at the moment it runs, so an old open screen cannot get round a revoke.
- Codes are stored only as a fingerprint; staff never see a full code. Full subscriber addresses are visible to the
  owner's office only, and every export is logged with its row count. Exports quote every cell and defuse anything a
  spreadsheet would run as a formula.
- The newsletter uses double opt-in, keeps a consent record for every change, never sends to unconfirmed,
  unsubscribed or suppressed addresses, and answers a sign-up the same way whether or not the address was already on
  the list.
- Public pages ship none of the staff, member or mailing-list demo data: those load only on signed-in pages
  (checked on every build).
- **The honest limit:** this demo enforces all of this in the browser, which a visitor can edit. In production the same
  rules run on the server, against a database with row-level security, for every request.
</content>
</invoke>
