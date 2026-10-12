// Web stand-in for expo-haptics in the preview: a browser has no haptic engine, so every call is a
// no-op (the Components already ignore failures).
export enum ImpactFeedbackStyle {
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
  Soft = "soft",
  Rigid = "rigid",
}

export enum NotificationFeedbackType {
  Success = "success",
  Warning = "warning",
  Error = "error",
}

export async function selectionAsync(): Promise<void> {}
export async function impactAsync(): Promise<void> {}
export async function notificationAsync(): Promise<void> {}
