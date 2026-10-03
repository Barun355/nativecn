# Store data by sensitivity: AsyncStorage for preferences, SecureStore for secrets

Everything nativecn ships (Components, Blocks, the Starter, Skills and Rules) follows one rule for on-device storage. AsyncStorage holds only non-sensitive data whose loss or exposure is harmless, such as appearance settings, dismissed hints or cached UI state. Anything sensitive, such as auth tokens, session or refresh tokens, credentials or personal data, goes in `expo-secure-store`, which is backed by the iOS Keychain and Android Keystore.

AsyncStorage is unencrypted and readable from device backups and on rooted devices. Because agents copy whatever patterns the library demonstrates, the boundary has to be explicit and enforced in the Rules.

## Consequences
- Auth Blocks (sign-in, sign-up) that store a session must use `expo-secure-store`, never AsyncStorage.
- `AGENTS.md` carries this rule so that agents building on nativecn follow it in user code too.
- SecureStore values are small, size-limited strings, so large non-sensitive caches still belong in AsyncStorage (or a database).
