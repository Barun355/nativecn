# A Preset is chosen once and baked into the source at install time

A nativecn Preset (Style, Base Colour, Accent Colour, Radius, Body Font, Heading Font) is chosen once, at `create` or `init`, and is fixed for the life of the project. It is stored in the project's `components.json`.

- **Colours, radius and fonts** go into the user's `theme/` files.
- **The Style** is baked into each Component's source. Our repo holds one base per Component with named style slots plus one slot-fill file per Style, and the Registry build produces a separate copy of every item per Style (`/r/styles/<style>/<item>.json`). `add` fetches the copy matching the project's Style.
- **There is no `apply` command and no runtime Style switching.** Users may still hand-edit their copied files.

We rejected runtime Component Tokens, where one shared Button reads `t.componentTokens.button.radius` and Styles are swappable. Its indirection makes every Component harder to read and edit, and it only pays off if Styles can change, which we ruled out. Baking in the Style matches shadcn's model and leaves each user with plain, literal code.

## Consequences
- Every Style multiplies the design and device-QA work for every Component, so 0.1 ships only Vega and Nova. Each further Style is one new slot-fill file and its own small release.
- The Registry and the CLI must be Style-aware from day one.
