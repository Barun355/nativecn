// The Starter's promo Screen (packages/cli/starter/src/app/index.tsx), which the preview's
// Starter tab renders. next.config.ts aliases this name to the file and resolves its user-app
// imports (lib/starter-preview). The file is type-checked as part of the Starter, with a user
// app's paths, so the website only declares what it uses.
declare module "nativecn-starter/screen" {
  import type { ComponentType } from "react";

  const StarterScreen: ComponentType;
  export default StarterScreen;
}
