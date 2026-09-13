import { z } from 'zod';

/** Shared between the RSVP form (client) and /api/rsvp (server). */
export const rsvpSchema = z.object({
  household_name: z.string().trim().min(2, 'Please tell us who you are').max(120),
  email: z.email('Please enter a valid email').trim().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  invite_code: z.string().trim().max(40).optional().or(z.literal('')),
  attending: z.boolean(),
  guests: z
    .array(
      z.object({
        full_name: z.string().trim().min(1, 'Name is required').max(120),
        is_child: z.boolean().default(false),
        dietary: z.string().trim().max(300).optional().or(z.literal('')),
      }),
    )
    .max(10),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  // Honeypot — real users never fill this in.
  website: z.string().max(0).optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
