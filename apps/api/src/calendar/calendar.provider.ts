import type { AvailabilityOutput, BookingRow, BookingSource } from '@superdemo/contracts';

/**
 * Where a centre's appointments actually live.
 *
 * Today that is always our own table (MockCalendarProvider). The interface
 * exists because the next step is a centre that already runs Cal.com and wants
 * its real calendar to be the one the voice agent books into — at which point
 * a CalcomCalendarProvider implements these three methods against their API
 * and nothing above it changes: not the controllers, not the public and voice
 * endpoints, not the web page.
 *
 * The choice is per centre (CalendarConfig.provider), not per deployment the
 * way TELEPHONY_DRIVER is, because one centre connecting its calendar says
 * nothing about the next one's.
 *
 * Every method is called inside the centre's tenant context — CalendarService
 * makes sure of that — and also takes the orgId explicitly, because a provider
 * that talks to an external API needs to know whose credentials to use and
 * should not have to fish it out of async-local storage to find out.
 */
export interface CalendarProvider {
  /** Free slots on one local date (YYYY-MM-DD, centre timezone). Never past ones. */
  availability(orgId: string, date: string): Promise<AvailabilityOutput>;

  /**
   * Book one slot. Throws BadRequest for a time the centre does not offer
   * (closed day, outside hours, off the slot grid, already past) and Conflict
   * for one somebody else already has — each with a message a person can act on.
   */
  book(orgId: string, input: ProviderBookInput): Promise<BookingRow>;

  /** Cancel by id. Idempotent: cancelling a cancelled booking returns it as-is. */
  cancel(orgId: string, id: string): Promise<BookingRow>;
}

/** What a provider needs to make a booking — already normalised by the service. */
export interface ProviderBookInput {
  name: string;
  phoneE164: string;
  email: string | null;
  startsAt: Date;
  notes: string | null;
  source: BookingSource;
  contactId: string | null;
}
