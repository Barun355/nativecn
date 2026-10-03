# Plain StyleSheet and a TS token theme, not Tailwind

Every other "shadcn for React Native" library (react-native-reusables, gluestack-ui, HeroUI Native) styles components with Tailwind through NativeWind or Uniwind. nativecn deliberately uses plain React Native `StyleSheet` plus a TypeScript token Theme, structured per Expo's design-system conventions. Customisation happens through props (Variant, Size, State, a `style` prop merged last) and by editing the copied source, not through `className`.

The reasons: no build-time CSS pipeline, no Metro/Babel transform, a lighter dependency tree and faster builds, and code that is plain React Native, which any developer or agent can read without knowing a styling DSL.

## Consequences

- shadcn's registry `cssVars` and `tailwind` fields are unused. Themes ship as TS files.
- Developers coming from shadcn/web lose `className` ergonomics. This is also the main way nativecn differs from its competitors.
