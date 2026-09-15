import Link from "next/link";

export default function NotFoundContent() {
  return (
    <section className="bg-surface px-6 py-32 text-center">
      <h1 className="text-7xl font-bold text-black sm:text-8xl">404</h1>
      <p className="mx-auto mt-6 max-w-md text-black/60">
        Sorry, the page you&rsquo;re looking for couldn&rsquo;t be found.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
      >
        Return Home
      </Link>
    </section>
  );
}
