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
      'Friday dinner, Friday accommodation, Saturday breakfast, wedding events, Saturday accommodation, Sunday breakfast, and a complimentary three-hour game drive with snacks.',
  },
  saturday: {
    label: 'Saturday Evening',
    priceLabel: 'R965 pp',
    adultCents: 96_500,
    nights: 1,
    smallPrint: 'Wedding events, Saturday accommodation, Sunday breakfast. The game drive is not included, but can be added for R450 per person.',
  },
};

export const CHILD_PER_NIGHT_CENTS = 27_000;
/**
 * The lodge's three-hour game drive, snacks included. Complimentary for
 * Friday & Saturday guests; Saturday-only guests can add it at this price.
 * Not part of the RSVP total — it is arranged separately.
 */
export const GAME_DRIVE_CENTS = 45_000;
/**
 * Dinokeng Game Reserve conservation fee. Normally charged per visitor at the
 * gate; for the wedding weekend it is a flat, discounted R100 per RSVP
 * household (one fee per RSVP, however many people or nights), paid to the
 * couple with the accommodation. It is a line in every attending quote and is
 * stored separately on the household (conservation_fee_cents) so the admin can
 * see it apart from the accommodation. Declines owe R0.
 *
 * Still to be confirmed with the reserve whether it is per household or per
 * vehicle; the couple has chosen per household. If that changes, the copy
 * below and the quote() line are the only places to touch.
 */
export const CONSERVATION_FEE_CENTS = 10_000;
export const CONSERVATION_FEE_LABEL = 'R100 per household';
/** One sentence used wherever the fee is mentioned so the story is the same everywhere. */
export const CONSERVATION_FEE_NOTE =
  'Dinokeng Game Reserve charges every visitor a conservation fee. For the wedding weekend it is a discounted flat R100 per household, whichever nights you stay, and it is added to your total so there is nothing to pay at the gate. Before you leave on Sunday, please have your gate slip stamped at reception.';

export const RSVP_DEADLINE = 'Monday, 28 September 2026';
export const PAYMENT_DEADLINE = 'Friday, 16 October 2026';

export function formatRand(cents: number): string {
  return 'R' + Math.round(cents / 100).toLocaleString('en-ZA').replace(/,/g, ' ');
}

export type QuoteLine = { label: string; cents: number };

export function quote(input: { stay: StayOption; adults: number; children: number }): {
  lines: QuoteLine[];
  accommodationCents: number;
  conservationFeeCents: number;
  totalCents: number;
} {
  const opt = STAY_OPTIONS[input.stay];
  const adults = Math.max(0, input.adults);
  const children = Math.max(0, input.children);
  const adultTotal = adults * opt.adultCents;
  const childTotal = children * CHILD_PER_NIGHT_CENTS * opt.nights;

  const lines: QuoteLine[] = [
    { label: `${adults} adult${adults === 1 ? '' : 's'} × ${formatRand(opt.adultCents)}`, cents: adultTotal },
  ];
  if (children > 0) {
    lines.push({
      label: `${children} child${children === 1 ? '' : 'ren'} × ${formatRand(CHILD_PER_NIGHT_CENTS)} × ${opt.nights} night${opt.nights === 1 ? '' : 's'}`,
      cents: childTotal,
    });
  }

  lines.push({ label: 'Dinokeng conservation fee, per household', cents: CONSERVATION_FEE_CENTS });

  const accommodationCents = adultTotal + childTotal;
  return {
    lines,
    accommodationCents,
    conservationFeeCents: CONSERVATION_FEE_CENTS,
    totalCents: accommodationCents + CONSERVATION_FEE_CENTS,
  };
}

/** Accommodation payment — shown on The Weekend beside the prices and on RSVP. Values marked copy get a copy button. */
export const BANK_DETAILS = [
  { label: 'Bank', value: 'FNB/RMB' },
  { label: 'Account holder', value: 'Pieter Kruger' },
  { label: 'Account type', value: 'FNB Fusion Premier Account' },
  { label: 'Account number', value: '63051501724', copy: true },
  { label: 'Branch code', value: '250655', copy: true },
  { label: 'Reference', value: 'Initials & Surname' },
];

/** Gifts go to the same account under a different reference; they live on their own page (/gifts), never beside the accommodation block. */
export const GIFT_DETAILS = [
  { label: 'Bank', value: 'FNB/RMB' },
  { label: 'Account holder', value: 'Pieter Kruger' },
  { label: 'Account number', value: '63051501724', copy: true },
  { label: 'Branch code', value: '250655', copy: true },
  { label: 'Reference', value: 'Gift - Initials + Surname' },
];

export type DetailRow = { label: string; value: string; copy?: boolean };
