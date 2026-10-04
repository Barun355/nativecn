"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Makes every Motion animation inside (the landing page's Aceternity UI components) respect
 * prefers-reduced-motion: transform and layout animations are skipped, leaving only opacity fades.
 */
export function ReducedMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
