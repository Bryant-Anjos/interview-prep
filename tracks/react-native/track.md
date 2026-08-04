# Track: React Native

## Scope

**Areas (12):**
1. JS/TS fundamentals applied to RN (closures, event loop, async, TS in components)
2. Components, Hooks and lifecycle
3. Styling and Layout (Flexbox, StyleSheet, responsiveness)
4. Navigation (React Navigation: stack, tabs, deep linking, params)
5. State management (Context, Redux/RTK, Zustand — when to use each)
6. Performance (FlatList, memoization, re-renders, Hermes, bundle size)
7. Native modules & New Architecture (legacy Bridge vs JSI, TurboModules, Fabric)
8. Networking & persistence (fetch/axios, AsyncStorage, MMKV, caching, offline-first)
9. Testing (Jest, React Native Testing Library, Detox/E2E)
10. Build, deploy & CI/CD (Expo vs bare workflow, EAS, CodePush/OTA, app signing)
11. Animations (Animated API vs Reanimated, gestures)
12. Debugging, security & best practices (Flipper/DevTools, secure storage)

**Levels:** Junior, Mid, Senior.

**Item types:** `conceptual`, `code-challenge`, `multiple-choice`, `open-question`
(see `data/schema.md` at the hub root for the full field contract).

**Target volume:** ~80–90 approved items total (soft target — technical
correctness matters more than hitting the number).

## Trusted reference domains for this track

Prefer these when researching/answering/reviewing:
- reactnative.dev
- react.dev
- reactnavigation.org
- redux.js.org / redux-toolkit.js.org
- docs.pmnd.rs (Zustand)
- docs.swmansion.com/react-native-reanimated
- docs.expo.dev
- testing-library.com
- jestjs.io
- github.com/facebook/react-native (release notes / architecture docs)
- github.com/react-native-async-storage, github.com/mrousavy/react-native-mmkv

## Notes for agents working this track

- Distinguish clearly between **legacy** and **current** APIs where the topic
  has both (old Bridge vs JSI, `Animated` vs `Reanimated`, deprecated core
  `AsyncStorage` vs the community package). Never present a deprecated API as
  the current recommendation without saying so.
- The New Architecture (Fabric/TurboModules/JSI) is still mid-rollout across
  the ecosystem as of this writing — frame Senior-level questions about it as
  "what it is and why it exists," not as settled universal practice.
