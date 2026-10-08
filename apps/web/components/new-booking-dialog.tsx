'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  type AvailabilityOutput,
  type BookingRow,
  type CalendarConfig,
  DEFAULT_DIALLING_COUNTRY,
  DIALLING_COUNTRIES,
  addDaysIso,
  countryForE164,
  weekdayOfIso,
  zonedParts,
} from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { Button, Input, Label, Select, Textarea } from '@/components/composites';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Booking an appointment in the centre's built-in calendar.
 *
 * Shared by the Calendar page and a conversation's page — the second opens it
 * already filled in with the caller, so a viewing agreed on a call is booked
 * without retyping who it was.
 */

const FULL_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface BookingPrefill {
  name?: string | null;
  phoneE164?: string | null;
  email?: string | null;
  notes?: string | null;
}

/** "+971553475748" → the picker's country and the digits after its code. */
function splitE164(e164: string | null | undefined): { country: string; national: string } | null {
  const country = countryForE164(e164);
  if (!country || !e164) return null;
  return { country: country.code, national: e164.slice(1 + country.dial.length) };
}

export function NewBookingDialog({
  open,
  onOpenChange,
  tz,
  today,
  config,
  onBooked,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tz: string;
  today: string;
  config: CalendarConfig;
  onBooked?: (startsAt: string) => void;
  /** Who the booking is for, when opened from a conversation. Still editable. */
  prefill?: BookingPrefill;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState(() => nextWorkingDay(today, config, tz));
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(DEFAULT_DIALLING_COUNTRY);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Read when the form opens, not on every render: callers pass a fresh object
  // each time, and resetting on that would wipe whatever was being typed.
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  // Fresh form each time it opens: a half-typed booking from ten minutes ago
  // reappearing under a different caller's name is a mistake waiting to happen.
  useEffect(() => {
    if (!open) return;
    setDate(nextWorkingDay(today, config, tz));
    setSlot('');
    const prefill = prefillRef.current;
    const fromCall = splitE164(prefill?.phoneE164);
    setName(prefill?.name ?? '');
    setPhone(fromCall?.national ?? '');
    setCountry(fromCall?.country ?? DEFAULT_DIALLING_COUNTRY);
    setEmail(prefill?.email ?? '');
    setNotes(prefill?.notes?.slice(0, 600) ?? '');
  }, [open, today, config, tz]);

  const availability = useQuery({
    queryKey: ['calendar', 'availability', date],
    queryFn: () => api.get<AvailabilityOutput>(`/calendar/availability${qs({ date })}`),
    enabled: open && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });
  const slots = availability.data?.slots ?? [];

  // Pick the first free time whenever the list changes and the old pick is gone.
  useEffect(() => {
    if (slots.length === 0) setSlot('');
    else if (!slots.some((s) => s.startsAt === slot)) setSlot(slots[0]!.startsAt);
  }, [slots, slot]);

  const create = useMutation({
    mutationFn: () =>
      api.post<BookingRow>('/calendar/bookings', {
        name,
        phone,
        country,
        email: email || undefined,
        startsAt: slot,
        notes: notes || undefined,
      }),
    onSuccess: (row) => {
      toast.success(
        `Booked ${row.name} for ${dayLabel(row.startsAt, tz)} at ${clockOf(row.startsAt, tz)}`,
      );
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      onBooked?.(String(row.startsAt));
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error((e as Error).message);
      // Most likely someone else took it a moment ago — show what is left.
      void availability.refetch();
    },
  });

  const closed = !config.workingDays.includes(weekdayOfIso(date || today));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Times are shown in {tz}, the centre&rsquo;s own timezone.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bk-date">Date</Label>
              <Input
                id="bk-date"
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bk-slot">Time</Label>
              <Select
                id="bk-slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                disabled={availability.isFetching || slots.length === 0}
                required
              >
                {availability.isFetching ? (
                  <option value="">Loading…</option>
                ) : slots.length === 0 ? (
                  <option value="">{closed ? 'Closed' : 'Fully booked'}</option>
                ) : (
                  slots.map((s) => (
                    <option key={s.startsAt} value={s.startsAt}>
                      {s.label}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </div>
          {!availability.isFetching && slots.length === 0 && date && (
            <p className="-mt-1 text-[11px] text-muted-foreground">
              {closed
                ? `The centre is closed on ${FULL_DAY[weekdayOfIso(date)]}s.`
                : 'No free times left on this day — try another.'}
            </p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="bk-name">Name</Label>
            <Input
              id="bk-name"
              autoComplete="off"
              placeholder="Who is coming in"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bk-phone">Phone</Label>
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <Select
                aria-label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {DIALLING_COUNTRIES.map((c) => (
                  <option key={`${c.code}-${c.dial}`} value={c.code}>
                    {c.flag} +{c.dial}
                  </option>
                ))}
              </Select>
              <Input
                id="bk-phone"
                inputMode="tel"
                placeholder="50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bk-email">
              Email <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="bk-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bk-notes">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="bk-notes"
              rows={2}
              placeholder="What it is about"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={!slot || !name || !phone || create.isPending}>
              {create.isPending ? 'Booking…' : 'Book'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ================================= helpers ================================ */

/**
 * Today if the centre is open and has time left, else the next open day — so
 * the form never opens on a day whose only answer is "nothing left".
 */
export function nextWorkingDay(today: string, config: CalendarConfig, tz: string): string {
  const pastClosing = zonedParts(new Date(), tz).time >= config.closeTime;
  for (let i = pastClosing ? 1 : 0; i < 8; i += 1) {
    const d = addDaysIso(today, i);
    if (config.workingDays.includes(weekdayOfIso(d))) return d;
  }
  return today;
}

export function clockOf(at: Date | string, tz: string): string {
  return zonedParts(new Date(at), tz).time;
}

export function dayLabel(at: Date | string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: tz,
  }).format(new Date(at));
}
