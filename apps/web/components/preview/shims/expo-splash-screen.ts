// Web stand-in for expo-splash-screen in the preview: there is no splash screen on a web page.
export async function preventAutoHideAsync(): Promise<boolean> {
  return false;
}

export async function hideAsync(): Promise<boolean> {
  return false;
}
