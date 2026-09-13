import { z } from 'zod';

/**
 * Shared between the RSVP form (client) and /api/rsvp (server).
 * Two shapes: attending (full household + stay details) or declining (just who + a note).
 */
const base = {
  household_name: z.string().trim().min(2, 'Please tell us who you are').max(120),
  email: z.email('Please enter a valid email').trim().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  // Honeypot — real users never fill this in. Accepted by the schema so a bot
  // gets a silent 200 from /api/rsvp rather than a validation error telling it why.
  website: z.string().max(200).optional(),
};

export const attendingSchema = z.object({
  ...base,
  attending: z.literal(true),
  guests: z
    .array(z.string().trim().min(1, 'Please enter each guest’s name').max(120))
    .min(1, 'Please add at least one guest')
    .max(10),
  stay: z.enum(['friday_saturday', 'saturday']),
  children: z.number().int().min(0).max(10),
  dietary: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const decliningSchema = z.object({
  ...base,
  attending: z.literal(false),
});

export const rsvpSchema = z.discriminatedUnion('attending', [attendingSchema, decliningSchema]);

export type RsvpInput = z.infer<typeof rsvpSchema>;
