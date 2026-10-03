# Design System

The Components, Theme and Blocks that nativecn distributes and users copy into their apps, where the user owns and edits them freely.

## Language

### Components

**Component**:
A single reusable UI source file (e.g. Button, Text) copied into the user's app, which the user then owns and edits freely.
_Avoid_: Widget, element, primitive (when meaning the distributed unit)

**Variant**:
A named visual intent of a Component, selected by prop (e.g. `variant="primary"`). Unqualified, "Variant" always means this.
_Avoid_: Type, kind, style

**Size**:
A named dimension step of a Component (`sm`, `md`, `lg`) that maps only to Tokens.

**State**:
A runtime condition of a Component that changes its appearance: pressed, disabled, loading, and so on.

**Text**:
The single typographic Component; typographic roles are its Variants.
_Avoid_: Typography, ThemedText, Heading (as separate components)

**Icon**:
The single Component through which every glyph is drawn, rendering the same Lucide glyphs on iOS and Android.

**Container**:
The Component that wraps a Screen's content (safe area, scrolling, keyboard avoidance, edge padding).
_Avoid_: Screen, Layout, Page, Wrapper

**Primitive**:
Behaviour and accessibility foundation (focus, overlay, gesture, positioning) that nativecn writes itself and that Components are built on; nativecn never delegates it to a native control or third-party headless library.
_Avoid_: Headless component

### Theme

**Theme**:
The single source of truth for all Tokens in a user's app.
_Avoid_: Styles, design file, palette (a palette is only the colour part)

**Token**:
A named visual value (colour, spacing, radius, type step, shadow, motion) that lives in the Theme; Components read Tokens and never hardcode literals.
_Avoid_: Variable, constant

**Preset**:
A named set of Colour Role values distributed as a Registry Item. Exactly one is installed in an app at a time, and switching replaces it.
_Avoid_: Theme (when meaning the preset), skin, palette

**Scheme**:
Whether the light or dark Colour Role values are in use: following the system, or forced by the user and persisted.
_Avoid_: Mode, appearance, theme (when meaning light/dark)

**Colour Role**:
A named colour Token with a fixed purpose (e.g. `primary`, `muted`, `destructive`), defined once for light and once for dark; most come paired with a `…Foreground` role for content drawn on top of them.
_Avoid_: Colour name, palette entry, swatch

**Scale**:
The factor by which Tokens are adapted to the current device: the screen's shorter side measured against a 390pt baseline phone, clamped to 0.85–1.25 and kept live as the window changes.
_Avoid_: Responsive, zoom

### Blocks

**Block**:
A pre-designed Screen (e.g. sign-in) that a user or agent installs, renames and uses directly.
_Avoid_: Template, screen template, page

**Block Variant**:
One of several differently designed Blocks for the same purpose (`sign-in-01` … `sign-in-04`), each a separate Registry Item. Always qualified, to keep it distinct from a Component's Variant.
_Avoid_: Variation, version, theme
