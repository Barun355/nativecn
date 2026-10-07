import { toast } from "@/registry/components/toast";

import { FAKE_LATENCY, callbackKind, callbackLabel, failsOnPurpose } from "../demo-callbacks";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * A demo handler for each of a Block's callback props: a fake server for submits and codes
 * (the Block shows its own loading, errors and success Toast), a fake provider for social sign-in,
 * and a Toast for links and buttons the Block hands to the app.
 */
export function demoHandlers(
  names: readonly string[],
): Record<string, (...args: unknown[]) => unknown> {
  return Object.fromEntries(
    names.map((name) => {
      const kind = callbackKind(name);
      if (kind === "press") {
        const handler = () =>
          toast.info(callbackLabel(name), { description: "Your app decides what this does." });
        return [name, handler];
      }
      const handler = async (...args: unknown[]) => {
        await wait(FAKE_LATENCY);
        if (failsOnPurpose(args)) {
          throw new Error('A demo error: values with "error", and the code 000000, always fail.');
        }
        if (kind === "social") {
          toast.success(`Continued with ${capitalise(String(args[0]))}`, {
            description: "A demo: nothing was sent.",
          });
        }
      };
      return [name, handler];
    }),
  );
}
