// Aceternity UI "Bento Grid" — https://ui.aceternity.com/components/bento-grid
// Added with `npx shadcn@latest add @aceternity/bento-grid` (see apps/web/components.json).
// A free Aceternity UI component, used under the Aceternity UI licence
// (https://ui.aceternity.com/licence): free for personal and commercial projects, not to be
// redistributed as a component library. It is not covered by nativecn's MIT licence.
// Local changes: site colour tokens instead of fixed neutrals, auto-height rows (the copy is
// longer than a demo's), the hover nudge only under motion-safe, and the title as an <h3>.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div className={cn("mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3", className)}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between gap-4 rounded-xl border bg-background p-4 transition duration-200 hover:shadow-xl dark:hover:shadow-none",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 motion-safe:group-hover/bento:translate-x-2">
        {icon}
        <h3 className="mb-2 mt-2 font-sans font-bold text-foreground">{title}</h3>
        <div className="font-sans text-sm font-normal text-muted-foreground">{description}</div>
      </div>
    </div>
  );
};
