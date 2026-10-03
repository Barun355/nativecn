# Distribution

How Registry Items reach a user's Expo app: the Registry they are fetched from, nativecn-cli that installs them, and the parts of the user's app they land in.

## Language

### Registry

**Registry**:
The catalogue served from nativecn.dev from which Registry Items are fetched, in a shadcn-compatible format.

**Registry Item**:
One installable entry in the Registry (a Component, Theme or Block), including its files, dependencies, docs and usage examples.

### nativecn-cli

**nativecn-cli**:
The one package and command through which users create apps, run Init, and add Registry Items. It is the only published name.
_Avoid_: nativecn (as a package), @nativecn, create-nativecn

**Starter**:
nativecn's own base Expo app, created by `nativecn-cli create` the same way `create-expo-app` creates one (copy, install, set up). nativecn Components and Theme replace Expo's default themed components and colours.
_Avoid_: Template, boilerplate

**Init**:
Setting up nativecn in an existing Expo app.

**Config Plugin**:
An Expo `app.json` plugin that a Registry Item needs in order to work.
_Avoid_: Plugin (unqualified)

### The user's app

**Screen**:
An individual Expo Router route file in the user's app.
_Avoid_: Page, view

**Layout**:
An Expo Router `_layout.tsx` file that arranges the Screens beneath it.
_Avoid_: Container, wrapper
