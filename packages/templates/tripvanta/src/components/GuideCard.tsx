import Image from "next/image";
import { RevealItem } from "../components/Reveal";
import type { Guide } from "../defaults";

export default function GuideCard({ guide }: { guide: Guide }) {
  return (
    <RevealItem className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full">
        <Image src={guide.image} alt={guide.name} fill className="object-cover" sizes="112px" />
      </div>
      <h3 className="mt-4 font-display text-lg text-[var(--fg)]">{guide.name}</h3>
      <p className="mt-1 text-sm font-medium text-[var(--muted)]">{guide.role}</p>
      <p className="mt-3 text-sm text-[var(--muted)]">{guide.bio}</p>
    </RevealItem>
  );
}
