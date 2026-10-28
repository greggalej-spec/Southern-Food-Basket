# Southern Food Basket concept: how to use the site

An unofficial concept by Trinovata for a real south-Trinidad grocer. It has a public website plus four demo portals:
applicant, employee, HR and store admin. **Nothing you type leaves your browser.** Changes are saved in that browser
only, so another device or browser starts fresh.

Real: the logo, product photos and special prices (the company's public Instagram), and store addresses, hours and phone
numbers (each store's Google Maps listing). Demo: every person, job, application, payslip and document.

## Open it

| Where | Link | Notes |
|---|---|---|
| Latest preview (Next.js rebuild, 28 Oct 2026, commit `053feeb`) | https://southern-food-basket-next-g3tvr9bkh-greggs-projects-fbe529a0.vercel.app | Opens only after you sign in to Vercel. |
| Your machine | In the `next-rebuild` worktree run `npm run dev -- --port 4176`, then open http://localhost:4176 | Same site; fastest for showing it. |
| Public link | https://southern-food-basket.vercel.app | The static version you deploy yourself. Page addresses there end in `.html`. |

Skip https://southern-food-basket-next-greggs-projects-fbe529a0.vercel.app: it still shows the first build of the rebuild.

**Sharing:** the public link may go to the business. Keep the site off trinovata.com/work and social media until they
agree: it uses their photos and logo without permission.

## A five-minute demo

1. **Home.** Scroll through the Grand Entrance. Under Departments, flip the layout switch: *Tiles*, *Big photos*,
   *Shop windows*, *Side by side*. The star button in the bottom corner switches between the main design and options
   A, B and C. Drag it to either corner.
2. **Specials.** Filter by department. **Locations:** jump to a store for its hours, phone and directions.
3. **Careers.** Open a job, then press **Apply**: *Account → Personal → Experience → Documents → Review*. In Documents,
   pick any image or PDF as the photo ID. You see a preview, but only the file name, size and type are kept.
   Submitting signs you in as that new applicant and opens **My application**.
4. **HR.** Go to `/portal` and choose **HR**. On the Hiring pipeline, open **Aaliyah Persad** in the *KYC review*
   column. Under Documents, **Verify** her national ID, then use **Move to stage** to send her to *Interview*.
5. **Back as the applicant.** Use **Switch role** in the sidebar and choose **Applicant**. Aaliyah's tracker now reads
   *Interview*, her ID shows as verified, and the flagged proof of address still shows HR's reason.
6. **Store admin.** Use **Switch role** and choose **Store admin**. Under Specials, press **Add a deal**, then
   **Save deal**. Open `/specials` and the deal is there.
7. **Reset demo** (in the sidebar) or **Reset demo data** (in the site footer) clears every change in this browser,
   signs you out and takes you back to the home page.

The Applicant card on the sign-in page always opens Aaliyah's application, not one you made in step 3. That is why
step 4 uses her.

## Signing in

`/portal` has one card per role and no passwords. To jump straight into a role, add `?as=` to the address:

| Role | Demo person | Shortcut | Lands on |
|---|---|---|---|
| Applicant | Aaliyah Persad, applying for Checkout Associate, San Fernando | `/portal?as=applicant` | My application |
| Employee | Keisha Ramlogan, Checkout Supervisor, San Fernando | `/portal?as=employee` | Portal home |
| HR | Devon Baptiste, HR Manager, Princes Town | `/portal?as=hr` | HR console |
| Store admin | Ria Mohammed, Marketing and Store Operations | `/portal?as=admin` | Admin console |

On a phone, the staff menu sits behind **Menu** at the top left. **Switch role** and **Reset demo** are at the bottom
of that menu.

## The public site

| Page | What to show |
|---|---|
| Home `/` | The core of everything below, with a link from each band to its page. `?depts=photos` (or `tiles`, `bays`, `compare`) opens with that department layout. |
| Specials `/specials` | This week's deals with prices from Instagram; filter by department. |
| Departments `/departments` | Each department with its specials, plus the six counters: bakery, restaurant, fresh produce, butcher, household and pharmacy. |
| Wholesale `/wholesale` | Supply by the bag, case or pallet, and a trade-account enquiry form (demo; it sends nothing). |
| Locations `/locations` | All five stores: hours for the week, phone, map and directions. |
| About `/about` | The family, the memorial card for Nazim Mohammed, the store route map, and the public record. |
| Careers `/careers` | Open roles, how hiring works, and the documents you will need. |

## What each role can do

**Applicant.** Follow the stages *Submitted → Screening → KYC review → Interview → Offer → Hired*. The document
checklist marks each item uploaded, verified or flagged, and a flag shows HR's reason. Read HR's messages,
**Accept offer** or **Decline** when an offer arrives, or **Withdraw application**.

**Employee.**
- **Home:** announcements and quick actions.
- **Schedule:** step through the weeks and **Request swap** on a shift.
- **Leave:** balances, plus a form that ends in **Send request**.
- **Pay:** payslips by period, and each one prints.
- **Documents & training:** policies, training and your own documents.
- **Profile:** details, emergency contact, bank details (masked) and identity documents.

**HR.**
- **Hiring pipeline:** filter by role or search by name, then open a card. Its tabs are Details, Documents, Notes,
  Messages and Timeline. **Verify** or **Flag** each document; a flag asks for a reason, which the applicant sees.
  From there, **Move to stage**, **Schedule interview**, **Send offer** or mark *Not selected*.
- **Jobs:** open or close roles.
- **Compliance:** employee documents, training that is due, and pending leave to **Approve** or **Decline**.

A leave request sent as Keisha shows up here, and she sees the decision in her portal.

**Store admin.**
- **Specials:** add, edit or remove deals.
- **Post maker:** turns a deal into an Instagram post, with **Download PNG** and **Copy caption**.
- **Stores and hours:** edit opening hours and phone numbers.
- **Staff notices:** post a notice to staff.
- **Publish:** **Download data file** saves every change as `seed.ts` for the web team. **Discard my changes**
  starts over.

Admin edits show on `/specials`, `/locations` and the other inner pages straight away in the same browser. The home
page shows the shipped data, so a change reaches it only after the web team publishes that file.
