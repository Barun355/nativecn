# Visual QA device commands (the allowlist)

Use only these commands, in exactly these forms. They match the allow rules that `nativecn-cli init --qa-permissions` can write, so the user isn't prompted for each one. Anything else prompts and is out of scope unless the user asks.

Placeholders, read from `app.json`:
- `<scheme>`: the app's URL scheme. In Expo Go, replace `<scheme>://<route>` with Expo Go's URL, `exp://<host>:<port>/--/<route>` (the host and port Metro prints);
- `<package>`: `android.package` (`host.exp.exponent` for Expo Go);
- `<bundleId>`: `ios.bundleIdentifier` (`host.exp.Exponent` for Expo Go);
- `<route>`: the Expo Router path, e.g. `sign-in` or `settings/profile`;
- `<tmp>`: the OS temp folder; `<device>`: the device serial or Simulator id; `<timestamp>`, `<screen>`: for the file name.

## Android (adb)

**Exactly one device attached: leave out `-s`.** With several devices, add `-s <serial>` after `adb` (the user will be prompted). Never prefix a variable such as `ANDROID_SERIAL=…`.

| Purpose | Command |
|---|---|
| list devices | `adb devices -l` |
| open a Screen (dev app only) | `adb shell am start -a android.intent.action.VIEW -d <scheme>://<route> -p <package>` |
| read the element tree (find tap targets) | `adb exec-out uiautomator dump /dev/tty` |
| tap | `adb shell input tap <x> <y>` |
| swipe / scroll | `adb shell input swipe <x1> <y1> <x2> <y2> [ms]` |
| type | `adb shell input text <text>` (spaces as `%s`) |
| back | `adb shell input keyevent BACK` |
| dark / light | `adb shell cmd uimode night yes` · `adb shell cmd uimode night no` |
| tidy status bar | `adb shell settings put global sysui_demo_allowed 1`, then `adb shell am broadcast -a com.android.systemui.demo -e command enter`, `… -e command clock -e hhmm 0941`, `… -e command battery -e level 100 -e plugged false`, `… -e command notifications -e visible false` |
| leave demo mode | `adb shell am broadcast -a com.android.systemui.demo -e command exit` |

**Screenshot: save → pull → delete.** All three steps, every time. The delete is mandatory.

```sh
adb shell screencap -p /sdcard/nativecn-qa.png
adb pull /sdcard/nativecn-qa.png <tmp>/nativecn-qa/<device>/<timestamp>-<screen>.png
adb shell rm /sdcard/nativecn-qa.png
```

Never use `>` redirection (`exec-out screencap -p > file`), and never chain device commands with `;`, `&&`, `|`, `$()` or backticks inside `adb shell`.

## iOS Simulator (`xcrun simctl`)

Use `booted` instead of a Simulator id.

| Purpose | Command |
|---|---|
| list | `xcrun simctl list devices booted -j` |
| launch the dev app | `xcrun simctl launch booted <bundleId>` |
| open a Screen | `xcrun simctl openurl booted <scheme>://<route>` |
| screenshot (straight to the laptop) | `xcrun simctl io booted screenshot <tmp>/nativecn-qa/<device>/<timestamp>-<screen>.png` |
| dark / light | `xcrun simctl ui booted appearance dark` · `xcrun simctl ui booted appearance light` |
| tidy status bar | `xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100` |
| restore status bar | `xcrun simctl status_bar booted clear` |

There is no tap tool on iOS without extra software: move through flows with deep links, and read the code for the steps in between.

## Not allowed

Installing or uninstalling apps, clearing app data, `adb push`, `adb root`, `adb shell` commands not listed above, opening other apps or system settings, Maestro or any other automation tool. Ask the user if you think one is needed.
