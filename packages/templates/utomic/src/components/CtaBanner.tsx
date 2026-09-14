import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="gradient-secondary relative overflow-hidden px-6 py-24 text-center text-white lg:py-32">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Build what scales beyond limits
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/80">
          Create faster workflows, smarter systems, and scalable AI experiences designed for
          long-term growth and improvement.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
        >
          Let&rsquo;s start today
        </Link>
      </div>
    </section>
  );
}
