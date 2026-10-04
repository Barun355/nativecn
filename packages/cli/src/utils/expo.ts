import fs from "node:fs";
import path from "node:path";

export const MIN_EXPO_SDK = 57;
export const SDK_MESSAGE =
  "nativecn supports Expo SDK 57 and newer; SDK <57 is not supported. Upgrade with `npx expo install expo@latest --fix`.";

export class ExpoCheckError extends Error {}

type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export function readPackageJson(cwd: string): PackageJson | null {
  const file = path.join(cwd, "package.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as PackageJson;
}

/** The Expo SDK major: the installed expo version if present, else the range in package.json. */
export function expoSdkMajor(cwd: string, pkg: PackageJson): number | null {
  const installed = path.join(cwd, "node_modules", "expo", "package.json");
  if (fs.existsSync(installed)) {
    const version = (JSON.parse(fs.readFileSync(installed, "utf8")) as { version?: string })
      .version;
    const major = Number(/^(\d+)/.exec(version ?? "")?.[1]);
    if (major) return major;
  }
  const range = pkg.dependencies?.expo ?? pkg.devDependencies?.expo;
  if (!range) return null;
  const major = /(\d+)/.exec(range)?.[1];
  return major ? Number(major) : null;
}

/**
 * Step 0 of init (#16): an Expo app on SDK 57 or newer with Expo Router. Bare React Native and
 * older SDKs are not supported.
 */
export function checkExpoApp(cwd: string): { sdk: number } {
  const pkg = readPackageJson(cwd);
  if (!pkg) throw new ExpoCheckError(`No package.json in ${cwd}. ${SDK_MESSAGE}`);
  const deps = { ...pkg.devDependencies, ...pkg.dependencies };
  if (!deps.expo)
    throw new ExpoCheckError(
      `This is not an Expo app (no "expo" dependency); bare React Native is not supported. ${SDK_MESSAGE}`,
    );
  const sdk = expoSdkMajor(cwd, pkg);
  if (sdk === null || sdk < MIN_EXPO_SDK) throw new ExpoCheckError(SDK_MESSAGE);
  if (!deps["expo-router"])
    throw new ExpoCheckError(
      `nativecn needs Expo Router (no "expo-router" dependency found). ${SDK_MESSAGE}`,
    );
  return { sdk };
}

/** Files from Expo's default template that overlap with nativecn's Theme (#15). */
const EXPO_THEME_FILES = [
  "constants/theme.ts",
  "constants/Colors.ts",
  "hooks/use-theme.ts",
  "hooks/use-color-scheme.ts",
  "hooks/use-color-scheme.web.ts",
  "hooks/useColorScheme.ts",
  "hooks/useColorScheme.web.ts",
  "hooks/use-theme-color.ts",
  "hooks/useThemeColor.ts",
  "components/themed-text.tsx",
  "components/themed-view.tsx",
  "components/ThemedText.tsx",
  "components/ThemedView.tsx",
  "global.css",
];

export function overlappingThemeFiles(cwd: string): string[] {
  return ["src/", ""].flatMap((prefix) =>
    EXPO_THEME_FILES.map((f) => prefix + f).filter((f) => fs.existsSync(path.join(cwd, f))),
  );
}
