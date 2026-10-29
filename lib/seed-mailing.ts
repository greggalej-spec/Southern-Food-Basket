import type { ConsentEvent, OutboxMessage, Seed, Subscriber } from "./types";

/* The "mailing" tier of the seed: the mailing list, its consent ledger and the demo outbox. Only pages that import
   lib/mailing.ts (or lib/private.ts) carry it: the newsletter links, the demo outbox and the staff screens. Everything
   here is DEMO: invented addresses (all @example.com) and messages. Bump SEED.version in lib/seed.ts when this
   changes. */

type Tier = Partial<Seed>;

const sub = (id: string, email: string, status: Subscriber['status'], branches: string[], source: string, createdAt: string, extra: Partial<Subscriber> = {}): Subscriber => ({
  id, email, status, branches, topics: ['weekly-specials', 'offers'], source, createdAt, token: 'tk-' + id.slice(4) + '-demo', ...extra,
});

const SUBSCRIBERS: Subscriber[] = [
  sub('sub-marisa', 'marisa.singh@example.com', 'active', ['couva'], 'Offer sign-up', '2026-10-26T19:00:00-04:00', { confirmedAt: '2026-10-26T19:02:00-04:00' }),
  sub('sub-01', 'kevin.ramdial@example.com', 'active', ['sando'], 'Home page', '2026-10-02T07:41:00-04:00', { confirmedAt: '2026-10-02T07:44:00-04:00' }),
  sub('sub-02', 'alana.james@example.com', 'active', ['ptown', 'penal'], 'Specials page', '2026-10-05T12:10:00-04:00', { confirmedAt: '2026-10-05T12:30:00-04:00', topics: ['weekly-specials'] }),
  sub('sub-03', 'rohan.dookie@example.com', 'active', ['pfortin'], 'Footer', '2026-10-07T20:02:00-04:00', { confirmedAt: '2026-10-07T20:03:00-04:00' }),
  sub('sub-04', 'sasha.khan@example.com', 'active', ['couva', 'sando'], 'Home page', '2026-10-09T09:15:00-04:00', { confirmedAt: '2026-10-09T09:20:00-04:00', topics: ['weekly-specials', 'offers', 'store-news'] }),
  sub('sub-05', 'darren.mitchell@example.com', 'pending', ['sando'], 'Specials page', '2026-10-28T21:12:00-04:00'),
  sub('sub-06', 'kamla.persad@example.com', 'active', ['penal'], 'Footer', '2026-10-11T06:55:00-04:00', { confirmedAt: '2026-10-11T07:01:00-04:00' }),
  sub('sub-07', 'jason.ali@example.com', 'unsubscribed', ['ptown'], 'Home page', '2026-09-14T13:00:00-04:00', { confirmedAt: '2026-09-14T13:05:00-04:00', unsubscribedAt: '2026-10-23T08:10:00-04:00' }),
  sub('sub-08', 'nicole.baptiste@example.com', 'active', ['sando'], 'Offer sign-up', '2026-10-26T10:30:00-04:00', { confirmedAt: '2026-10-26T10:33:00-04:00', topics: ['offers'] }),
  sub('sub-09', 'trevor.samuel@example.com', 'suppressed', ['couva'], 'Footer', '2026-09-30T15:45:00-04:00', { confirmedAt: '2026-09-30T15:50:00-04:00' }),
  sub('sub-10', 'anisa.mohan@example.com', 'active', ['ptown'], 'Specials page', '2026-10-15T18:20:00-04:00', { confirmedAt: '2026-10-15T18:25:00-04:00' }),
  sub('sub-11', 'marlon.george@example.com', 'active', ['pfortin', 'penal'], 'Home page', '2026-10-19T11:11:00-04:00', { confirmedAt: '2026-10-19T11:40:00-04:00', topics: ['weekly-specials', 'store-news'] }),
  sub('sub-12', 'shivani.rampaul@example.com', 'pending', ['couva'], 'Home page', '2026-10-29T06:30:00-04:00'),
];

// CONSENT.version in lib/newsletter.ts
const CONSENT_WORDING = 'nl-2026-10';
const CONSENTS: ConsentEvent[] = SUBSCRIBERS.flatMap((s) => {
  const ev: ConsentEvent[] = [{ id: 'cn-' + s.id + '-r', subscriberId: s.id, action: 'requested', wording: CONSENT_WORDING, source: s.source, at: s.createdAt }];
  if (s.confirmedAt) ev.push({ id: 'cn-' + s.id + '-c', subscriberId: s.id, action: 'confirmed', wording: CONSENT_WORDING, source: 'Confirmation link', at: s.confirmedAt });
  if (s.unsubscribedAt) ev.push({ id: 'cn-' + s.id + '-w', subscriberId: s.id, action: 'withdrawn', wording: CONSENT_WORDING, source: 'Unsubscribe link', at: s.unsubscribedAt });
  if (s.status === 'suppressed') ev.push({ id: 'cn-' + s.id + '-s', subscriberId: s.id, action: 'suppressed', wording: CONSENT_WORDING, source: 'Bounced twice', at: '2026-10-22T09:00:00-04:00' });
  return ev;
});

const OUTBOX: OutboxMessage[] = [
  { id: 'ob-1', at: '2026-10-26T19:00:00-04:00', to: 'marisa.singh@example.com', kind: 'transactional', subject: 'Your sign-in link for Southern Food Basket',
    body: ['Use this link to sign in. It works once, for 15 minutes.', 'If you did not ask for it, ignore this e-mail.'] },
  { id: 'ob-2', at: '2026-10-26T19:03:00-04:00', to: 'marisa.singh@example.com', kind: 'transactional', subject: 'Your code: TT$15 off a 9-inch cake',
    body: ['Your code is in your account under My offers. Show it at the till before you pay; the cashier records it.', 'Valid until 15 November at any of our five stores. One code per shopper.'],
    action: { label: 'Open my offers', href: '/account' } },
  { id: 'ob-3', at: '2026-10-28T21:12:00-04:00', to: 'darren.mitchell@example.com', kind: 'transactional', subject: 'Confirm your weekly specials e-mail',
    body: ['Someone (we hope you) asked for the Southern Food Basket weekly specials at this address.', 'Confirm and we will send about one e-mail a week. If it was not you, ignore this and nothing more arrives.'],
    action: { label: 'Yes, send me the specials', href: '/newsletter/confirm?token=tk-05-demo' } },
  { id: 'ob-4', at: '2026-10-22T07:00:00-04:00', to: 'kevin.ramdial@example.com', kind: 'marketing', subject: 'This week: cut veg packs from TT$11.95',
    body: ['Dinner in less time: three ready-cut veg packs are on special this week, with fresh parsley alongside.'], campaignId: 'cmp-1022',
    action: { label: 'Change what you get, or unsubscribe', href: '/newsletter/preferences?token=tk-01-demo' } },
];

export const MAILING_TIER: Tier = {
  subscribers: SUBSCRIBERS,
  consents: CONSENTS,
  outbox: OUTBOX,
};
