---
"ui": patch
---

Add the drawer Blocks `drawer-01` (profile header + grouped sections), `drawer-02` (SaaS workspace) and `drawer-03` (cover header), per the Drawer Block designs (#24). Each is a `registry:block` whose one file, `components/drawer-0X/index.tsx`, installs into `{components}/drawer-0X/index.tsx` and exports `Drawer01`/`Drawer02`/`Drawer03` for `<Drawer drawerContent={(props) => <Drawer01 {...props} />} />` from `expo-router/drawer`. They are built only from the drawer Components, Avatar, Badge, Button, Icon, Separator, Text and the Pressable Primitive, with no new Style Slots. Registry `meta` carries `kind`, `component`, `difference`, `docs` and `keywords`.
