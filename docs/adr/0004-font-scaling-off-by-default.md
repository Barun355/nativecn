# System font scaling is off by default

React Native scales text with the OS font-size setting by default, and Expo's guidance says never to turn that off app-wide. nativecn turns it off by default and instead adapts Tokens (type included) itself, using a Scale measured against a 390pt baseline phone. That keeps Components looking as designed across devices and user display settings.

## Consequences

This works against users who enlarge text for readability, and it can draw App Store / Play accessibility scrutiny. The choice must stay a single, obvious switch in the Theme so an app can turn system scaling back on.
