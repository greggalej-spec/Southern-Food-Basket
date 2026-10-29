import type { Customer, Entitlement, Seed } from "./types";

/* The "members" tier of the seed: shoppers' accounts and the codes they claimed. Only pages that import
   lib/members.ts (or lib/private.ts) carry it. The mailing list is a separate tier (lib/seed-mailing.ts), so an
   offer page can know a shopper's codes without carrying anyone's e-mail address. Everything here is DEMO: invented
   people and codes. In production each shopper's rows come from the server for that shopper only. Bump
   SEED.version in lib/seed.ts when this changes. */

type Tier = Partial<Seed>;

/* Codes are never stored, only their SHA-256 (lib/promo.ts hashCode). The three below are known so the tour can use
   them: K7QM-4XDP (Marisa, cake offer, unused), P4NF-7GAE (Marisa, Couva cut-veg offer, unused) and H9TW-3RVC
   (already used at San Fernando). The other claims are filler for the counts, with hashes that match no code. */
const KNOWN = {
  K7QM4XDP: '760ce82baa38feab66bb80ec84735c881b30f34b36c9344d438d1606c2c74628',
  P4NF7GAE: '7a21092e4e04cb99b7d05772be2fd00ec7a81ca11161a6d1c50e11e4414fd7a1',
  H9TW3RVC: 'a1adc2e1948830877536572288c51354e3fca9ba295b5433c0abf350705a00f6',
};

// A small fixed sequence, so the filler is the same on every load and the server matches the browser.
function filler(promoId: string, n: number, redeemedEvery: number, branches: string[], month: string, day0: number): Entitlement[] {
  const out: Entitlement[] = [];
  let x = 0x2f6b + n;
  const next = () => (x = (x * 1103515245 + 12345) & 0x7fffffff);
  const A = 'ACDEFGHJKMNPQRTUVWXY34679';
  for (let i = 1; i <= n; i++) {
    let hash = '';
    while (hash.length < 64) hash += next().toString(16).padStart(8, '0');
    const last4 = Array.from({ length: 4 }, () => A[next() % A.length]).join('');
    const day = month + '-' + String(day0 + (i % 6)).padStart(2, '0');
    const e: Entitlement = { id: promoId + '-c' + i, promoId, customerId: 'cust-demo-' + i, codeHash: hash.slice(0, 64), last4, claimedAt: day + 'T1' + (i % 9) + ':0' + (i % 6) + ':00-04:00', status: 'claimed' };
    if (i % redeemedEvery === 0) Object.assign(e, { status: 'redeemed', redeemedAt: day + 'T17:1' + (i % 6) + ':00-04:00', redeemedBy: 'emp-keisha', redeemedBranch: branches[i % branches.length] });
    out.push(e);
  }
  return out;
}

const CUSTOMERS: Customer[] = [
  { id: 'cust-marisa', name: 'Marisa Singh', email: 'marisa.singh@example.com', emailVerifiedAt: '2026-10-26T19:02:00-04:00', preferredBranch: 'couva', createdAt: '2026-10-26T19:00:00-04:00',
    wallet: [{ entitlementId: 'promo-cake-marisa', code: 'K7QM-4XDP' }, { entitlementId: 'promo-veg-marisa', code: 'P4NF-7GAE' }] },
];

const ENTITLEMENTS: Entitlement[] = [
  { id: 'promo-cake-marisa', promoId: 'promo-cake', customerId: 'cust-marisa', codeHash: KNOWN.K7QM4XDP, last4: '4XDP', claimedAt: '2026-10-26T19:03:00-04:00', status: 'claimed' },
  { id: 'promo-veg-marisa', promoId: 'promo-veg-couva', customerId: 'cust-marisa', codeHash: KNOWN.P4NF7GAE, last4: '7GAE', claimedAt: '2026-10-27T08:15:00-04:00', status: 'claimed' },
  { id: 'promo-cake-used', promoId: 'promo-cake', customerId: 'cust-demo-used', codeHash: KNOWN.H9TW3RVC, last4: '3RVC', claimedAt: '2026-10-26T12:40:00-04:00', status: 'redeemed', redeemedAt: '2026-10-27T16:22:00-04:00', redeemedBy: 'emp-keisha', redeemedBranch: 'sando' },
  ...filler('promo-cake', 31, 3, ['sando', 'couva', 'ptown', 'penal', 'pfortin'], '2026-10', 21),
  ...filler('promo-veg-couva', 12, 4, ['couva'], '2026-10', 20),
  ...filler('promo-school', 46, 2, ['sando', 'couva', 'ptown', 'penal', 'pfortin'], '2026-09', 1),
];

export const MEMBERS_TIER: Tier = {
  customers: CUSTOMERS,
  entitlements: ENTITLEMENTS,
};
