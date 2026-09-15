"use client";

import Link from "next/link";
import { contactInfo } from "../defaults";
import { useContent } from "../context";

const columns = [
  {
    title: "Navigate",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/service", label: "Services" },
      { href: "/project", label: "Projects" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Details",
    links: [
      { href: "/service/intelligent-workflow-systems", label: "Service details" },
      { href: "/project/nova-brand-identity", label: "Project details" },
      { href: "/blog/building-smarter-workflows-with-ai-automation", label: "Blog details" },
      { href: "/contact", label: "Contact" },
      { href: "/404", label: "404" },
    ],
  },
];

export default function Footer() {
  const { contactInfo } = useContent();
  return (
    <footer className="bg-black text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="text-2xl font-semibold tracking-tight text-white">Synthetix Labs</span>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              We create AI-driven systems that help businesses automate workflows, scale faster,
              and grow smarter.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/60 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold text-white">Get in touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li>{contactInfo.footerPhone}</li>
              <li>{contactInfo.footerEmailInfo}</li>
              <li>{contactInfo.footerEmailSupport}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright &copy; {new Date().getFullYear()} Synthetix Labs. All rights reserved.</p>
          <p>Built with Next.js &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}
