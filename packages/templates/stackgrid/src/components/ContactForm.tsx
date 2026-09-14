"use client";

import { useState } from "react";
import { SubmitButton } from "../components/Button";
import { contact } from "../defaults";
import { useContent } from "../context";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * The contact form.
 *
 * The original posts to Framer's own form backend, which we cannot use,
 * so this posts to /api/contact. That route validates and records the
 * enquiry but has no mail provider wired up yet — see the TODO there
 * before relying on this in production.
 */
export default function ContactForm() {
  const { contact } = useContent();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Mirror the live form's requirements: name, a valid email, message.
    const next: Record<string, string> = {};
    if (!String(data.get("firstName") ?? "").trim())
      next.firstName = "Please enter your first name.";
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Please enter a valid email address.";
    if (!String(data.get("message") ?? "").trim())
      next.message = "Please tell us what you need.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const fieldClass =
    "sg-hair h-[42px] w-full bg-[var(--sg-white)] px-3 text-[14px] text-[var(--sg-text)] placeholder:text-[var(--sg-icon)]";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="sg-hair flex flex-col gap-5 p-7"
      style={{ background: "var(--sg-bg)" }}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {contact.fields.map((field) => (
          <div
            key={field.name}
            className={`flex flex-col gap-2 ${field.half ? "" : "sm:col-span-2"}`}
          >
            <label
              htmlFor={field.name}
              className="text-[13px] text-[var(--sg-text-label)]"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              autoComplete={autoCompleteFor(field.name)}
              aria-invalid={errors[field.name] ? true : undefined}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              className={fieldClass}
            />
            {errors[field.name] && (
              <p id={`${field.name}-error`} className="text-[13px] text-[#b3261e]">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={contact.messageField.name}
          className="text-[13px] text-[var(--sg-text-label)]"
        >
          {contact.messageField.label}
        </label>
        <textarea
          id={contact.messageField.name}
          name={contact.messageField.name}
          rows={6}
          placeholder={contact.messageField.placeholder}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className="sg-hair w-full resize-y bg-[var(--sg-white)] p-3 text-[14px] text-[var(--sg-text)] placeholder:text-[var(--sg-icon)]"
        />
        {errors.message && (
          <p id="message-error" className="text-[13px] text-[#b3261e]">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : contact.submitLabel}
        </SubmitButton>

        {/* Announced rather than merely shown, so the outcome reaches
            screen-reader users too. */}
        <p role="status" aria-live="polite" className="sg-small">
          {status === "sent" && "Thanks — an engineering lead will be in touch."}
          {status === "error" && "Something went wrong. Please email us instead."}
        </p>
      </div>
    </form>
  );
}

function autoCompleteFor(name: string) {
  switch (name) {
    case "firstName":
      return "given-name";
    case "lastName":
      return "family-name";
    case "email":
      return "email";
    case "phone":
      return "tel";
    default:
      return "off";
  }
}
