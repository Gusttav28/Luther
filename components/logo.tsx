import Image from "next/image";
import Link from "next/link";

const SIZES = {
  sm: { box: "h-9 w-9", px: 36 },
  md: { box: "h-12 w-12", px: 48 },
  lg: { box: "h-16 w-16", px: 64 },
} as const;

export function LutherLogo({
  size = "md",
  href = "/",
  priority = false,
}: {
  size?: keyof typeof SIZES;
  href?: string | null;
  priority?: boolean;
}) {
  const { box, px } = SIZES[size];
  const mark = (
    <span
      className={`relative inline-flex ${box} shrink-0 overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-black/15 dark:ring-white/25`}
    >
      <Image
        src="/luther-lion.png"
        alt="Luther lion mark"
        width={px}
        height={px}
        className="h-full w-full object-cover"
        priority={priority}
        unoptimized
      />
    </span>
  );

  if (!href) return mark;

  return (
    <Link
      href={href}
      aria-label="Luther Overview"
      className="inline-flex rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950"
    >
      {mark}
    </Link>
  );
}
