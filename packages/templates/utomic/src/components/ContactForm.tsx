"use client";

import { useState, type FormEvent } from "react";

type FormState = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [sent, setSent] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: Partial<FormState> = {};
    if (!form.name.trim()) nextErrors.name = "Please enter your name.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) nextErrors.message = "Tell us a little about your project.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    const subject = encodeURIComponent(form.subject || "New project inquiry");
    const body = encodeURIComponent(
      `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:contact@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="sm:col-span-1">
        <label className="mb-2 block text-sm font-medium text-black/70">Name</label>
        <input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
          placeholder="Your name"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="sm:col-span-1">
        <label className="mb-2 block text-sm font-medium text-black/70">Phone number</label>
        <input
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
          placeholder="Your phone number"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="mb-2 block text-sm font-medium text-black/70">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
          placeholder="you@company.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="sm:col-span-1">
        <label className="mb-2 block text-sm font-medium text-black/70">Subject</label>
        <input
          value={form.subject}
          onChange={(event) => update("subject", event.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
          placeholder="What is this about?"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-2 block text-sm font-medium text-black/70">
          Tell us about your project
        </label>
        <textarea
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          rows={5}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-black/30 focus:outline-none"
          placeholder="Share a few details about your project..."
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Send a message
        </button>
        {sent && (
          <p className="mt-3 text-sm text-brand-plum">
            Your email client should now be open with your message ready to send.
          </p>
        )}
      </div>
    </form>
  );
}
