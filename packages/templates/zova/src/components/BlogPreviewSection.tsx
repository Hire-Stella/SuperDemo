"use client";

import Link from "next/link";

import { blogHeading, blogPosts, blogSubhead } from "../defaults";
import { formatDate } from "../utils";
import { useContent } from "../context";

export function BlogPreviewSection() {
  const { blogHeading, blogPosts, blogSubhead } = useContent();
  const recentPosts = [...blogPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{blogHeading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zv-muted">{blogSubhead}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 px-6 sm:grid-cols-3">
        {recentPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-3xl border border-zv-line bg-zv-card p-6 transition-colors hover:bg-zv-card-2"
          >
            <p className="text-xs font-medium text-zv-muted">
              {formatDate(post.date)} · {post.readTime}
            </p>
            <p className="zv-heading mt-3 text-lg text-zv-ink">{post.title}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zv-muted">{post.dek}</p>
            <span className="mt-5 text-sm font-semibold text-zv-ink underline-offset-4 group-hover:underline">
              Read more →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/blog" className="zv-btn-outline inline-flex items-center justify-center px-6 py-3 text-sm font-semibold">
          View all posts
        </Link>
      </div>
    </section>
  );
}
