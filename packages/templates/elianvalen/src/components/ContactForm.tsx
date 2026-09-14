"use client";

import { useState } from "react";

import { contactPage, site } from "../defaults";
import { useContent } from "../context";

type Fields = { name: string; email: string; subject: string; message: string };

const EMPTY: Fields = { name: "", email: "", subject: "", message: "" };

/**
 * Static contact form: validated in the browser, then handed to the visitor's
 * mail client via a mailto: link. No backend, nothing is transmitted by us.
 */
export function ContactForm() {
  const { contactPage, site } = useContent();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [sent, setSent] = useState(false);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSent(false);
  };

  const validate = () => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email))
      next.email = "Please enter a valid email address.";
    if (fields.message.trim().length < 10)
      next.message = "Please add a little more detail (10 characters minimum).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const subject = fields.subject.trim() || `Enquiry from ${fields.name.trim()}`;
    const body = `${fields.message.trim()}\n\n—\n${fields.name.trim()}\n${fields.email.trim()}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const inputClass =
    "mt-2 w-full border border-line bg-white px-3 py-3 text-[14px] text-ink transition-colors placeholder:text-muted/60 focus:border-ink focus:outline-none";

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-[520px]">
      <h2 className="text-[22px] text-[#0b0b0b]">{contactPage.form.heading}</h2>
      <p className="ev-body mt-3 text-[14px]">{contactPage.form.blurb}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="text-[12px] tracking-[0.1em] text-muted uppercase">
            Name
          </label>
          <input
            id="cf-name"
            name="name"
            autoComplete="name"
            value={fields.name}
            onChange={set("name")}
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
          />
          {errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="cf-email" className="text-[12px] tracking-[0.1em] text-muted uppercase">
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={set("email")}
            aria-invalid={Boolean(errors.email)}
            className={inputClass}
          />
          {errors.email && <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="cf-subject" className="text-[12px] tracking-[0.1em] text-muted uppercase">
          Subject <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="cf-subject"
          name="subject"
          value={fields.subject}
          onChange={set("subject")}
          className={inputClass}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="cf-message" className="text-[12px] tracking-[0.1em] text-muted uppercase">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          value={fields.message}
          onChange={set("message")}
          aria-invalid={Boolean(errors.message)}
          className={`${inputClass} resize-y`}
        />
        {errors.message && <p className="mt-1 text-[12px] text-red-600">{errors.message}</p>}
      </div>

      <button
        type="submit"
        className="mt-7 w-full bg-ink py-4 text-[15px] text-white transition-opacity hover:opacity-85 sm:w-auto sm:px-12"
      >
        {contactPage.form.submit}
      </button>

      <p aria-live="polite" className="mt-4 min-h-[18px] text-[13px] text-muted">
        {sent && `Opening your mail app to send to ${site.email}.`}
      </p>
    </form>
  );
}
