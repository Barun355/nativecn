// Every usage example and Screen Block the docs pages' preview can run (lib/docs-preview lists
// them), each behind its own dynamic import: a docs page downloads only its own item's code, on
// top of the shared react-native-web chunk. The Records are typed by those lists, so adding a
// name there without a loader here fails the typecheck.

import type { ComponentType } from "react";

import type { PreviewBlock, PreviewExample } from "@/lib/docs-preview";

type Loader = () => Promise<{ default: ComponentType }>;

/** A module's named export as the `default` React.lazy expects. */
const named =
  <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType): Loader =>
  () =>
    load().then((m) => ({ default: pick(m) }));

export const EXAMPLE_LOADERS: Record<PreviewExample, Loader> = {
  "alert-demo": () => import("@/registry/examples/alert-demo"),
  "avatar-demo": () => import("@/registry/examples/avatar-demo"),
  "badge-demo": () => import("@/registry/examples/badge-demo"),
  "button-demo": () => import("@/registry/examples/button-demo"),
  "card-demo": () => import("@/registry/examples/card-demo"),
  "checkbox-demo": () => import("@/registry/examples/checkbox-demo"),
  "chip-demo": () => import("@/registry/examples/chip-demo"),
  "container-demo": () => import("@/registry/examples/container-demo"),
  "empty-state-demo": () => import("@/registry/examples/empty-state-demo"),
  "form-field-demo": named(
    () => import("@/registry/examples/form-field-demo"),
    (m) => m.FormFieldDemo,
  ),
  "icon-demo": () => import("@/registry/examples/icon-demo"),
  "input-demo": named(
    () => import("@/registry/examples/input-demo"),
    (m) => m.InputDemo,
  ),
  "input-otp-demo": named(
    () => import("@/registry/examples/input-otp-demo"),
    (m) => m.InputOTPDemo,
  ),
  "label-demo": named(
    () => import("@/registry/examples/label-demo"),
    (m) => m.LabelDemo,
  ),
  "list-demo": () => import("@/registry/examples/list-demo"),
  "progress-demo": () => import("@/registry/examples/progress-demo"),
  "radio-group-demo": () => import("@/registry/examples/radio-group-demo"),
  "scheme-switcher-demo": () => import("@/registry/examples/scheme-switcher-demo"),
  "search-field-demo": named(
    () => import("@/registry/examples/search-field-demo"),
    (m) => m.SearchFieldDemo,
  ),
  "segmented-tabs-demo": () => import("@/registry/examples/segmented-tabs-demo"),
  "separator-demo": () => import("@/registry/examples/separator-demo"),
  "skeleton-demo": () => import("@/registry/examples/skeleton-demo"),
  "slider-demo": named(
    () => import("@/registry/examples/slider-demo"),
    (m) => m.SliderDemo,
  ),
  "spinner-demo": () => import("@/registry/examples/spinner-demo"),
  "switch-demo": () => import("@/registry/examples/switch-demo"),
  "text-demo": () => import("@/registry/examples/text-demo"),
  "textarea-demo": named(
    () => import("@/registry/examples/textarea-demo"),
    (m) => m.TextareaDemo,
  ),
  "toast-demo": () => import("@/registry/examples/toast-demo"),
};

/** Screen Blocks, rendered with no props: submitting validates, and does nothing else. */
export const BLOCK_LOADERS: Record<PreviewBlock, Loader> = {
  "sign-in-01": named(
    () => import("@/registry/screens/sign-in-01"),
    (m) => m.SignIn01,
  ),
  "sign-in-02": named(
    () => import("@/registry/screens/sign-in-02"),
    (m) => m.SignIn02,
  ),
  "sign-in-03": named(
    () => import("@/registry/screens/sign-in-03"),
    (m) => m.SignIn03,
  ),
  "sign-up-01": named(
    () => import("@/registry/screens/sign-up-01"),
    (m) => m.SignUp01,
  ),
  "sign-up-02": named(
    () => import("@/registry/screens/sign-up-02"),
    (m) => m.SignUp02,
  ),
  "sign-up-03": named(
    () => import("@/registry/screens/sign-up-03"),
    (m) => m.SignUp03,
  ),
};
