import type { AuditEvent, Campaign, Grant, Promotion, RedeemAttempt, Seed } from "./types";

/* The "staff" tier of the seed: applicants, employees, notices, policies, staff access grants, newsletter campaigns,
   till checks, the audit log, and promotions that are not public yet (drafts, in review, scheduled, ended). Only the
   portals import it, through lib/private.ts. Everything here is DEMO: invented people, jobs, pay and documents.
   Bump SEED.version in lib/seed.ts when this changes. */

type Tier = Partial<Seed>;

const PROMOTIONS: Promotion[] = [
  { id: 'promo-christmas', slug: 'christmas-shop', title: 'Christmas shop', benefit: 'TT$30 off a shop of TT$300 or more', kind: 'member-code',
    summary: 'For signed-in shoppers in the two weeks before Christmas.',
    terms: ['One code per shopper.', 'Show the code at the till before you pay. The cashier records it.', 'Not with any other offer.', 'The offer does not promise stock of any item.'],
    img: 'cake-chocolate', alt: 'Chocolate cake ringed with yellow piped frosting flowers',
    branchIds: null, starts: '2026-12-10T00:00:00-04:00', ends: '2026-12-24T18:00:00-04:00', limits: { perCustomer: 1, total: 1000 },
    status: 'review', createdBy: 'emp-tricia', createdAt: '2026-10-27T10:05:00-04:00', submittedAt: '2026-10-28T09:40:00-04:00',
    revisions: [{ at: '2026-10-27T10:05:00-04:00', by: 'emp-tricia', summary: 'Drafted' }, { at: '2026-10-28T09:40:00-04:00', by: 'emp-tricia', summary: 'Sent for approval' }] },
  { id: 'promo-pharmacy', slug: 'pharmacy-vitamins', title: 'Pharmacy vitamins', benefit: '10% off vitamins and supplements', kind: 'member-code',
    summary: 'At the pharmacy counter, for signed-in shoppers.',
    terms: ['One code per shopper.', 'Pharmacy counter only.', 'Not on prescription items.'],
    branchIds: ['sando', 'ptown'], starts: '2026-11-16T00:00:00-04:00', ends: '2026-11-30T21:00:00-04:00', limits: { perCustomer: 1, total: 300 },
    status: 'draft', createdBy: 'emp-tricia', createdAt: '2026-10-28T14:20:00-04:00',
    revisions: [{ at: '2026-10-28T14:20:00-04:00', by: 'emp-tricia', summary: 'Drafted' }] },
  { id: 'promo-school', slug: 'back-to-school', title: 'Back to school', benefit: 'TT$10 off lunch-box snacks over TT$60', kind: 'member-code',
    summary: 'Snacks for the first week of term.',
    terms: ['One code per shopper.', 'Snacks aisle items only.'],
    img: 'snack-pack', alt: 'A four-pack of Snack Pack chocolate and vanilla pudding cups',
    branchIds: null, starts: '2026-08-24T00:00:00-04:00', ends: '2026-09-07T21:00:00-04:00', limits: { perCustomer: 1, total: 400 },
    status: 'approved', createdBy: 'emp-tricia', createdAt: '2026-08-10T09:00:00-04:00', submittedAt: '2026-08-11T09:00:00-04:00', approvedBy: 'emp-vishala', approvedAt: '2026-08-12T08:30:00-04:00',
    revisions: [{ at: '2026-08-10T09:00:00-04:00', by: 'emp-tricia', summary: 'Drafted' }, { at: '2026-08-12T08:30:00-04:00', by: 'emp-vishala', summary: 'Approved' }] },
];

const GRANTS: Grant[] = [
  { id: 'g-keisha', userId: 'emp-keisha', role: 'employee', branchIds: ['sando'], extra: ['codes.redeem'], grantedBy: 'emp-vishala', grantedAt: '2021-03-08T08:00:00-04:00' },
  { id: 'g-marsha', userId: 'emp-marsha', role: 'employee', branchIds: ['ptown'], grantedBy: 'emp-vishala', grantedAt: '2017-05-02T08:00:00-04:00' },
  { id: 'g-marsha-admin', userId: 'emp-marsha', role: 'admin', branchIds: ['ptown'], grantedBy: 'emp-vishala', grantedAt: '2026-10-20T09:00:00-04:00', expires: '2026-11-15T23:59:00-04:00' },
  { id: 'g-andre', userId: 'emp-andre', role: 'employee', branchIds: ['ptown'], grantedBy: 'emp-devon', grantedAt: '2026-09-15T08:00:00-04:00' },
  { id: 'g-devon', userId: 'emp-devon', role: 'hr', branchIds: null, grantedBy: 'emp-vishala', grantedAt: '2019-01-14T08:00:00-04:00' },
  { id: 'g-ria', userId: 'emp-ria', role: 'admin', branchIds: null, grantedBy: 'emp-vishala', grantedAt: '2022-02-01T08:00:00-04:00' },
  { id: 'g-tricia', userId: 'emp-tricia', role: 'marketing', branchIds: null, grantedBy: 'emp-vishala', grantedAt: '2024-06-03T08:00:00-04:00' },
  { id: 'g-vishala', userId: 'emp-vishala', role: 'owner', branchIds: null, grantedBy: 'emp-vishala', grantedAt: '2024-01-02T08:00:00-04:00' },
  { id: 'g-ria-hr', userId: 'emp-ria', role: 'hr', branchIds: null, grantedBy: 'emp-vishala', grantedAt: '2025-06-01T08:00:00-04:00', revokedAt: '2025-07-31T17:00:00-04:00', revokedBy: 'emp-vishala' },
];

const REDEMPTIONS: RedeemAttempt[] = [
  { id: 'rd-1', at: '2026-10-27T16:22:00-04:00', by: 'emp-keisha', branchId: 'sando', ok: true, reason: 'Recorded', last4: '3RVC', entitlementId: 'promo-cake-used' },
  { id: 'rd-2', at: '2026-10-27T16:40:00-04:00', by: 'emp-keisha', branchId: 'sando', ok: false, reason: 'Already used', last4: '3RVC', entitlementId: 'promo-cake-used' },
];

const CAMPAIGNS: Campaign[] = [
  { id: 'cmp-1022', subject: 'This week: cut veg packs from TT$11.95', preheader: 'Chunky, stir fry and chow mein packs, ready to cook.', template: 'weekly-specials',
    intro: 'Dinner in less time: three ready-cut veg packs are on special this week, with fresh parsley alongside.',
    specialIds: ['sp-veg-chunky', 'sp-veg-stir-fry', 'sp-veg-chow-mein', 'sp-parsley'], segment: { branches: null, topics: ['weekly-specials'] },
    status: 'sent', scheduledFor: '2026-10-22T07:00:00-04:00', sentAt: '2026-10-22T07:00:00-04:00', sentTo: 9, createdBy: 'emp-tricia', createdAt: '2026-10-20T15:00:00-04:00',
    testSends: [{ at: '2026-10-21T16:10:00-04:00', to: 'isabel@sfb.example' }] },
  { id: 'cmp-1030', subject: 'Cakes for the weekend, and TT$15 off for members', preheader: 'Red velvet, chocolate, sponge, coconut and almond crumble.', template: 'offer',
    intro: 'Five double-layer cakes are on special, and members can take TT$15 off any one of them until 15 November.',
    specialIds: ['sp-cake-red-velvet', 'sp-cake-chocolate', 'sp-cake-sponge'], promoId: 'promo-cake', segment: { branches: null, topics: ['offers'] },
    status: 'scheduled', scheduledFor: '2026-10-30T07:00:00-04:00', createdBy: 'emp-tricia', createdAt: '2026-10-28T11:00:00-04:00', testSends: [] },
  { id: 'cmp-draft', subject: 'Couva: this week at 696 Southern Main Road', preheader: 'Store news and the cut-veg offer.', template: 'store-news',
    intro: '', specialIds: [], promoId: 'promo-veg-couva', segment: { branches: ['couva'], topics: ['store-news', 'offers'] },
    status: 'draft', createdBy: 'emp-tricia', createdAt: '2026-10-29T08:20:00-04:00', testSends: [] },
];

const AUDIT: AuditEvent[] = [
  { id: 'au-1', at: '2026-10-28T09:40:00-04:00', actor: 'emp-tricia', role: 'marketing', action: 'promo.submit', target: 'Christmas shop', detail: 'Sent for approval', ok: true },
  { id: 'au-2', at: '2026-10-27T16:40:00-04:00', actor: 'emp-keisha', role: 'employee', action: 'code.redeem', target: 'Code ending 3RVC', detail: 'Refused: already used', ok: false },
  { id: 'au-3', at: '2026-10-27T16:22:00-04:00', actor: 'emp-keisha', role: 'employee', action: 'code.redeem', target: 'Code ending 3RVC', detail: 'Recorded at San Fernando', ok: true },
  { id: 'au-4', at: '2026-10-22T07:00:00-04:00', actor: 'emp-tricia', role: 'marketing', action: 'newsletter.send', target: 'This week: cut veg packs from TT$11.95', detail: 'Sent to 9 subscribers', ok: true },
  { id: 'au-5', at: '2026-10-20T09:00:00-04:00', actor: 'emp-vishala', role: 'owner', action: 'access.grant', target: 'Marsha Gopaul', detail: 'Store admin for Princes Town until 15 Nov', ok: true },
];

export const STAFF_TIER: Tier = {
  /* demo applicants. docs: { docId: { state, fileName, size, type, expiry, reason } } — never file bytes */
  applicants: [
    { id: 'app-aaliyah', name: 'Aaliyah Persad', email: 'aaliyah.persad@example.com', phone: '(868) 000-0201', jobId: 'job-checkout-sando', stage: 'kyc', submittedAt: '2026-10-14T10:12:00',
      personal: { address: 'Demo Street, Marabella', dob: '2001-06-14', nonNational: false },
      experience: { summary: 'Two years as a cashier at a pharmacy in Marabella; comfortable with card terminals and end-of-day reconciliation.', availability: ['Weekdays', 'Saturdays'], startDate: '2026-11-02' },
      docs: {
        'photo-id': { state: 'uploaded', fileName: 'national-id.jpg', size: 412000, type: 'image/jpeg', expiry: '2029-03-14', updatedAt: '2026-10-14T10:20:00' },
        'bir': { state: 'verified', fileName: 'bir-letter.pdf', size: 88000, type: 'application/pdf', updatedAt: '2026-10-16T09:00:00' },
        'nis': { state: 'verified', fileName: 'nis-card.jpg', size: 230000, type: 'image/jpeg', updatedAt: '2026-10-16T09:02:00' },
        'coc': { state: 'uploaded', fileName: 'certificate-of-character.pdf', size: 540000, type: 'application/pdf', expiry: '2027-03-01', updatedAt: '2026-10-15T18:40:00' },
        'address': { state: 'flagged', fileName: 'tt-electricity-bill.pdf', size: 150000, type: 'application/pdf', reason: 'Bill is older than three months. Please upload a recent one.', updatedAt: '2026-10-16T09:10:00' },
        'refs': { state: 'uploaded', fileName: 'references.pdf', size: 60000, type: 'application/pdf', updatedAt: '2026-10-14T10:25:00' }
      },
      notes: [{ at: '2026-10-16T09:12:00', author: 'Faith', text: 'Strong cash-handling background. Chasing a recent proof of address, then schedule interview at Coffee Street.' }],
      messages: [{ at: '2026-10-16T09:15:00', from: 'HR', text: 'Hi Aaliyah, thanks for applying. Your proof of address is older than three months. Please upload a bill or statement from the last three months and we will move you to interview.' }],
      timeline: [
        { at: '2026-10-14T10:12:00', text: 'Application submitted' },
        { at: '2026-10-15T14:00:00', text: 'Moved to Screening' },
        { at: '2026-10-16T09:00:00', text: 'Moved to KYC review' },
        { at: '2026-10-16T09:10:00', text: 'Proof of address: flagged — Bill is older than three months' }
      ] },
    { id: 'app-jerome', name: 'Jerome Phillip', email: 'jerome.phillip@example.com', phone: '(868) 000-0202', jobId: 'job-bakery-ptown', stage: 'interview', submittedAt: '2026-10-13T08:40:00',
      personal: { address: 'Demo Trace, Princes Town', dob: '1998-11-02', nonNational: false },
      experience: { summary: 'Three years at a family bakery in Princes Town; hops bread, sweetbread and pastry. Holds a current food badge.', availability: ['Early mornings', 'Saturdays'], startDate: '2026-11-09' },
      interview: { at: '2026-10-27T10:00:00', where: 'Princes Town head office', with: 'Marsha Gopaul, Bakery Lead' },
      docs: {
        'photo-id': { state: 'verified', fileName: 'drivers-permit.jpg', size: 380000, type: 'image/jpeg', expiry: '2028-01-20' },
        'bir': { state: 'verified', fileName: 'bir.pdf', size: 70000, type: 'application/pdf' },
        'nis': { state: 'verified', fileName: 'nis.pdf', size: 65000, type: 'application/pdf' },
        'coc': { state: 'verified', fileName: 'coc.pdf', size: 520000, type: 'application/pdf', expiry: '2027-02-10' },
        'address': { state: 'verified', fileName: 'wasa-bill.pdf', size: 140000, type: 'application/pdf' },
        'refs': { state: 'verified', fileName: 'refs.pdf', size: 50000, type: 'application/pdf' },
        'bank': { state: 'uploaded', fileName: 'bank-letter.pdf', size: 90000, type: 'application/pdf' },
        'food-badge': { state: 'verified', fileName: 'food-badge.jpg', size: 300000, type: 'image/jpeg', expiry: '2027-08-31' }
      },
      notes: [{ at: '2026-10-19T11:00:00', author: 'Faith', text: 'All documents in. Interview booked with Marsha for Mon 27 Oct.' }],
      messages: [{ at: '2026-10-19T11:05:00', from: 'HR', text: 'Hi Jerome, your interview is on Monday 27 October at 10:00 am at the Princes Town head office. Ask for Marsha at the wholesale desk.' }],
      timeline: [
        { at: '2026-10-13T08:40:00', text: 'Application submitted' },
        { at: '2026-10-14T09:30:00', text: 'Moved to Screening' },
        { at: '2026-10-15T10:00:00', text: 'Moved to KYC review' },
        { at: '2026-10-19T11:00:00', text: 'Moved to Interview' }
      ] },
    { id: 'app-priya', name: 'Priya Maharaj', email: 'priya.maharaj@example.com', phone: '(868) 000-0203', jobId: 'job-wholesale-sando', stage: 'screening', submittedAt: '2026-10-18T16:05:00',
      personal: { address: 'Demo Avenue, Debe', dob: '1994-03-22', nonNational: false },
      experience: { summary: 'Four years selling beverages to bars and mini-marts across the south for a distributor. Own car, Class 3 permit.', availability: ['Weekdays'], startDate: '2026-11-16' },
      docs: { 'photo-id': { state: 'uploaded', fileName: 'passport.jpg', size: 400000, type: 'image/jpeg', expiry: '2031-05-02' } },
      notes: [], messages: [],
      timeline: [{ at: '2026-10-18T16:05:00', text: 'Application submitted' }, { at: '2026-10-20T09:00:00', text: 'Moved to Screening' }] },
    { id: 'app-marcus', name: 'Marcus Joseph', email: 'marcus.joseph@example.com', phone: '(868) 000-0204', jobId: 'job-warehouse-ptown', stage: 'submitted', submittedAt: '2026-10-21T19:30:00',
      personal: { address: 'Demo Road, Moruga', dob: '2003-09-09', nonNational: false },
      experience: { summary: 'Loaded trucks for a hardware store for a year. Fit, reliable, wants forklift training.', availability: ['Any shift'], startDate: '2026-11-02' },
      docs: {}, notes: [], messages: [],
      timeline: [{ at: '2026-10-21T19:30:00', text: 'Application submitted' }] },
    { id: 'app-shanice', outcome: { kind: 'offer', at: '2026-10-27T15:00:00' }, name: 'Shanice Lewis', email: 'shanice.lewis@example.com', phone: '(868) 000-0205', jobId: 'job-perish-penal', stage: 'offer', submittedAt: '2026-10-02T09:00:00',
      personal: { address: 'Demo Street, Penal', dob: '1999-12-30', nonNational: false },
      experience: { summary: 'Two years in produce at a Siparia supermarket. Knows the Penal farmers by name.', availability: ['Early mornings', 'Sundays'], startDate: '2026-11-02' },
      interview: { at: '2026-10-13T14:00:00', where: 'Penal store, S.S. Erin Road', with: 'Faith, HR' },
      offer: { startDate: '2026-11-09', pay: 4300, payUnit: 'month', sentAt: '2026-10-27T15:00:00', status: 'sent' },
      docs: {
        'photo-id': { state: 'verified', fileName: 'id.jpg', size: 350000, type: 'image/jpeg', expiry: '2030-06-15' },
        'bir': { state: 'verified', fileName: 'bir.pdf', size: 70000, type: 'application/pdf' },
        'nis': { state: 'verified', fileName: 'nis.pdf', size: 65000, type: 'application/pdf' },
        'coc': { state: 'verified', fileName: 'coc.pdf', size: 500000, type: 'application/pdf', expiry: '2027-01-15' },
        'address': { state: 'verified', fileName: 'bill.pdf', size: 120000, type: 'application/pdf' },
        'refs': { state: 'verified', fileName: 'refs.pdf', size: 50000, type: 'application/pdf' },
        'bank': { state: 'verified', fileName: 'bank.pdf', size: 80000, type: 'application/pdf' },
        'food-badge': { state: 'verified', fileName: 'badge.jpg', size: 280000, type: 'image/jpeg', expiry: '2027-04-30' }
      },
      notes: [{ at: '2026-10-27T15:00:00', author: 'Faith', text: 'Offer sent at TTD 4,300 / month, start 9 Nov. Pay agreed with the Penal manager after the interview.' }],
      messages: [{ at: '2026-10-13T16:30:00', from: 'Faith', text: 'Hi Shanice, thank you for coming in today. We will be in touch within two weeks.' }],
      timeline: [
        { at: '2026-10-02T09:00:00', text: 'Application submitted' }, { at: '2026-10-05T10:00:00', text: 'Moved to Screening' },
        { at: '2026-10-07T10:00:00', text: 'Moved to KYC review' }, { at: '2026-10-13T10:00:00', text: 'Moved to Interview' },
        { at: '2026-10-27T15:00:00', text: 'Moved to Offer' }
      ] },
    { id: 'app-kwame', outcome: { kind: 'not-selected', at: '2026-10-26T11:20:00' }, name: 'Kwame Alexander', email: 'kwame.alexander@example.com', phone: '(868) 000-0206', jobId: 'job-it-ptown', stage: 'not-selected', submittedAt: '2026-09-22T11:00:00',
      personal: { address: 'Demo Street, San Fernando', dob: '1996-04-18', nonNational: false },
      experience: { summary: 'Help-desk experience at a call centre; no POS background.', availability: ['Weekdays'], startDate: '2026-10-19' },
      docs: { 'photo-id': { state: 'verified', fileName: 'id.jpg', size: 350000, type: 'image/jpeg', expiry: '2029-09-01' } },
      notes: [{ at: '2026-10-26T11:20:00', author: 'Faith', text: 'Role filled internally. Keep on file for the next support opening.' }],
      messages: [{ at: '2026-09-25T10:05:00', from: 'Faith', text: 'Hi Kwame, thank you for applying. We are reading applications for this role now and will be in touch.' }],
      timeline: [{ at: '2026-09-22T11:00:00', text: 'Application submitted' }, { at: '2026-09-25T10:00:00', text: 'Moved to Screening' }, { at: '2026-10-26T11:20:00', text: 'Moved to Not selected' }] },
    { id: 'app-nadia', name: 'Nadia Ali', email: 'nadia.ali@example.com', phone: '(868) 000-0207', jobId: 'job-checkout-penal', stage: 'submitted', submittedAt: '2026-10-22T08:15:00',
      personal: { address: 'Demo Trace, Penal', dob: '2005-02-11', nonNational: false },
      experience: { summary: 'Sixth-form student looking for evening and weekend work.', availability: ['Evenings', 'Weekends'], startDate: '2026-11-02' },
      docs: {}, notes: [], messages: [], timeline: [{ at: '2026-10-22T08:15:00', text: 'Application submitted' }] },
    { id: 'app-rishi', name: 'Rishi Boodram', email: 'rishi.boodram@example.com', phone: '(868) 000-0208', jobId: 'job-dispatch-sando', stage: 'screening', submittedAt: '2026-10-17T13:45:00',
      personal: { address: 'Demo Street, Gasparillo', dob: '1992-07-07', nonNational: false },
      experience: { summary: 'Five years driving and dispatching for a courier; knows every back road from Claxton Bay to Moruga.', availability: ['Weekdays', 'Saturdays'], startDate: '2026-11-09' },
      docs: { 'photo-id': { state: 'uploaded', fileName: 'permit.jpg', size: 390000, type: 'image/jpeg', expiry: '2027-11-30' }, 'bir': { state: 'uploaded', fileName: 'bir.pdf', size: 70000, type: 'application/pdf' } },
      notes: [], messages: [], timeline: [{ at: '2026-10-17T13:45:00', text: 'Application submitted' }, { at: '2026-10-20T09:05:00', text: 'Moved to Screening' }] }
  ],

  /* demo employees. Keisha is the Employee demo login; Faith is the HR demo login. */
  employees: [
    { id: 'emp-keisha', name: 'Keisha Ramlogan', role: 'Checkout Supervisor', dept: 'Checkout', branchId: 'sando', startDate: '2021-03-08', employeeNo: 'SFB-0412',
      email: 'keisha.ramlogan@sfb.example', phone: '(868) 000-0101', address: 'Demo Street, Marabella',
      emergency: { name: 'Anil Ramlogan', relation: 'Spouse', phone: '(868) 000-0102' },
      bank: { bank: 'Demo Bank', masked: '•••• 4821' },
      leave: { annualEntitled: 14, annualUsed: 5, sickEntitled: 14, sickUsed: 2, casualEntitled: 3, casualUsed: 1 },
      leaveRequests: [
        { id: 'lv-1', type: 'Annual', from: '2026-12-22', to: '2026-12-24', days: 3, reason: 'Christmas with family', status: 'pending', requestedAt: '2026-10-20T08:00:00' },
        { id: 'lv-2', type: 'Annual', from: '2026-08-10', to: '2026-08-14', days: 5, reason: 'Family trip', status: 'approved', requestedAt: '2026-07-12T09:00:00' },
        { id: 'lv-3', type: 'Sick', from: '2026-09-03', to: '2026-09-04', days: 2, reason: 'Flu', status: 'approved', requestedAt: '2026-09-03T06:30:00' },
        { id: 'lv-4', type: 'Casual', from: '2026-06-19', to: '2026-06-19', days: 1, reason: 'School meeting', status: 'approved', requestedAt: '2026-06-10T10:00:00' }
      ],
      swapRequests: [],
      shifts: [
        { date: '2026-10-19', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-20', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-22', start: '12:00', end: '20:00', role: 'Front end lead' },
        { date: '2026-10-23', start: '12:00', end: '20:00', role: 'Front end lead' },
        { date: '2026-10-24', start: '08:00', end: '16:00', role: 'Front end lead' },
        { date: '2026-10-26', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-27', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-28', start: '07:00', end: '15:00', role: 'Till training (new starters)' },
        { date: '2026-10-30', start: '12:00', end: '20:00', role: 'Front end lead' },
        { date: '2026-10-31', start: '08:00', end: '16:00', role: 'Front end lead' },
        { date: '2026-11-01', start: '08:00', end: '13:00', role: 'Front end lead' }
      ],
      payslips: [
        { id: 'ps-2026-09', period: 'September 2026', from: '2026-09-01', to: '2026-09-30', paidOn: '2026-09-30',
          earnings: [{ label: 'Basic salary', amount: 5800 }, { label: 'Supervisor allowance', amount: 400 }],
          deductions: [{ label: 'NIS (employee share)', amount: 294 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 0 }],
          gross: 6200, net: 5873 },
        { id: 'ps-2026-08', period: 'August 2026', from: '2026-08-01', to: '2026-08-31', paidOn: '2026-08-31',
          earnings: [{ label: 'Basic salary', amount: 5800 }, { label: 'Supervisor allowance', amount: 400 }, { label: 'Overtime (12.5 h)', amount: 312.5 }],
          deductions: [{ label: 'NIS (employee share)', amount: 294 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 0 }],
          gross: 6512.5, net: 6185.5 },
        { id: 'ps-2026-07', period: 'July 2026', from: '2026-07-01', to: '2026-07-31', paidOn: '2026-07-31',
          earnings: [{ label: 'Basic salary', amount: 5800 }, { label: 'Supervisor allowance', amount: 400 }],
          deductions: [{ label: 'NIS (employee share)', amount: 294 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 0 }],
          gross: 6200, net: 5873 }
      ],
      training: [
        { id: 'tr-food', name: 'Food safety, level 1', done: true, completedAt: '2025-02-10', minutes: 45 },
        { id: 'tr-cash', name: 'Cash handling and till procedures', done: true, completedAt: '2025-03-01', minutes: 30 },
        { id: 'tr-cust', name: 'Customer care refresher 2026', done: false, due: '2026-11-30', minutes: 25 },
        { id: 'tr-hs', name: 'Health and safety: manual handling', done: false, due: '2026-12-15', minutes: 20 }
      ],
      compliance: [
        { docId: 'photo-id', state: 'verified', expiry: '2028-06-30' },
        { docId: 'nis', state: 'verified' },
        { docId: 'bir', state: 'verified' },
        { docId: 'food-badge', state: 'verified', expiry: '2026-11-18' }
      ] },
    { id: 'emp-devon', name: 'Faith', role: 'HR Manager', dept: 'HR', branchId: 'ptown', startDate: '2019-01-14', employeeNo: 'SFB-0117',
      email: 'faith@sfb.example', phone: '(868) 000-0103', address: 'Demo Avenue, Princes Town',
      emergency: { name: 'On file', relation: 'Sister', phone: '(868) 000-0104' },
      bank: { bank: 'Demo Bank', masked: '•••• 7730' },
      leave: { annualEntitled: 20, annualUsed: 8, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [{ id: 'lv-d1', type: 'Annual', from: '2026-07-20', to: '2026-07-24', days: 5, reason: 'Tobago', status: 'approved', requestedAt: '2026-06-01T09:00:00' }],
      swapRequests: [],
      shifts: [
        { date: '2026-10-19', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-20', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-21', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-22', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-23', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-26', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-27', start: '08:00', end: '16:30', role: 'Interviews, Princes Town' }, { date: '2026-10-28', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-29', start: '08:00', end: '16:30', role: 'Branch visit, Penal' }, { date: '2026-10-30', start: '08:00', end: '16:30', role: 'Head office' }
      ],
      payslips: [
        { id: 'ps-d-2026-09', period: 'September 2026', from: '2026-09-01', to: '2026-09-30', paidOn: '2026-09-30',
          earnings: [{ label: 'Basic salary', amount: 11500 }, { label: 'Travel allowance', amount: 600 }],
          deductions: [{ label: 'NIS (employee share)', amount: 414.3 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 1125 }],
          gross: 12100, net: 10527.7 }
      ],
      training: [
        { id: 'tr-food', name: 'Food safety, level 1', done: true, completedAt: '2024-01-15', minutes: 45 },
        { id: 'tr-cust', name: 'Customer care refresher 2026', done: true, completedAt: '2026-09-02', minutes: 25 },
        { id: 'tr-hs', name: 'Health and safety: manual handling', done: false, due: '2026-12-15', minutes: 20 }
      ],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2029-11-02' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }] },
    { id: 'emp-marsha', name: 'Marsha Gopaul', role: 'Bakery Lead', dept: 'Bakery', branchId: 'ptown', startDate: '2017-05-02', employeeNo: 'SFB-0063',
      email: 'marsha.gopaul@sfb.example', phone: '(868) 000-0105', address: 'Demo Road, Princes Town',
      emergency: { name: 'Ravi Gopaul', relation: 'Brother', phone: '(868) 000-0106' },
      bank: { bank: 'Demo Bank', masked: '•••• 1190' },
      leave: { annualEntitled: 18, annualUsed: 10, sickEntitled: 14, sickUsed: 3, casualEntitled: 3, casualUsed: 2 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-22', start: '05:30', end: '13:30', role: 'Bakery' }, { date: '2026-10-23', start: '05:30', end: '13:30', role: 'Bakery' }, { date: '2026-10-24', start: '05:30', end: '13:30', role: 'Bakery' }],
      payslips: [],
      training: [{ id: 'tr-food', name: 'Food safety, level 1', done: true, completedAt: '2023-02-01', minutes: 45 }, { id: 'tr-cust', name: 'Customer care refresher 2026', done: false, due: '2026-11-30', minutes: 25 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2027-02-28' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }, { docId: 'food-badge', state: 'verified', expiry: '2026-09-30' }] },
    { id: 'emp-ria', name: 'Alexia', role: 'Executive Assistant', dept: 'Head office', branchId: 'sando', startDate: '2022-02-01', employeeNo: 'SFB-0233',
      email: 'alexia@sfb.example', phone: '(868) 000-0109', address: 'Demo Street, San Fernando',
      emergency: { name: 'On file', relation: 'Brother', phone: '(868) 000-0110' },
      bank: { bank: 'Demo Bank', masked: '•••• 3307' },
      leave: { annualEntitled: 16, annualUsed: 4, sickEntitled: 14, sickUsed: 1, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-22', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-23', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-26', start: '08:00', end: '16:30', role: 'Head office' }],
      payslips: [], training: [{ id: 'tr-cust', name: 'Customer care refresher 2026', done: true, completedAt: '2026-08-14', minutes: 25 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2031-04-30' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }] },
    { id: 'emp-tricia', name: 'Isabel', role: 'Marketing Team Lead', dept: 'Head office', branchId: 'sando', startDate: '2024-06-03', employeeNo: 'SFB-0371',
      email: 'isabel@sfb.example', phone: '(868) 000-0111', address: 'Demo Avenue, Gasparillo',
      emergency: { name: 'On file', relation: 'Next of kin', phone: '(868) 000-0112' },
      bank: { bank: 'Demo Bank', masked: '•••• 6614' },
      leave: { annualEntitled: 14, annualUsed: 6, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 1 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-29', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-30', start: '08:00', end: '16:30', role: 'Head office' }],
      payslips: [], training: [{ id: 'tr-cust', name: 'Customer care refresher 2026', done: true, completedAt: '2026-09-02', minutes: 25 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2029-08-31' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }] },
    { id: 'emp-vishala', name: 'Mellisa', role: 'Director', dept: 'Head office', branchId: 'ptown', startDate: '2012-01-09', employeeNo: 'SFB-0004',
      email: 'mellisa@sfb.example', phone: '(868) 000-0113', address: 'Demo Road, Princes Town',
      emergency: { name: 'On file', relation: 'Next of kin', phone: '(868) 000-0114' },
      bank: { bank: 'Demo Bank', masked: '•••• 0925' },
      leave: { annualEntitled: 20, annualUsed: 8, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-29', start: '07:30', end: '16:00', role: 'Head office' }, { date: '2026-10-30', start: '07:30', end: '16:00', role: 'Head office' }],
      payslips: [], training: [],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2028-03-31' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }] },
    { id: 'emp-andre', name: 'Andre Charles', role: 'Warehouse Attendant', dept: 'Warehouse', branchId: 'ptown', startDate: '2026-09-15', employeeNo: 'SFB-0498',
      email: 'andre.charles@sfb.example', phone: '(868) 000-0107', address: 'Demo Trace, Moruga',
      emergency: { name: 'Patricia Charles', relation: 'Mother', phone: '(868) 000-0108' },
      bank: { bank: 'Demo Bank', masked: '•••• 5502' },
      leave: { annualEntitled: 14, annualUsed: 0, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-22', start: '14:00', end: '22:00', role: 'Warehouse' }, { date: '2026-10-23', start: '14:00', end: '22:00', role: 'Warehouse' }],
      payslips: [],
      training: [{ id: 'tr-hs', name: 'Health and safety: manual handling', done: false, due: '2026-10-31', minutes: 20 }, { id: 'tr-forklift', name: 'Forklift certification', done: false, due: '2026-12-01', minutes: 480 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2030-01-10' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'uploaded' }, { docId: 'address', state: 'missing' }, { docId: 'coc', state: 'missing' }] }
  ],

  announcements: [
    { id: 'an-1', branchId: null, date: '2026-10-21', title: 'Public holiday rota is up', body: 'The rota for the next public holiday is posted in Schedule. Raise any swap requests by Friday so branch managers can confirm cover.' },
    { id: 'an-2', branchId: 'sando', date: '2026-10-20', title: 'Coffee Street car park works', body: 'Staff parking moves to the rear lot from Monday 26 October for two weeks while the front car park is resurfaced.' },
    { id: 'an-3', branchId: null, date: '2026-10-15', title: 'Customer care refresher due 30 November', body: 'Everyone on the front end completes the 25-minute refresher in Documents & training before 30 November.' },
    { id: 'an-4', branchId: 'ptown', date: '2026-10-12', title: 'Bakery ovens serviced Tuesday', body: 'Both ovens at Princes Town are serviced on Tuesday 28 October from 2:00 pm. The afternoon bake moves to San Fernando.' }
  ],

  policies: [
    { id: 'pol-conduct', title: 'Code of conduct', summary: 'How we treat customers, suppliers and each other. Straight dealing, no exceptions.', updated: '2026-01-10' },
    { id: 'pol-leave', title: 'Leave policy', summary: 'Annual, sick and casual leave entitlements, how to request, notice periods and public holidays.', updated: '2026-01-10' },
    { id: 'pol-food', title: 'Food safety and hygiene', summary: 'Badges, hand-washing, temperature logs, allergen handling and what to do when something is wrong.', updated: '2026-03-02' },
    { id: 'pol-hs', title: 'Health and safety', summary: 'Manual handling, equipment, incident reporting and first aid at every branch and the distribution centre.', updated: '2026-03-02' },
    { id: 'pol-uniform', title: 'Uniform and appearance', summary: 'What we wear on the floor, in the bakery and on the road, and who supplies it.', updated: '2025-11-01' },
    { id: 'pol-grievance', title: 'Grievance procedure', summary: 'How to raise a concern, who hears it and how quickly you get an answer.', updated: '2025-11-01' }
  ],
  grants: GRANTS,
  campaigns: CAMPAIGNS,
  redemptions: REDEMPTIONS,
  audit: AUDIT,
  promotions: PROMOTIONS,
};
