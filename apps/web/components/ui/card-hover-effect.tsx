// Aceternity UI "Card Hover Effect" — https://ui.aceternity.com/components/card-hover-effect
// Added with `npx shadcn@latest add @aceternity/card-hover-effect` (see apps/web/components.json).
// A free Aceternity UI component, used under the Aceternity UI licence
// (https://ui.aceternity.com/licence): free for personal and commercial projects, not to be
// redistributed as a component library. It is not covered by nativecn's MIT licence.
// Local changes: "use client"; next/link; site colour tokens in light and dark; the highlight
// also follows keyboard focus, with a visible focus ring; the title is an <h3>.
"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const HoverEffect = ({
  items,
  className,
}: {
  items: { title: string; description: ReactNode; link: string }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, idx) => (
        <Link
          href={item.link}
          key={item.title}
          className="group relative block h-full w-full rounded-3xl p-2 focus-visible:outline-offset-0"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          onFocus={() => setHoveredIndex(idx)}
          onBlur={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full rounded-3xl bg-neutral-200 dark:bg-neutral-800/80"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>
          <Card>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => {
  return (
    <div
      className={cn(
        "relative z-20 h-full w-full overflow-hidden rounded-2xl border bg-background p-4 group-hover:border-neutral-400 dark:group-hover:border-neutral-600",
        className,
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const CardTitle = ({ className, children }: { className?: string; children: ReactNode }) => {
  return (
    <h3 className={cn("mt-4 font-bold tracking-wide text-foreground", className)}>{children}</h3>
  );
};

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <p
      className={cn("mt-6 text-sm leading-relaxed tracking-wide text-muted-foreground", className)}
    >
      {children}
    </p>
  );
};
