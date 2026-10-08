'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  LayoutDashboard,
  Mic,
  Plus,
  X,
} from 'lucide-react';
import {
  type AvailabilityOutput,
  type BookingRow,
  type BookingSource,
  type CalendarConfig,
  type CalendarConfigView,
  DEFAULT_DIALLING_COUNTRY,
  DIALLING_COUNTRIES,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  addDaysIso,
  weekdayOfIso,
  zonedParts,
  zonedTimeToUtc,
} from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { phone as formatPhone } from '@/lib/format';
import { useSession } from '@/components/providers';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Metric,
  MockNotice,
  Select,
  Spinner,
  Textarea,
  cn,
} from '@/components/composites';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * The centre's appointment book.
 *
 * Every date and time on this page is the *centre's* wall clock, not the
 * browser's. The week starts on the centre's Monday and a 09:00 booking sits
 * in the 09:00 row whether the supervisor looking at it is in Dubai or Cairo —
 * the alternative is a page where the same appointment moves an hour depending
 * on who opened it, which is how people get told the wrong time.
 *
 * Bookings arrive from three places — this page, the landing page and the
 * voice agent — and the source badge on each one is the point of the page as
 * much as the time is: it is how a centre sees the agent doing real work.
 */

const SOURCE_STYLE: Record<BookingSource, { label: string; className: string; icon: typeof Mic }> = {
  voice: { label: 'Voice agent', className: 'bg-ai-soft text-ai', icon: Mic },
  website: { label: 'Website', className: 'bg-brand-soft text-primary', icon: Globe },
  dashboard: { label: 'Dashboard', className: 'bg-muted text-muted-foreground', icon: LayoutDashboard },
};

const SLOT_LENGTHS = [15, 20, 30, 45, 60, 90, 120] as const;

const FULL_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarPage() {
  const { user } = useSession();
  // A platform operator reads but cannot write — the API refuses their writes
  // anyway, so offering the buttons would only offer a 403.
  const canWrite = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  const config = useQuery({
    queryKey: ['calendar', 'config'],
    queryFn: () => api.get<CalendarConfigView>('/calendar/config'),
  });
  const tz = config.data?.timezone ?? 'Asia/Dubai';
  const today = zonedParts(new Date(), tz).date;

  // Monday of the week on screen, as a YYYY-MM-DD in the centre's calendar.
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const monday = weekStart ?? mondayOf(today);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysIso(monday, i)), [monday]);

  const range = useMemo(
    () => ({
      from: zonedTimeToUtc(monday, '00:00', tz).toISOString(),
      to: zonedTimeToUtc(addDaysIso(monday, 7), '00:00', tz).toISOString(),
    }),
    [monday, tz],
  );

  const bookings = useQuery({
    queryKey: ['calendar', 'bookings', range.from, range.to],
    queryFn: () => api.get<BookingRow[]>(`/calendar/bookings${qs(range)}`),
    enabled: Boolean(config.data),
  });

  const [creating, setCreating] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const b of bookings.data ?? []) {
      const d = zonedParts(new Date(b.startsAt), tz).date;
      map.set(d, [...(map.get(d) ?? []), b]);
    }
    return map;
  }, [bookings.data, tz]);

  const stats = useMemo(() => {
    const rows = bookings.data ?? [];
    const live = rows.filter((b) => b.status === 'BOOKED');
    return {
      booked: live.length,
      voice: live.filter((b) => b.source === 'voice').length,
      website: live.filter((b) => b.source === 'website').length,
      cancelled: rows.length - live.length,
    };
  }, [bookings.data]);

  if (config.isLoading) return <Spinner label="Loading calendar…" />;
  if (config.isError) {
    return <p className="p-6 text-sm text-destructive">{(config.error as Error).message}</p>;
  }
  const cfg = config.data!.config;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <CalendarDays className="size-5 text-primary" aria-hidden /> Calendar
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Appointments booked here, on the website and by the voice agent. Times are in{' '}
            <span className="font-medium text-foreground">{tz}</span>.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden /> New booking
          </Button>
        )}
      </header>

      <div className="mb-4">
        <MockNotice>
          Bookings are held in this platform&rsquo;s own calendar — no Cal.com or Google calendar
          is connected. Slots, clashes and opening hours all behave as they will once one is.
        </MockNotice>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Booked this week" value={stats.booked} tone="brand" />
        <Metric label="By the voice agent" value={stats.voice} tone="ai" icon={<Mic className="size-4" />} />
        <Metric label="From the website" value={stats.website} icon={<Globe className="size-4" />} />
        <Metric label="Cancelled" value={stats.cancelled} tone={stats.cancelled ? 'warn' : 'default'} />
      </div>

      <Card
        title={weekTitle(days[0]!, days[6]!)}
        subtitle={`${cfg.openTime}–${cfg.closeTime} · ${cfg.slotMinutes}-minute slots`}
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous week"
              onClick={() => setWeekStart(addDaysIso(monday, -7))}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={monday === mondayOf(today)}
              onClick={() => setWeekStart(null)}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next week"
              onClick={() => setWeekStart(addDaysIso(monday, 7))}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        }
      >
        {bookings.isLoading ? (
          <Spinner label="Loading bookings…" />
        ) : bookings.isError ? (
          <p className="p-4 text-sm text-destructive">{(bookings.error as Error).message}</p>
        ) : (
          /*
           * Seven columns only once each can hold a name and a phone number
           * (the 2xl breakpoint, ~1536px), a stacked day list below that. Not a squeezed grid on a
           * laptop: a column narrower than a phone number is a grid nobody can
           * read, and a list of days reads fine at any width.
           */
          <div className="grid divide-y 2xl:grid-cols-7 2xl:divide-x 2xl:divide-y-0">
            {days.map((d) => (
              <DayColumn
                key={d}
                date={d}
                isToday={d === today}
                isPast={d < today}
                closed={!cfg.workingDays.includes(weekdayOfIso(d))}
                bookings={byDay.get(d) ?? []}
                tz={tz}
                canWrite={canWrite}
              />
            ))}
          </div>
        )}
      </Card>

      {canWrite && (
        <div className="mt-4 max-w-2xl">
          <HoursCard view={config.data!} />
        </div>
      )}

      <NewBookingDialog
        open={creating}
        onOpenChange={setCreating}
        tz={tz}
        today={today}
        config={cfg}
        onBooked={(startsAt) => setWeekStart(mondayOf(zonedParts(new Date(startsAt), tz).date))}
      />
    </div>
  );
}

/* ================================ week view =============================== */

function DayColumn({
  date,
  isToday,
  isPast,
  closed,
  bookings,
  tz,
  canWrite,
}: {
  date: string;
  isToday: boolean;
  isPast: boolean;
  closed: boolean;
  bookings: BookingRow[];
  tz: string;
  canWrite: boolean;
}) {
  const weekday = weekdayOfIso(date);
  const dayNum = Number(date.slice(8));
  return (
    <section
      aria-label={`${FULL_DAY[weekday]} ${dayNum}`}
      className={cn('min-w-0 2xl:min-h-[22rem]', isToday && 'bg-brand-soft/40')}
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'text-xs font-semibold tracking-wide uppercase',
              isToday ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {WEEKDAY_LABELS[weekday]}
          </span>
          <span
            className={cn(
              'tnum inline-flex size-6 items-center justify-center rounded-full text-sm font-semibold',
              isToday && 'bg-primary text-primary-foreground',
              isPast && !isToday && 'text-muted-foreground',
            )}
          >
            {dayNum}
          </span>
        </div>
        {closed ? (
          <span className="text-[11px] text-muted-foreground">Closed</span>
        ) : bookings.length > 0 ? (
          <span className="text-[11px] text-muted-foreground tnum">
            {bookings.filter((b) => b.status === 'BOOKED').length} booked
          </span>
        ) : null}
      </div>
      <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1">
        {bookings.length === 0 ? (
          <p className="text-xs text-muted-foreground/70 sm:col-span-2 lg:col-span-3 2xl:col-span-1">
            {closed ? '' : 'Nothing booked'}
          </p>
        ) : (
          bookings.map((b) => (
            <BookingCard key={b.id} booking={b} tz={tz} canWrite={canWrite && !isPast} />
          ))
        )}
      </div>
    </section>
  );
}

function BookingCard({ booking, tz, canWrite }: { booking: BookingRow; tz: string; canWrite: boolean }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const cancelled = booking.status === 'CANCELLED';
  const source = SOURCE_STYLE[booking.source] ?? SOURCE_STYLE.dashboard;
  const SourceIcon = source.icon;

  const cancel = useMutation({
    mutationFn: () => api.post<BookingRow>(`/calendar/bookings/${booking.id}/cancel`),
    onSuccess: () => {
      toast.success(`Cancelled ${booking.name}’s ${clockOf(booking.startsAt, tz)} appointment`);
      void qc.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (e) => toast.error((e as Error).message),
    onSettled: () => setConfirming(false),
  });

  return (
    <article
      className={cn(
        'min-w-0 rounded-lg border bg-card p-2.5 text-xs shadow-xs',
        cancelled && 'border-dashed bg-transparent opacity-60 shadow-none',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn('tnum font-semibold whitespace-nowrap text-foreground', cancelled && 'line-through')}
        >
          {clockOf(booking.startsAt, tz)}–{clockOf(booking.endsAt, tz)}
        </span>
        {cancelled ? (
          <Badge className="h-5 px-1.5 text-[10px]">Cancelled</Badge>
        ) : (
          // Icon-only in the seven-column week, where the label would push the
          // time onto two lines; the title keeps it discoverable on hover.
          <span title={`Booked via ${source.label.toLowerCase()}`}>
            <Badge className={cn('h-5 px-1.5 text-[10px]', source.className)}>
              <SourceIcon className="size-3" aria-hidden />
              <span className="2xl:sr-only">{source.label}</span>
            </Badge>
          </span>
        )}
      </div>
      <p className={cn('mt-1 truncate text-sm font-medium', cancelled && 'line-through')} title={booking.name}>
        {booking.name}
      </p>
      <a
        href={`tel:${booking.phoneE164}`}
        className="tnum block truncate text-muted-foreground hover:text-foreground hover:underline"
      >
        {formatPhone(booking.phoneE164)}
      </a>
      {booking.notes && (
        <p className="mt-1 line-clamp-2 text-muted-foreground/90" title={booking.notes}>
          {booking.notes}
        </p>
      )}
      {canWrite && !cancelled && (
        <div className="mt-2 flex items-center justify-end gap-1">
          {confirming ? (
            <>
              <span className="mr-auto text-[11px] text-muted-foreground">Cancel it?</span>
              <Button size="xs" variant="ghost" onClick={() => setConfirming(false)}>
                Keep
              </Button>
              <Button
                size="xs"
                variant="destructive"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? 'Cancelling…' : 'Yes, cancel'}
              </Button>
            </>
          ) : (
            <Button
              size="xs"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setConfirming(true)}
            >
              <X aria-hidden /> Cancel
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

/* =============================== new booking ============================== */

function NewBookingDialog({
  open,
  onOpenChange,
  tz,
  today,
  config,
  onBooked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tz: string;
  today: string;
  config: CalendarConfig;
  onBooked: (startsAt: string) => void;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState(() => nextWorkingDay(today, config, tz));
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(DEFAULT_DIALLING_COUNTRY);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Fresh form each time it opens: a half-typed booking from ten minutes ago
  // reappearing under a different caller's name is a mistake waiting to happen.
  useEffect(() => {
    if (!open) return;
    setDate(nextWorkingDay(today, config, tz));
    setSlot('');
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
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
      toast.success(`Booked ${row.name} for ${dayLabel(row.startsAt, tz)} at ${clockOf(row.startsAt, tz)}`);
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      onBooked(String(row.startsAt));
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
          <DialogDescription>Times are shown in {tz}, the centre&rsquo;s own timezone.</DialogDescription>
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

/* ================================== hours ================================= */

/**
 * Opening hours, as the calendar sees them.
 *
 * These are offered to every visitor and every caller the voice agent talks
 * to, so saving is explicit rather than on change — a half-edited closing time
 * should not be live for the seconds it takes to finish typing it.
 */
function HoursCard({ view }: { view: CalendarConfigView }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CalendarConfig>(view.config);
  useEffect(() => setDraft(view.config), [view.config]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(view.config);
  const invalid = draft.openTime >= draft.closeTime || draft.workingDays.length === 0;

  const save = useMutation({
    mutationFn: () => api.put<CalendarConfigView>('/calendar/config', draft),
    onSuccess: (v) => {
      qc.setQueryData(['calendar', 'config'], v);
      void qc.invalidateQueries({ queryKey: ['calendar', 'availability'] });
      toast.success('Opening hours saved');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleDay = (d: number) =>
    setDraft((c) => ({
      ...c,
      workingDays: c.workingDays.includes(d)
        ? c.workingDays.filter((x) => x !== d)
        : [...c.workingDays, d].sort((a, b) => a - b),
    }));

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden /> Hours
        </span>
      }
      subtitle="When appointments can be booked — on this page, the website and by the voice agent."
      contentClassName="p-4"
    >
      <div className="grid gap-4">
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Open on</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_ORDER.map((d) => {
              const on = draft.workingDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={cn(
                    'h-8 min-w-12 rounded-md border px-2.5 text-xs font-medium transition',
                    on
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {WEEKDAY_LABELS[d]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="hrs-open">Opens</Label>
            <Input
              id="hrs-open"
              type="time"
              step={300}
              value={draft.openTime}
              onChange={(e) => setDraft((c) => ({ ...c, openTime: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hrs-close">Closes</Label>
            <Input
              id="hrs-close"
              type="time"
              step={300}
              value={draft.closeTime}
              onChange={(e) => setDraft((c) => ({ ...c, closeTime: e.target.value }))}
            />
          </div>
          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label htmlFor="hrs-slot">Appointment length</Label>
            <Select
              id="hrs-slot"
              value={draft.slotMinutes}
              onChange={(e) => setDraft((c) => ({ ...c, slotMinutes: Number(e.target.value) }))}
            >
              {SLOT_LENGTHS.map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} minutes` : m === 60 ? '1 hour' : `${m / 60} hours`}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {invalid && (
          <p className="text-xs text-destructive">
            {draft.workingDays.length === 0
              ? 'Pick at least one day, or nobody can book anything.'
              : 'Closing time must be after opening time.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Existing bookings are kept if they fall outside new hours.
          </p>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <Button variant="ghost" onClick={() => setDraft(view.config)}>
                Reset
              </Button>
            )}
            <Button disabled={!dirty || invalid || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save hours'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ================================= helpers ================================ */

function mondayOf(date: string): string {
  return addDaysIso(date, -((weekdayOfIso(date) + 6) % 7));
}

/**
 * Today if the centre is open and has time left, else the next open day — so
 * the form never opens on a day whose only answer is "nothing left".
 */
function nextWorkingDay(today: string, config: CalendarConfig, tz: string): string {
  const pastClosing = zonedParts(new Date(), tz).time >= config.closeTime;
  for (let i = pastClosing ? 1 : 0; i < 8; i += 1) {
    const d = addDaysIso(today, i);
    if (config.workingDays.includes(weekdayOfIso(d))) return d;
  }
  return today;
}

function clockOf(at: Date | string, tz: string): string {
  return zonedParts(new Date(at), tz).time;
}

function dayLabel(at: Date | string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: tz,
  }).format(new Date(at));
}

/** "12 – 18 October 2026", or "28 September – 4 October 2026" across months. */
function weekTitle(first: string, last: string): string {
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  return sameMonth
    ? `${Number(first.slice(8))} – ${fmt(last, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `${fmt(first, { day: 'numeric', month: 'long' })} – ${fmt(last, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}
