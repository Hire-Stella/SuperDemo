import Image from "next/image";
import Link from "next/link";
import { RevealItem } from "../components/Reveal";

type DestinationCardProps = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  description?: string;
};

export default function DestinationCard({
  slug,
  name,
  tagline,
  image,
  description,
}: DestinationCardProps) {
  return (
    <RevealItem className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <Link href={`/destination/${slug}`} className="block">
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        </div>
        <div className="p-6">
          <h3 className="font-display text-xl text-[var(--fg)]">{name}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{tagline}</p>
          {description && <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>}
        </div>
      </Link>
    </RevealItem>
  );
}
