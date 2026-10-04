import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes. The Aceternity UI components in components/ui expect it at
 * `@/lib/utils` (the shadcn CLI's `utils` alias in apps/web/components.json).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
