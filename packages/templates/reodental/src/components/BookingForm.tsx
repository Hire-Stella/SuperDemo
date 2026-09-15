"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BOOKING_SERVICE_OPTIONS } from "../defaults";
import { useContent } from "../context";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  service: BOOKING_SERVICE_OPTIONS[0],
  date: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Real controlled client component with basic validation. There is no
 * backend wired up yet — on submit this only shows a placeholder success
 * state. See NOTES.md: this needs to be connected to a real submission
 * endpoint or email service before launch.
 */
export default function BookingForm() {
  const { BOOKING_SERVICE_OPTIONS } = useContent();
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.fullName.trim()) next.fullName = "Please enter your full name.";
    if (!values.phone.trim()) next.phone = "Please enter a phone number.";
    if (!values.email.trim()) {
      next.email = "Please enter an email address.";
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!values.date.trim()) next.date = "Please choose a preferred date.";
    return next;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      // No backend wired up yet — placeholder success state only.
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-border bg-white p-10 text-center"
      >
        <p className="text-2xl font-medium text-ink">Request received.</p>
        <p className="mt-3 text-sm text-muted">
          Thanks, {values.fullName.split(" ")[0] || "there"} — we&rsquo;ll get
          back to you within one business day to confirm your visit.
        </p>
        <p className="mt-6 text-xs text-muted/70">
          (This is a placeholder confirmation — no request was actually sent.
          Connect this form to a real booking backend before launch.)
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(initialState);
            setSubmitted(false);
          }}
          className="mt-6 text-sm font-medium text-ink underline underline-offset-4"
        >
          Book another appointment
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-5 rounded-3xl border border-border bg-white p-8 md:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" error={errors.fullName}>
          <input
            type="text"
            value={values.fullName}
            onChange={handleChange("fullName")}
            className={inputClass(!!errors.fullName)}
            autoComplete="name"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            type="tel"
            value={values.phone}
            onChange={handleChange("phone")}
            className={inputClass(!!errors.phone)}
            autoComplete="tel"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={values.email}
            onChange={handleChange("email")}
            className={inputClass(!!errors.email)}
            autoComplete="email"
          />
        </Field>
        <Field label="Service">
          <select
            value={values.service}
            onChange={handleChange("service")}
            className={inputClass(false)}
          >
            {BOOKING_SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Preferred Date" error={errors.date}>
        <input
          type="date"
          value={values.date}
          onChange={handleChange("date")}
          className={inputClass(!!errors.date)}
        />
      </Field>

      <Field label="Message">
        <textarea
          value={values.message}
          onChange={handleChange("message")}
          rows={4}
          className={inputClass(false)}
        />
      </Field>

      <AnimatePresence>
        {Object.keys(errors).length > 0 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-600"
          >
            Please fix the highlighted fields above.
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        className="mt-2 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-ink-soft sm:w-fit"
      >
        Book Appointment
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return `rounded-xl border ${
    hasError ? "border-red-400" : "border-border-strong"
  } bg-cream-soft px-4 py-2.5 text-sm text-ink outline-none focus:border-ink transition-colors`;
}
