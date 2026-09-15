"use client";

import { useState } from "react";
import CtaArrowBadge from "../components/CtaArrowBadge";
import { GUEST_OPTIONS_CONTACT } from "../defaults";
import { useContent } from "../context";

type FormState = {
  firstName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  phone: string;
  guests: string;
  message: string;
};

const initialState: FormState = {
  firstName: "",
  email: "",
  checkIn: "",
  checkOut: "",
  phone: "",
  guests: GUEST_OPTIONS_CONTACT[0],
  message: "",
};

/**
 * Contact page form: real controlled component with basic validation.
 * No backend wired up -- shows a placeholder success state on submit
 * (see NOTES.md; needs a real backend before launch).
 */
export default function ContactForm() {
  const { GUEST_OPTIONS_CONTACT } = useContent();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    setForm(initialState);
  }

  if (submitted) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <h3 className="font-display text-2xl text-[var(--fg)]">Request received!</h3>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Thanks for reaching out — a member of our team will be in touch soon.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex items-center rounded-full bg-[var(--fg)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Send another request
          <CtaArrowBadge onDark />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:grid-cols-2"
    >
      <div className="flex flex-col gap-1">
        <input
          type="text"
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        {errors.firstName && <span className="text-xs text-red-600">{errors.firstName}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="email"
          placeholder="Mail Address"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--muted)]">
        Check In
        <input
          type="date"
          value={form.checkIn}
          onChange={(e) => update("checkIn", e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm text-[var(--fg)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--muted)]">
        Check Out
        <input
          type="date"
          value={form.checkOut}
          onChange={(e) => update("checkOut", e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm text-[var(--fg)]"
        />
      </label>
      <div className="flex flex-col gap-1">
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        {errors.phone && <span className="text-xs text-red-600">{errors.phone}</span>}
      </div>
      <select
        value={form.guests}
        onChange={(e) => update("guests", e.target.value)}
        className="rounded-xl border border-black/10 px-4 py-3 text-sm text-[var(--fg)]"
      >
        {GUEST_OPTIONS_CONTACT.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
        rows={4}
        className="rounded-xl border border-black/10 px-4 py-3 text-sm sm:col-span-2"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-[var(--fg)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 sm:col-span-2"
      >
        Submit Request
        <CtaArrowBadge onDark />
      </button>
    </form>
  );
}
