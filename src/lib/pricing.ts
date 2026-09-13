/**
 * Accommodation pricing from the invitation. Single source of truth — used by
 * the RSVP form (live running total) and by /api/rsvp (authoritative amount
 * stored on the household). All amounts in ZAR cents.
 */
export type StayOption = 'friday_saturday' | 'saturday';

export const STAY_OPTIONS: Record<
  StayOption,
  { label: string; adultCents: number; nights: number; smallPrint: string; priceLabel: string }
> = {
  friday_saturday: {
    label: 'Friday & Saturday Evening',
    priceLabel: 'R2 100 pp',
    adultCents: 210_000,
    nights: 2,
    smallPrint:
      'Friday dinner, Friday accommodation, Saturday breakfast, wedding events, Saturday accommodation, Sunday breakfast, complimentary game drive.',
  },
  saturday: {
    label: 'Saturday Evening',
    priceLabel: 'R965 pp',
    adultCents: 96_500,
    nights: 1,
    smallPrint: 'Wedding events, Saturday accommodation, Sunday breakfast.',
  },
};

export const CHILD_PER_NIGHT_CENTS = 27_000;
export const CONSERVATION_PER_GUEST_CENTS = 10_000; // Dinokeng Game Reserve conservation fee, per guest

export const RSVP_DEADLINE = 'Monday, 28 September 2026';
export const PAYMENT_DEADLINE = 'Friday, 16 October 2026';

export function formatRand(cents: number): string {
  return 'R' + Math.round(cents / 100).toLocaleString('en-ZA').replace(/,/g, ' ');
}

export type QuoteLine = { label: string; cents: number };

export function quote(input: { stay: StayOption; adults: number; children: number }): {
  lines: QuoteLine[];
  totalCents: number;
} {
  const opt = STAY_OPTIONS[input.stay];
  const adults = Math.max(0, input.adults);
  const children = Math.max(0, input.children);
  const adultTotal = adults * opt.adultCents;
  const childTotal = children * CHILD_PER_NIGHT_CENTS * opt.nights;
  const guests = adults + children;
  const conservation = guests * CONSERVATION_PER_GUEST_CENTS;

  const lines: QuoteLine[] = [
    { label: `${adults} adult${adults === 1 ? '' : 's'} × ${formatRand(opt.adultCents)}`, cents: adultTotal },
  ];
  if (children > 0) {
    lines.push({
      label: `${children} child${children === 1 ? '' : 'ren'} × ${formatRand(CHILD_PER_NIGHT_CENTS)} × ${opt.nights} night${opt.nights === 1 ? '' : 's'}`,
      cents: childTotal,
    });
  }
  lines.push({
    label: `Dinokeng conservation fee — R100 × ${guests} guest${guests === 1 ? '' : 's'} (to be confirmed)`,
    cents: conservation,
  });

  return { lines, totalCents: adultTotal + childTotal + conservation };
}

/** Accommodation payment — shown on The Weekend beside the prices and on RSVP. */
export const BANK_DETAILS = [
  { label: 'Bank', value: 'FNB/RMB' },
  { label: 'Account holder', value: 'Pieter Kruger' },
  { label: 'Account type', value: 'FNB Fusion Premier Account' },
  { label: 'Account number', value: '63051501724' },
  { label: 'Branch code', value: '250655' },
  { label: 'Reference', value: 'Initials & Surname' },
];

/** Gifts go to the same account under a different reference; always shown apart from the accommodation block. */
export const GIFT_DETAILS = [
  { label: 'Bank', value: 'FNB/RMB' },
  { label: 'Account holder', value: 'Pieter Kruger' },
  { label: 'Account number', value: '63051501724' },
  { label: 'Branch code', value: '250655' },
  { label: 'Reference', value: 'Gift - Initials + Surname' },
];
