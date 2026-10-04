---
"ui": patch
---

Add the Display Components: `Card` (CardHeader, CardTitle, CardDescription, CardContent, CardFooter; `onPress` makes the whole card pressable via the Pressable Primitive), `Separator` (`orientation`, `decorative`), `Badge` (`label`, Variants default/secondary/outline/destructive/success/warning), `Avatar` (`src` via expo-image with `fallback` initials, sizes sm/md/lg, `alt`) and `list` (ListSection, ListSectionHeader, ListSectionFooter, ListItem with `title`, `description`, `icon`, `trailing`, `chevron`, `destructive`, `onPress` and a `children` escape hatch; FlashList-safe). Adds the `card.header`, `card.title`, `card.pressed`, `avatar.sm`, `avatar.lg`, `list.title` and `list.pressed` Style Slots, Registry `meta` (props, variants, docs, keywords, examples) for each item, `<item>-demo` example items, and `expo-image` (~57.0.5).
