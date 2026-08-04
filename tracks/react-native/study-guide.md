# React Native — Study Guide

> Generated from `tracks/react-native/data/questions.json` — 105 approved items across 12 areas. Regenerate with `node scripts/generate-study-guide.js react-native` whenever the bank changes.

## Contents

- [JS/TS Fundamentals](#js-ts-fundamentals) (9)
- [Components & Hooks](#components-hooks) (9)
- [Styling & Layout](#styling-layout) (9)
- [Navigation](#navigation) (9)
- [Performance](#performance) (9)
- [State Management](#state-management) (9)
- [Native Modules & New Architecture](#native-modules-new-architecture) (8)
- [Networking & Persistence](#networking-persistence) (9)
- [Testing](#testing) (9)
- [Build, Deploy & CI/CD](#build-deploy-ci-cd) (8)
- [Animations](#animations) (9)
- [Debugging, Security & Best Practices](#debugging-security-best-practices) (8)

## JS/TS Fundamentals

### 1. What is a closure in JavaScript, and can you give an example of a closure you might use inside a React Native component (outside of hooks)?

*Junior · Conceptual*

**Answer:** A closure is a function that keeps access to the variables from its enclosing scope even after that outer function has finished executing. In RN code outside of hooks, a common example is a `debounce` utility: the returned inner function closes over a `timeoutId` variable and the caller's config, so you can wrap something like a search box's `onChangeText` handler to stop firing an API call on every keystroke.

**Why:** JavaScript functions capture their lexical scope, not a snapshot of variable values — so the inner function always sees the current value of the outer variable, and that variable stays alive in memory as long as the closure exists (this is also why closures can cause memory leaks if you're not careful about what they retain, e.g. holding a reference to a large object or an unmounted component's state). Closures are the mechanism hooks are built on internally (each hook call closes over the fiber's state), but the question asks for a non-hook example: module-level factories, event handler builders, or utilities like `debounce`/`throttle`/memoized caches are the classic case, since they're plain JS patterns usable in a `.ts` utility file, a class component, or even outside React entirely.

```
function debounce<A extends unknown[]>(fn: (...args: A) => void, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

// utils/search.ts
export const debouncedSearch = debounce((query: string) => searchApi(query), 300);

// <TextInput onChangeText={debouncedSearch} />
```

**References:**
- [MDN — Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)

---

### 2. What's the practical difference between `let`, `const`, and `var` in modern JavaScript, and why do RN/TypeScript codebases almost always prefer `const`?

*Junior · Conceptual*

**Answer:** `var` is function-scoped and hoisted in a way that lets it be accessed (as `undefined`) before its declaration, which causes subtle bugs with loops and closures. `let` and `const` are block-scoped and live in a 'temporal dead zone' until their declaration line, so you can't reference them early. `const` additionally forbids reassigning the binding after initialization. RN/TS codebases default to `const` because it documents intent — 'this reference never changes' — makes bugs from accidental reassignment impossible, and pairs naturally with the immutable-update style React expects (new objects/arrays instead of mutating in place); `let` is reserved for the genuinely small set of variables that must be reassigned, like a loop counter or an accumulator.

**Why:** `var`'s function-scoping means a `var` declared inside an `if` block or a `for` loop leaks out to the whole function, which is almost never what you want and is a frequent source of stale-closure bugs (e.g. a `for (var i...)` loop capturing the same `i` in every callback). `let`/`const` fix that by scoping to the nearest `{}` block. It's important to note `const` only freezes the *binding*, not the value — `const arr = []` still lets you `arr.push(x)`, it just prevents `arr = otherArr`. For true immutability you'd need `Object.freeze` or an immutable-update library, but in practice React/Redux-style code relies on convention (create new objects instead of mutating) rather than runtime enforcement.

**References:**
- [MDN — let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [MDN — const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)

---

### 3. In JavaScript, what does `typeof null` evaluate to?

*Junior · Multiple Choice*

- "null"
- "object"
- "undefined"
- "boolean"

**Answer:** "object" — this is a long-standing bug in JavaScript's original implementation that has been kept for backward compatibility ever since.

**Why:** `"null"` is wrong — there is no dedicated `typeof` string for `null`, which is exactly the confusing part. `"undefined"` is wrong — that's the type tag for the separate `undefined` value, and `null !== undefined` (though `null == undefined` is `true` under loose equality). `"boolean"` is wrong — `null` isn't a boolean. The correct behavior traces back to JS's original value representation, where every value had a type tag, and objects were tagged `0`, which happens to be the same tag used to represent `null` (as a null pointer) — so `typeof` reports `"object"`. Because so much existing code depends on this quirk, it's permanently part of the spec; the practical takeaway is to never use `typeof x === 'object'` alone to check for 'is this a real object' — check `x !== null && typeof x === 'object'` instead.

**References:**
- [MDN — typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)

---

### 4. How does the JavaScript event loop work, and why can a long synchronous computation on the JS thread make touch gestures feel unresponsive in a React Native app?

*Mid · Conceptual*

**Answer:** JavaScript runs on a single thread: the call stack executes one task to completion, then the event loop pulls the next task (a timer, a native event callback, a resolved promise's microtask) off the queue. Nothing else can run while the stack is busy. In React Native, JS execution happens on its own JS thread, separate from the native UI thread that actually renders views — but touch events still have to be dispatched into and handled by that same JS thread. If a synchronous computation (e.g. sorting a huge array, parsing a big JSON blob) is hogging the call stack, queued touch events and their JS callbacks (like an `onPress` handler) simply can't run until it's free, so the UI feels frozen or laggy even though native rendering itself isn't blocked.

**Why:** It's a common misconception that RN is immune to jank from JS-thread blocking because 'the UI runs natively.' That's true for already-committed native views and for animations driven by `useNativeDriver`/Reanimated worklets, which run off the JS thread — but ordinary gesture recognition, `onPress`, `setState`, and any JS-driven `Animated` value still depend on the JS thread being free to process the event queue. The fix in practice is to move heavy synchronous work off the critical path: break it into chunks with `setTimeout`/`InteractionManager.runAfterInteractions`, memoize/avoid recomputation, or move it to a native module/worklet so the UI thread and gesture handling aren't starved waiting for the JS thread's call stack to drain.

**References:**
- [MDN — The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- [React Native docs — Performance Overview (Responding to touches)](https://reactnative.dev/docs/performance)

---

### 5. The following component fetches a user and their posts sequentially, which is slower than necessary since the two requests don't depend on each other:

```ts
async function loadProfile(userId: string) {
  const user = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  return { user, posts };
}
```

Rewrite `loadProfile` so both requests run in parallel, while still handling the case where either request can fail.

*Mid · Code Challenge*

**Answer:** Start both requests before awaiting either one, then await them together with `Promise.all`, wrapped in a `try/catch` so a failure on either side surfaces as a single handled error instead of an unhandled rejection.

**Why:** The original code awaits `fetchUser` before even calling `fetchPosts`, so the two network round-trips happen back to back. Calling both functions first (without `await`) kicks off both requests immediately since a `fetch`/async call starts executing synchronously up to its first `await` — only the *waiting* is deferred. `Promise.all` then resolves when both settle, or rejects immediately with the first rejection reason if either fails ('fail-fast'), which is the same semantics as the original sequential code (an error from either request short-circuits the function) but now the requests overlap in time instead of running back-to-back. If you needed partial results even when one request fails, `Promise.allSettled` would be the alternative, at the cost of handling `{status, value|reason}` objects instead of plain values.

```
async function loadProfile(userId: string) {
  try {
    const [user, posts] = await Promise.all([
      fetchUser(userId),
      fetchPosts(userId),
    ]);
    return { user, posts };
  } catch (error) {
    throw new Error(
      `Failed to load profile for user ${userId}: ${(error as Error).message}`
    );
  }
}
```

**References:**
- [MDN — Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [MDN — Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

---

### 6. Which statement about TypeScript's structural typing is correct when applied to a React Native component's props?

*Mid · Multiple Choice*

- Two prop types are compatible only if they share the same declared type name
- Two prop types are compatible if they have the same shape, regardless of their declared names
- TypeScript ignores extra properties passed to a component as long as required props are present
- Structural typing only applies to primitive types like string and number, not object props

**Answer:** "Two prop types are compatible if they have the same shape, regardless of their declared names" — TypeScript compares object shapes, not nominal type identity, so a `UserCardProps` and an unrelated `{ name: string; avatarUrl: string }` type are interchangeable if their members line up.

**Why:** Option 1 is wrong — TypeScript is structurally (not nominally) typed, unlike languages like Java or C#, so the type *name* is irrelevant to compatibility. Option 3 is wrong in the specific case that trips people up: when you pass a JSX object literal directly as props, TypeScript performs 'excess property checking' and *will* flag properties that don't exist on the props interface, even though normal structural compatibility would otherwise allow extra properties on an object assigned through a variable; this is a deliberate carve-out to catch typos like `colour` instead of `color`. Option 4 is wrong — structural typing is exactly how TypeScript compares object and interface shapes, including component props; it's not limited to primitives (primitives compare by simple equality of type, not structurally in the interesting sense).

**References:**
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [TypeScript Handbook — Excess Property Checks](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)

---

### 7. How would you explain the difference between microtasks (e.g. Promise callbacks) and macrotasks (e.g. `setTimeout`) to a junior developer, and how does that ordering affect a real bug where a state update seems to happen 'too late'?

*Senior · Conceptual*

**Answer:** Macrotasks (`setTimeout`, `setInterval`, native event callbacks) each get pulled off the queue one at a time, with the engine free to do other bookkeeping between them. Microtasks (`Promise.then/catch/finally`, `queueMicrotask`, `async/await` continuations) are drained *completely* — every microtask, including new ones queued while draining — before the engine moves on to the next macrotask. So given `setTimeout(fn, 0)` and `Promise.resolve().then(fn2)` scheduled at the same moment, `fn2` always runs before `fn`, no matter how short the timeout is. A real bug this causes: a developer chains several `.then()` calls that each schedule more promise work, assuming a `setTimeout(() => flushUpdates(), 0)` elsewhere will interleave with them — but it won't run until the entire microtask chain empties, so state updates queued via promises appear to happen 'immediately' while a timeout-based update appears to lag, even though the timeout was scheduled first.

**Why:** The key mental model for a junior dev: think of microtasks as a VIP queue that must go empty before the macrotask queue is even looked at again — and it's re-checked after every single macrotask, not just at the start. This matters for React Native specifically because a lot of async glue code (API clients, storage libraries, navigation transitions) is promise-based, so an innocuous `await` deep in a call chain can silently reorder when a `setState` actually lands relative to a native event or a `setTimeout`-based timer, producing 'off by one tick' bugs that are hard to reproduce because they depend on exact scheduling, not logic.

```
console.log('1: sync');

setTimeout(() => console.log('4: macrotask (setTimeout)'), 0);

Promise.resolve()
  .then(() => console.log('2: microtask A'))
  .then(() => console.log('3: microtask B (queued from A)'));

console.log('1.5: sync');

// Output order: 1, 1.5, 2, 3, 4
// Both microtasks run before the macrotask, even though
// the setTimeout(fn, 0) was scheduled first.
```

**References:**
- [MDN — The event loop (Microtasks section)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop#microtasks)
- [MDN — Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

---

### 8. Write a TypeScript utility type `DeepPartial<T>` that makes every property of an object type optional, including nested objects (e.g. so a `DeepPartial<FormState>` can represent a form that's only partially filled in). Add a short comment describing one place in a React Native app where this would be useful.

*Senior · Code Challenge*

**Answer:** Built-in `Partial<T>` only makes the top-level keys optional — nested object properties stay required. `DeepPartial<T>` needs a recursive conditional/mapped type that re-applies itself to any property whose value is itself an object.

**Why:** The type must special-case non-object values (primitives, functions) so the recursion has a base case — otherwise `T extends object ? ... : T` would try to map over things like `string` or `Date` that aren't meant to be recursed into. In practice you often also want to special-case arrays and `Date`/`Function` so they aren't turned into `{ [index: number]: DeepPartial<T> }` or have their methods stripped; production-grade versions (like the one shipped in `redux`'s or `utility-types`' toolkits) add those guards. A common RN use case is a theme/config override object — e.g. merging a screen-specific partial theme (`{ colors: { primary: '#fff' } }`) into a full default theme without requiring every token to be specified — or representing a multi-step form's draft state before validation runs.

```
type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

interface FormState {
  name: string;
  address: {
    street: string;
    city: string;
  };
}

// Useful for representing an in-progress, partially-filled form draft
// (e.g. persisted to AsyncStorage/MMKV between app sessions) without
// requiring every nested field to be present yet.
const draft: DeepPartial<FormState> = {
  address: { city: 'Lisbon' }, // 'street' and 'name' can be omitted
};
```

**References:**
- [TypeScript Handbook — Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript Handbook — Utility Types (Partial<Type>)](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)

---

### 9. How do you decide how strict to make a new React Native project's TypeScript configuration (`strict`, `noImplicitAny`, `strictNullChecks`, etc.), and how would you introduce stricter typing incrementally into an existing, mostly-untyped codebase without stalling the team?

*Senior · Open Question*

**Answer:** For a brand-new project I turn on `strict: true` (which bundles `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.) from day one, since it's far cheaper to write strict code from the start than to retrofit it later, and RN's official TypeScript template ships with it enabled by default. For an existing loosely-typed codebase, I don't flip `strict` globally in one PR — I enable it in `tsconfig.json` but use `// @ts-nocheck` or per-directory `tsconfig` overrides to exempt legacy files, then ratchet strictness up incrementally: new files must pass full strict mode, and old files get cleaned up opportunistically whenever they're touched for other work.

**Why:** The core tension is that flipping `strict: true` on a large untyped codebase usually produces hundreds or thousands of errors overnight, which either blocks all other work or gets 'solved' with a wave of `any` casts that defeat the purpose. A pragmatic incremental path: (1) turn on `noImplicitAny` first since it catches the most dangerous class of bugs (accidentally-untyped values) with the least churn; (2) use TypeScript's per-file strictness via a `// @ts-strict` convention or split `tsconfig.json`/`tsconfig.strict.json` with `include` globs, so CI enforces strict mode only on files/directories that have already been migrated; (3) track progress with a lint rule or script that fails CI if the count of `any`/`@ts-ignore` usages *increases*, ratcheting the codebase toward stricter rather than looser over time; (4) prioritize migrating the highest-risk surfaces first — API response types and navigation param lists are where untyped code causes the most runtime crashes. The goal is that strictness monotonically increases without ever requiring a single blocking 'big bang' migration PR.

**References:**
- [TypeScript — tsconfig `strict`](https://www.typescriptlang.org/tsconfig#strict)
- [React Native docs — TypeScript](https://reactnative.dev/docs/typescript)

---

## Components & Hooks

### 1. What is the difference between a functional component and a class component in React Native, and why has the ecosystem largely moved to functional components with hooks?

*Junior · Conceptual*

**Answer:** A class component extends `React.Component`, holds state on `this.state`, and uses lifecycle methods like `componentDidMount`/`componentDidUpdate`/`componentWillUnmount`. A functional component is just a plain JS function that returns JSX, and since React 16.8 it can hold state and side effects via hooks (`useState`, `useEffect`, etc.) instead of lifecycle methods and `this`. The ecosystem shifted to functional components because hooks let you share stateful logic between components without the wrapper-hell of higher-order components or render props, avoid the recurring `this`-binding footguns of classes, and let you organize code by concern (e.g. all the subscription logic together) instead of splitting related logic across separate lifecycle methods.

**Why:** Under the hood, class and function components render to the same reconciler output — hooks aren't a fundamentally different rendering model, they're a different way of attaching state and effects to a fiber. The practical wins are: less boilerplate (no constructor, no manual `.bind(this)`), custom hooks as a first-class code-reuse mechanism (something classes never had a good answer for), and effects that group 'setup' and 'cleanup' together instead of splitting mount logic in `componentDidMount` from teardown logic in `componentWillUnmount`. Class components still work and React has no plans to remove them, but virtually all new RN code, libraries, and documentation (including React Navigation's and Reanimated's APIs) are hooks-first, so classes are now mostly seen in legacy code.

**References:**
- [React docs — Your First Component](https://react.dev/learn/your-first-component)
- [React docs — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

### 2. What does `useState` do, and why does the Rules of Hooks forbid calling it inside a loop, condition, or nested function?

*Junior · Conceptual*

**Answer:** `useState` gives a functional component a piece of state that persists between renders, returning the current value and a setter function that schedules a re-render with the new value. Hooks must always be called at the top level, in the exact same order, on every render because React doesn't identify each hook by name — it identifies them by call order/index within the component. If a `useState` call were wrapped in a condition or loop, that order could change between renders, and React would associate the wrong stored state with the wrong hook call, silently corrupting state.

**Why:** Internally, each function component has a linked list (or array) of 'hook' entries on its fiber, and every hook call just walks to the next entry in that list. There's no key or name involved — it's purely positional. So if render #1 calls `useState`, `useEffect`, `useState` (because a condition was true) and render #2 calls just `useState`, `useEffect` (condition now false), the second `useState`'s slot now gets matched against what used to be the `useEffect` slot's data, corrupting both. This is why the ESLint rule `react-hooks/rules-of-hooks` flags any hook call that isn't unconditionally at the top level of a component or custom hook, before any early `return`.

**References:**
- [React docs — useState](https://react.dev/reference/react/useState)
- [React docs — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

---

### 3. Which of the following is a correct statement about the Rules of Hooks?

*Junior · Multiple Choice*

- Hooks may be called conditionally as long as the condition doesn't change between renders
- Hooks must always be called in the same order on every render of a component
- Hooks can only be used inside class components that extend React.PureComponent
- Custom hooks must start with 'hook' rather than 'use' to be recognized by the linter

**Answer:** "Hooks must always be called in the same order on every render of a component" — React matches hook calls to their stored state purely by call order, so that order must be identical every render.

**Why:** Option 1 is wrong — even a condition that 'never changes in practice' is disallowed by the rule itself; hooks must be unconditional, full stop, precisely because the linter/runtime can't verify your assumption holds across every future code change. Option 3 is wrong and backwards — hooks exist specifically for *functional* components; class components cannot use hooks at all (though a class can render a functional child that does). Option 4 is wrong — the convention is the exact opposite: custom hooks must be named starting with `use` (e.g. `useSomething`) so both the `eslint-plugin-react-hooks` linter and React's own tooling can identify them as hooks and apply the Rules of Hooks checks; 'hook' is not the recognized prefix.

**References:**
- [React docs — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

---

### 4. When rendering a list of components, what does React primarily use the `key` prop for?

*Junior · Multiple Choice*

- Styling each list item uniquely
- Improving network request caching for list data
- Helping React's reconciler identify which items changed, were added, or were removed between renders
- Setting the accessibility label for each item

**Answer:** "Helping React's reconciler identify which items changed, were added, or were removed between renders" — `key` gives each list item a stable identity so React can match old and new elements correctly instead of diffing purely by position.

**Why:** The other options describe things `key` has nothing to do with: it's not a styling hook, doesn't touch network caching, and isn't exposed to accessibility APIs (you'd use `accessibilityLabel` for that). The concrete failure mode `key` prevents: without stable keys (or with array-index keys on a reorderable/filterable list), React can't tell that item 'B' moved from position 2 to position 0 — it just sees 'the thing at index 0 changed', so it may reuse the wrong component instance's local state (e.g. a `TextInput`'s typed value 'sticking' to the wrong row after a reorder) or do unnecessary re-mounts. A stable, unique id (not the array index) as the key lets React correctly preserve or discard state per logical item across renders.

**References:**
- [React docs — Rendering Lists (keeping list items in order with key)](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)

---

### 5. What's the difference between `useEffect` and `useLayoutEffect`, and can you describe a real scenario in a React Native app where you'd actually need `useLayoutEffect`?

*Mid · Conceptual*

**Answer:** `useEffect` runs asynchronously after React has committed changes and the screen has been painted, so it never blocks the user from seeing the update. `useLayoutEffect` runs synchronously right after the DOM/native mutations are applied but before the screen paints, which lets you measure or adjust layout without the user ever seeing an intermediate, wrong frame — at the cost of blocking that paint if the work is slow. In RN, a real case is measuring a custom tooltip or dropdown's target element with `ref.measure()`/`measureInWindow` and setting its position in state before the popover is shown, so it appears in the correct spot instead of flashing at `(0,0)` for one frame and then jumping.

**Why:** Because React Native has no browser DOM, 'paint' here means the point at which the native renderer (Fabric/the old UIManager) actually flushes the computed layout to the native view tree. `useLayoutEffect` still fires synchronously in that window, so it's the right tool when a visual glitch (flicker/jump) would otherwise be visible to the user for one frame — e.g., positioning an overlay based on a measured size, or synchronizing a scroll position before the user sees it. React's own docs recommend defaulting to `useEffect` and reaching for `useLayoutEffect` only when you have this specific measure-then-adjust need, since it can hurt perceived performance if the layout work is expensive.

**References:**
- [React docs — useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)
- [React docs — useEffect](https://react.dev/reference/react/useEffect)

---

### 6. The following component logs a warning: "Can't perform a React state update on an unmounted component":

```tsx
function ProfileScreen({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <UserView user={user} />;
}
```

Fix the effect so it doesn't try to update state after the component has unmounted.

*Mid · Code Challenge*

**Answer:** Add a cleanup function that flips a local flag when the effect is torn down, and check that flag before calling `setUser` in the promise resolution — or, more robustly, use an `AbortController` to actually cancel the in-flight request.

**Why:** The warning happens because `fetchUser(userId)` keeps running after the component unmounts (e.g. the user navigated away before the response arrived), and when it resolves, `setUser` fires on a component that no longer exists. A boolean flag guard is the minimal fix and stops the *symptom* (calling `setState` on unmounted state), but it doesn't stop the network request itself from completing — for that, pairing it with `AbortController` is the more complete fix, since it actually cancels the fetch and lets `fetchUser` reject cleanly on unmount instead of resolving pointlessly.

```
function ProfileScreen({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    fetchUser(userId, { signal: controller.signal })
      .then((data) => {
        if (isActive) setUser(data);
      })
      .catch((error) => {
        if (isActive && error.name !== 'AbortError') {
          console.error(error);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [userId]);

  return <UserView user={user} />;
}
```

**References:**
- [React docs — useEffect (fetching data / race conditions)](https://react.dev/reference/react/useEffect#fetching-data-with-effects)
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### 7. Write a custom hook `usePrevious<T>(value: T): T | undefined` that returns whatever value a prop or state variable held on the previous render (and `undefined` on the first render).

*Mid · Code Challenge*

**Answer:** Use a `useRef` to hold the previous value, and update it inside a `useEffect` — because effects run *after* render, the ref still holds the prior render's value when the component body reads it during the current render, and only gets overwritten to the new value afterward.

**Why:** The trick is ordering: on render N, the hook body reads `ref.current`, which still holds whatever was set during render N-1's effect (effects from the current render haven't run yet at that point). After the component renders and commits, the `useEffect` fires and updates `ref.current` to the latest `value`, ready to be read as the 'previous' value on render N+1. On the very first render, `ref.current` is still `undefined` (its initial value), which matches the required behavior. Mutating a ref doesn't trigger a re-render, which is exactly what you want here — you're not creating new state, just remembering the last one.

```
import { useEffect, useRef } from 'react';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Usage:
// const prevCount = usePrevious(count);
// useEffect(() => {
//   if (prevCount !== undefined && count > prevCount) { ... }
// }, [count, prevCount]);
```

**References:**
- [React docs — useRef](https://react.dev/reference/react/useRef)
- [React docs — useEffect](https://react.dev/reference/react/useEffect)

---

### 8. How would you design a custom hook that shares stateful logic (say, keyboard visibility) across many screens without causing components that don't care about that state to re-render unnecessarily?

*Senior · Conceptual*

**Answer:** I'd avoid putting the shared value in React Context, because every consumer of a Context re-renders on every update regardless of which part of the value it uses. Instead I'd keep the keyboard-visibility state in a small external store (a Zustand store, or a hand-rolled subscription object driven off RN's `Keyboard` event emitter) and expose it through `useSyncExternalStore`, so each screen's `useKeyboardVisible()` call subscribes independently and only that specific component re-renders when the value it selected actually changes — components that never call the hook are completely unaffected.

**Why:** The naive approach — a Context provider wrapping the whole app with `{ isKeyboardVisible }` — re-renders every consumer on every keyboard toggle, even ones with no keyboard-related UI, because Context has no per-field subscription granularity. `useSyncExternalStore` (or a store library that uses it internally, like Zustand) solves this because each call site provides its own selector; React only re-renders the component whose selected slice actually changed between snapshots. In practice: attach a `Keyboard.addListener('keyboardDidShow'/'keyboardDidHide', ...)` pair inside a module-level store, update a plain external `let` value, and call the store's `notify()`/`emit()` on each change; `useSyncExternalStore(store.subscribe, store.getSnapshot)` in the hook handles the rest, including avoiding tearing during concurrent rendering.

**References:**
- [React docs — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React Native docs — Keyboard](https://reactnative.dev/docs/keyboard)

---

### 9. Walk me through how you'd refactor a 400-line class component with `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount` into hooks-based functional code, and how you'd verify you haven't changed its behavior in the process.

*Senior · Open Question*

**Answer:** I'd start by inventorying, per lifecycle method, exactly what each block of code depends on and what it sets up/tears down — this tells me how many separate `useEffect`s I actually need, since a single `componentDidMount`/`componentWillUnmount` pair often bundles several unrelated concerns that should become separate effects. Before touching implementation, I'd lock in a safety net: snapshot/characterization tests with React Native Testing Library covering the component's observable behavior (renders, user interactions, callbacks fired) if they don't already exist, then refactor incrementally — extract logical pieces into custom hooks one at a time, running the test suite and doing a manual smoke test after each step, rather than rewriting the whole 400 lines in one pass.

**Why:** The main behavioral traps in this kind of migration: (1) `componentDidUpdate` often has implicit conditional logic ('only re-run this when `prop.x` changes') that has to become an explicit dependency array — get the deps wrong and you either miss updates or effects fire too often; (2) code that ran once in `componentDidMount` but was *also* invoked from `componentDidUpdate` under certain conditions needs to become one effect with the right dependency array, not two separate effects, or you'll duplicate work; (3) `this.someInstanceVariable` that isn't meant to trigger re-renders maps to `useRef`, not `useState` — using `useState` there would introduce extra re-renders that didn't exist before; (4) cleanup logic split across `componentWillUnmount` needs to be paired back up with the *specific* effect it undoes, since each `useEffect`'s cleanup only relates to that effect, not the whole component's lifetime. I'd verify parity with existing/added tests, a manual QA pass against the pre-refactor build, and ideally splitting the refactor into small reviewable PRs (e.g. one PR per extracted hook) so a regression is easy to bisect.

**References:**
- [React docs — Migrating from Class Components](https://react.dev/reference/react/Component#alternatives)
- [React docs — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

---

## Styling & Layout

### 1. How does the default `flexDirection` in React Native's Flexbox implementation differ from Flexbox on the web, and why does that trip up developers coming from CSS?

*Junior · Conceptual*

**Answer:** In React Native, every `View` defaults to `flexDirection: 'column'`, stacking children top to bottom. On the web, CSS Flexbox defaults to `flexDirection: 'row'`, laying children left to right. Developers coming from web CSS often forget to set `flexDirection: 'row'` explicitly, so a layout they expect to be a horizontal row of items instead renders as a vertical stack, because RN's Yoga-based engine intentionally reverses the web default to match how mobile UIs are typically composed (vertically scrolling screens made of stacked sections).

**Why:** React Native's layout engine (Yoga) implements the Flexbox spec but deliberately changes several defaults to better fit mobile UI patterns, and `flexDirection` is the one that surprises web developers most often. The official docs also call out that `alignContent` defaults to `flex-start` (not `stretch`) and `flexShrink` defaults to `0` (not `1`) in RN — both departures from CSS defaults for the same reason: mobile layouts are usually vertical stacks of fixed-content sections rather than fluid, wrapping web pages. Since these are just different *defaults*, not different capabilities, any RN layout can still replicate a CSS-like row layout by explicitly setting `flexDirection: 'row'`.

**References:**
- [React Native docs — Flexbox](https://reactnative.dev/docs/flexbox)

---

### 2. What's the difference between writing inline styles versus using `StyleSheet.create()` in React Native, and does the choice actually affect runtime performance?

*Junior · Conceptual*

**Answer:** An inline style (`style={{ padding: 8 }}`) is a plain object literal created fresh on every render, while `StyleSheet.create({...})` builds the style objects once, up front, and returns stable references you reuse across renders. The docs primarily frame `StyleSheet.create` as a code-organization tool for keeping styles readable and separate from render logic, but it also has a real, if secondary, performance angle: because it returns the *same object reference* every render, it plays nicely with `React.memo`/`PureComponent`'s shallow prop comparison, whereas a new inline object literal every render defeats that optimization by always looking 'different'.

**Why:** It's worth being precise about what `StyleSheet.create` does and doesn't guarantee: the official docs describe it mainly as a way to keep styles co-located and readable, and to get some validation of style property names at creation time. It's not documented as a dramatic runtime optimization on its own. The referential-stability benefit is real but conditional — it only matters if that style object is also passed as a prop to a memoized child that relies on shallow-equality bailout; for a plain `<View style={styles.row}>` that isn't memoized, the difference is negligible. In short: default to `StyleSheet.create` for maintainability and to avoid accidentally breaking memoization elsewhere, but don't expect it alone to fix a real perf problem — the bigger wins come from `React.memo`, list virtualization, and avoiding unnecessary re-renders.

**References:**
- [React Native docs — Style](https://reactnative.dev/docs/style)
- [React Native docs — StyleSheet API](https://reactnative.dev/docs/stylesheet)

---

### 3. The following styles are meant to lay out three icon buttons in a row with equal spacing between them, but they currently render bunched up on the left:

```ts
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
```

Fix the `row` style so the three children are evenly spaced across the full width of the row, with equal gaps between and around them.

*Junior · Code Challenge*

**Answer:** Add `justifyContent: 'space-evenly'` (and make sure the row itself spans the full width, e.g. `width: '100%'`). `space-evenly` is the option that produces genuinely *equal* gaps everywhere — including the edges — which is what 'equal gaps between and around them' calls for; `space-between` would leave no gap at the outer edges, and `space-around` gives the edges only half the gap size of the middle gaps.

**Why:** The children were bunched on the left because the default `justifyContent` is `flex-start`, which packs items at the start of the main axis and leaves unused space after them. This is a common spot where candidates reach for `space-between` out of habit, but it's the wrong choice here specifically because it puts zero space before the first item and after the last — good for a header with items pinned to each edge, not for the 'equal gaps everywhere' requirement in this question. `space-around` is closer but still gives edge items only half the gap of an interior gap (each item gets equal space *around* it, so adjacent items' half-gaps combine to a full gap, while the outer edges only get one half-gap). `space-evenly` is the one Flexbox value that guarantees every gap — including both outer edges — is identical.

```
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
});
```

**References:**
- [React Native docs — Layout Props (justifyContent)](https://reactnative.dev/docs/layout-props#justifycontent)
- [React Native docs — Flexbox](https://reactnative.dev/docs/flexbox)

---

### 4. What is the default value of `flexDirection` for a `View` in React Native?

*Junior · Multiple Choice*

- 'row'
- 'column'
- 'row-reverse'
- 'column-reverse'

**Answer:** 'column' — React Native's Flexbox implementation defaults to stacking children vertically, the opposite of the web's default `row`.

**Why:** 'row' is the CSS/web Flexbox default, not React Native's — this is the exact mismatch that trips up developers coming from web CSS. 'row-reverse' and 'column-reverse' are valid `flexDirection` values but neither is the default in either environment; they have to be set explicitly when you want children laid out in reverse order along their axis.

**References:**
- [React Native docs — Flexbox](https://reactnative.dev/docs/flexbox)

---

### 5. How would you build a layout that adapts sensibly to both phone and tablet screen sizes without hardcoding pixel dimensions everywhere?

*Mid · Conceptual*

**Answer:** I'd lean on Flexbox proportional sizing (`flex`, percentage widths) instead of fixed pixel values wherever possible, so containers naturally grow and shrink with the available space. For values that genuinely need to react to screen size — like switching from a single-column to a multi-column grid on larger screens — I'd read `useWindowDimensions()` and branch on width breakpoints (e.g. `width >= 768` for tablet), rather than hardcoding device-specific pixel values, since `useWindowDimensions` also re-renders automatically on rotation or window resize (important for split-screen/foldables).

**Why:** The main anti-pattern to avoid is hardcoding pixel dimensions computed for one reference device and assuming they'll look right everywhere — RN's dimensionless 'points' already normalize for pixel density, but they say nothing about screen size, so a `width: 300` box is a small fraction of a tablet's screen and a huge fraction of a small phone's. A layered approach works well: (1) Flexbox for structural layout so components size themselves relative to their container by default; (2) `aspectRatio` instead of fixed heights for media; (3) breakpoint-based conditional layout (driven by `useWindowDimensions`, not the older static `Dimensions.get()` which doesn't update on rotation) for genuinely different arrangements at different sizes, like a tablet showing a master-detail split view where a phone shows one screen at a time; (4) `SafeAreaView`/`useSafeAreaInsets` so content respects notches and the different aspect ratios across devices.

**References:**
- [React Native docs — useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)
- [React Native docs — Flexbox](https://reactnative.dev/docs/flexbox)

---

### 6. Given a card component that renders a fixed-height image (`height: 200`), rewrite its styles so the image keeps a 16:9 aspect ratio on any device width, using Flexbox and the `aspectRatio` style property instead of a fixed height.

*Mid · Code Challenge*

**Answer:** Drop the fixed `height: 200`, set `width: '100%'` so the image fills its container's width, and add `aspectRatio: 16 / 9` — Yoga then computes the height automatically from the width to preserve that ratio, so the image scales correctly on any device width instead of being cropped or fixed at 200px regardless of screen size.

**Why:** A fixed `height: 200` combined with a fluid width is exactly what causes distorted or oddly-cropped images across device sizes — a 200px-tall image looks fine on one screen width and stretched/squashed on another because the width:height ratio isn't fixed. `aspectRatio` tells Yoga to compute the *undefined* dimension (in this case height, since only width is set) so that width:height always equals the given ratio; it also plays correctly with `resizeMode: 'cover'`/`'contain'` on the `Image` itself if the source image's own ratio doesn't exactly match 16:9.

```
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9, // height is computed automatically
  },
});

function Card({ imageUri }: { imageUri: string }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
    </View>
  );
}
```

**References:**
- [React Native docs — Layout Props (aspectRatio)](https://reactnative.dev/docs/layout-props#aspectratio)

---

### 7. By default, what unit do numeric `width` and `height` style values represent in React Native?

*Mid · Multiple Choice*

- Physical device pixels
- Points/density-independent pixels, similar to CSS logical pixels
- Percentages of the parent container
- A fixed 1 unit = 1mm physical measurement

**Answer:** "Points/density-independent pixels, similar to CSS logical pixels" — React Native's own docs describe all dimensions as unitless values representing density-independent pixels, not raw physical pixels.

**Why:** Physical device pixels is wrong — that would mean the same `width: 100` looked like wildly different physical sizes on a low-DPI vs. high-DPI (Retina/2x/3x) screen of the same physical size, which isn't how RN dimensions work; the density-independent unit is exactly what shields you from having to think about a device's pixel ratio for everyday layout. 'Percentages of the parent' is a separate, string-based syntax (`width: '50%'`) — numeric values are absolute density-independent pixels, not relative percentages. The '1 unit = 1mm' option is also wrong; the docs are explicit that there's no universal mapping from points to a physical unit of measurement, since a fixed-dimension component can render at a slightly different physical size across devices — this is a known, accepted trade-off, not a mm-based scale.

**References:**
- [React Native docs — Height and Width](https://reactnative.dev/docs/height-and-width)

---

### 8. What trade-offs would you weigh when choosing between percentage-based dimensions, the `Dimensions`/`useWindowDimensions` API, and a responsive-scaling library for a design system meant to work across a wide range of device sizes?

*Senior · Conceptual*

**Answer:** Percentage-based dimensions are the simplest and cheapest — no JS computation, no re-renders — but they only describe a value relative to its immediate parent, so they can't express 'this should be 16pt on a phone and 24pt on a tablet' on their own. `useWindowDimensions` gives you the actual screen size reactively (updating on rotation/fold), which is the right tool for real breakpoint logic, but overusing it to scale every spacing/font value creates a lot of components that re-render on every dimension change and couples styling logic to a specific hook everywhere. Responsive-scaling libraries (e.g. proportionally scaling a fixed Figma-width design to the runtime screen width) give visual consistency with a specific design mock with very little manual work, but taken too far they make small-device users see everything shrunk down and can fight against platform-native text scaling/accessibility settings, so I'd use them sparingly — for spacing/typography scale, not as a blanket replacement for genuine breakpoint-based layout decisions.

**Why:** The deeper trade-off is between *visual fidelity to a specific design mock* and *native, accessible, platform-appropriate feel*. A scaling library that linearly interpolates every dimension from a reference width produces pixel-perfect parity with a Figma file across devices, but it can override the user's OS-level font scaling preference if applied to font sizes without care (an accessibility regression), and it makes 'inspect this component in isolation' harder since its rendered size depends on the runtime screen width rather than being self-describing. My default for a design system: build the spacing/typography scale as a fixed, curated token set (e.g. an 8pt-grid scale of `{xs: 4, sm: 8, md: 16, lg: 24, xl: 32}`) rather than continuously scaled values, reserve `useWindowDimensions`-driven breakpoints for genuine layout restructuring (columns, split views), and avoid scaling libraries for anything that should respect the user's accessibility font-size settings.

**References:**
- [React Native docs — useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)
- [React Native docs — Dimensions](https://reactnative.dev/docs/dimensions)

---

### 9. How would you design a scalable theming and spacing system (e.g. an 8pt grid, design tokens) for a React Native app that needs to support light/dark mode and multiple product brands?

*Senior · Open Question*

**Answer:** I'd separate the system into three layers: raw design tokens (a curated color palette, an 8pt-grid spacing scale like `{1: 4, 2: 8, 3: 16, 4: 24, 5: 32}`, and a type scale), semantic tokens that map raw tokens to purpose (`colors.background`, `colors.textPrimary`, `spacing.cardPadding`) so components reference intent rather than raw values, and per-brand/per-mode theme objects that fill in the semantic layer differently. Components consume a `useTheme()` hook backed by a Context whose value swaps based on the active brand and `useColorScheme()`'s light/dark result, so switching either dimension re-themes the whole app without touching component code.

**Why:** The key design decision is that components should never reference raw values (`#3366FF`, `16`) directly — they reference semantic tokens (`theme.colors.primary`, `theme.spacing.md`), and it's the theme object that resolves those semantic names differently per brand and per color scheme. This makes adding a third brand, or a fourth spacing-scale tweak, a change in one theme-definition file rather than a sweep through every component. For performance, the theme object itself should be memoized (recomputed only when brand/scheme actually changes) since it's read by nearly every styled component and would otherwise force wide re-renders; some teams pre-generate `StyleSheet.create`-based stylesheets per theme rather than inlining theme lookups in every render, trading a bit of memory for fewer per-render style-object allocations. `useColorScheme` (or the `Appearance` API) handles OS-level light/dark detection, while an explicit user override (a manual light/dark toggle stored in app state) should take precedence over the system setting when the app supports one.

**References:**
- [React Native docs — Appearance](https://reactnative.dev/docs/appearance)
- [React Native docs — useColorScheme](https://reactnative.dev/docs/usecolorscheme)

---

## Navigation

### 1. What's the functional difference between a Stack Navigator and a Tab Navigator in React Navigation, and when would you nest one inside the other?

*Junior · Conceptual*

**Answer:** A Stack Navigator keeps a push/pop history of screens — navigating forward pushes a new screen on top, and the back button/gesture pops it off, which is the right model for a linear drill-down flow (list → detail → edit). A Tab Navigator shows several top-level screens side by side behind a persistent tab bar, with switching tabs just swapping which screen is visible rather than adding to a history. You nest a Stack inside each tab (or occasionally a Tab inside a Stack) when a tab's own content needs its own drill-down flow while keeping the tab bar visible — e.g. a 'Feed' tab whose Stack lets you push into a post's comments, while 'Profile' and 'Search' tabs stay independently navigable.

**Why:** The most common real-world pattern is 'Stack inside Tabs': each tab gets its own independent Stack Navigator, so pushing a Details screen from the Feed tab doesn't affect what's on top of the Search tab's stack, and the tab bar remains visible and tappable the whole time (tapping the active tab again typically pops that tab's stack back to its root). The reverse, 'Tabs inside a Stack', is used when you want the tab bar to disappear once the user drills into certain content — e.g. a messaging app's tabbed inbox, where opening a specific conversation pushes a full-screen chat view that covers the tab bar entirely. React Navigation's own docs caution against nesting more navigators than necessary, since deep nesting adds complexity (each navigator has its own state, and props/params don't automatically flow across navigator boundaries) and can hurt performance if not done carefully.

```
function FeedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FeedList" component={FeedListScreen} />
      <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
    </Stack.Navigator>
  );
}

function RootTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

**References:**
- [React Navigation docs — Nesting navigators](https://reactnavigation.org/docs/nesting-navigators)

---

### 2. How do you pass parameters from one screen to another with React Navigation, and how do you read those parameters on the receiving screen?

*Junior · Conceptual*

**Answer:** Pass params as the second argument to `navigation.navigate('ScreenName', { ...params })`, keeping them minimal and JSON-serializable (ids and small values, not entire fetched objects). The receiving screen reads them off the `route` prop's `params` field — `route.params.userId` — or via `useRoute()` if it's not receiving `route` as a prop directly.

**Why:** React Navigation's own guidance is to pass just enough information to identify what to show — e.g. a `userId`, not the whole user object — and let the destination screen fetch or select its own data from a store; this keeps params serializable, which matters for state persistence and deep linking, and avoids screens holding stale copies of data that changes elsewhere. To update a screen's own params in place (without navigating), use `navigation.setParams({...})`, which merges the given keys into the existing params rather than replacing them wholesale.

```
// Navigating with params
navigation.navigate('Profile', { userId: '42' });

// Reading params on the receiving screen
function ProfileScreen({ route }: { route: RouteProp<RootStackParamList, 'Profile'> }) {
  const { userId } = route.params;
  return <UserDetails userId={userId} />;
}

// Equivalent using the useRoute hook
function ProfileScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Profile'>>();
  const { userId } = route.params;
  return <UserDetails userId={userId} />;
}
```

**References:**
- [React Navigation docs — Passing parameters to routes](https://reactnavigation.org/docs/params/)

---

### 3. How does deep linking work in a React Native app using React Navigation, and what do you need to configure on both iOS and Android for a custom URL scheme or universal link to open the right screen?

*Mid · Conceptual*

**Answer:** React Navigation handles deep links via the `linking` prop on `NavigationContainer`, which maps URL patterns to screen names/params (`{ prefixes: ['myapp://', 'https://myapp.com'], config: { screens: { Profile: 'user/:id' } } }`). That JS-level config only fires once the OS has actually handed the URL to your app, so each platform needs its own native registration: on iOS, register the custom scheme in the Xcode project's URL Types (or via `npx uri-scheme add`) for `myapp://` links, and for universal links, enable Associated Domains with an `applinks:` entry plus an `AppDelegate` handler that forwards `continueUserActivity` to `RCTLinkingManager`. On Android, add an intent-filter with your custom `scheme` to `AndroidManifest.xml`'s launch activity (with `launchMode="singleTask"`) for the URL scheme, and a second intent-filter with `android:autoVerify="true"` plus your domain for App Links — both platforms additionally require hosting a verification file on your domain (an Apple App Site Association file for iOS, a Digital Asset Links JSON file for Android) so the OS will trust your app to open that domain's links instead of a browser.

**Why:** It's a two-layer problem: the native OS layer decides *whether* to hand a given URL to your app at all (that's the Info.plist/AndroidManifest/domain-verification-file configuration), and the JS `linking` config decides *which screen* to show once the URL reaches React Navigation. Custom URL schemes (`myapp://...`) are simpler to set up but can be hijacked by any other app that registers the same scheme and don't work if the app isn't installed; universal links/App Links (real `https://` URLs backed by domain verification) are the more robust production choice because they fall back gracefully to a website when the app isn't installed and can't be squatted on by another app, at the cost of the extra domain-verification-file setup on both platforms.

```
// App.tsx
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Profile: 'user/:id',
      Settings: 'settings',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* navigators */}
</NavigationContainer>
```

**References:**
- [React Navigation docs — Deep linking](https://reactnavigation.org/docs/deep-linking/)

---

### 4. Write the TypeScript param list type (`RootStackParamList`) for a stack navigator with three screens — `Home` (no params), `Profile` (`{ userId: string }`), and `Settings` (`{ section?: string }`) — and show how you'd type a `useNavigation` call so `navigation.navigate('Profile', { userId })` is fully type-checked.

*Mid · Code Challenge*

**Answer:** Define a type mapping each route name to its params shape (or `undefined` for no params), pass it as the generic to `createNativeStackNavigator<RootStackParamList>()`, and register the root navigator's type via module augmentation so `useNavigation()`, `Link`, etc. infer it everywhere without manual type parameters.

**Why:** Screens that receive `route`/`navigation` as props should use the navigator-specific screen-prop type (`NativeStackScreenProps<RootStackParamList, 'Profile'>`) so both are typed together. For `useNavigation()` calls anywhere else in the tree, React Navigation's current docs recommend module-augmenting `@react-navigation/native`'s `RootNavigator` interface with the root stack's type rather than annotating every `useNavigation<T>()` call by hand — that single declaration makes `navigation.navigate('Profile', { userId })` type-check globally, catching both a misspelled route name and a missing/mistyped `userId` param at compile time.

```
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: { section?: string };
};

import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Global module augmentation so useNavigation()/Link/etc. are typed everywhere
type RootStackType = typeof RootStack;
declare module '@react-navigation/native' {
  interface RootNavigator extends RootStackType {}
}

// Typing a specific screen's route + navigation together
type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
function ProfileScreen({ route, navigation }: ProfileScreenProps) {
  const { userId } = route.params; // fully typed
  return null;
}

// Elsewhere, a plain useNavigation() call is now type-checked globally
function SomeButton({ userId }: { userId: string }) {
  const navigation = useNavigation();
  return (
    <Button title="Open profile" onPress={() => navigation.navigate('Profile', { userId })} />
  );
}
```

**References:**
- [React Navigation docs — TypeScript](https://reactnavigation.org/docs/typescript/)

---

### 5. After a user logs out from a screen buried several levels deep in the navigation stack, the app should discard all navigation history and land cleanly on the `Home` screen. Implement this using React Navigation's navigation state reset APIs.

*Mid · Code Challenge*

**Answer:** Dispatch a `CommonActions.reset` (or the equivalent `navigation.reset(...)`) action with a new state containing only the `Home` route at index 0 — this replaces the entire navigation state outright, so the previous screens are gone from history and the back button/gesture has nothing to go back to.

**Why:** A plain `navigation.navigate('Home')` or even `navigation.popToTop()` isn't enough here because they still leave the rest of the stack underneath — popToTop only pops back to the first screen *of the current stack*, it doesn't discard state across nested navigators or unrelated stacks the way a full reset does. `reset` takes an explicit `{ index, routes }` describing the entire new state you want, so setting `index: 0` with a single `{ name: 'Home' }` route means there is nothing before or after it in history. In an app using the conditional-auth-flow pattern, logging out is usually better modeled as flipping the auth state (so the whole authenticated navigator unmounts and the sign-in screen renders instead) rather than manually resetting — but for cases where you stay within the same navigator and just need to clear history back to one screen, `reset` is the direct tool.

```
import { CommonActions } from '@react-navigation/native';

function handleLogout(navigation: NavigationProp<RootStackParamList>) {
  signOut(); // clear auth token / storage

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    })
  );
}
```

**References:**
- [React Navigation docs — CommonActions (reset)](https://reactnavigation.org/docs/navigation-actions/)

---

### 6. Which React Navigation hook lets a screen run logic specifically when that screen comes back into focus (e.g., navigating back to it from another screen)?

*Mid · Multiple Choice*

- useEffect
- useIsFocused or useFocusEffect
- useNavigationState
- useRoute

**Answer:** "useIsFocused or useFocusEffect" — both fire based on a screen's focus state; `useIsFocused` returns a reactive boolean you can branch on in render, while `useFocusEffect` runs an effect (with an optional cleanup) every time the screen focuses/unfocuses, mirroring `useEffect`'s shape.

**Why:** `useEffect` alone is wrong for this purpose — it only reruns based on its dependency array changing, with no awareness of navigation focus at all, so a screen that's still mounted (common in Stack/Tab navigators, which keep prior screens mounted) wouldn't get notified when the user navigates back to it. `useNavigationState` is for reading the raw navigation state tree (e.g. the list of routes), not for detecting focus. `useRoute` just gives you the current screen's `route` object (name, params, key) and has nothing to do with focus timing. The two correct hooks serve different needs: `useFocusEffect` for imperative side effects (subscribing to a listener, refetching data) on focus/blur, and `useIsFocused` when you need the boolean value inline in render logic, e.g. to pause a video only while its screen isn't focused.

**References:**
- [React Navigation docs — useFocusEffect](https://reactnavigation.org/docs/use-focus-effect/)
- [React Navigation docs — useIsFocused](https://reactnavigation.org/docs/use-is-focused/)

---

### 7. What is the primary purpose of the `linking` config object passed to `NavigationContainer`?

*Mid · Multiple Choice*

- Configuring the color theme shared across all navigators
- Mapping deep link URLs to specific screens and their params
- Enabling gesture-based swipe navigation between tabs
- Persisting the navigation state to AsyncStorage automatically

**Answer:** "Mapping deep link URLs to specific screens and their params" — the `linking` config tells `NavigationContainer` how to translate an incoming URL (or, on web, the browser's address bar) into a specific screen and its route params.

**Why:** It has nothing to do with theming, gestures, or persistence — those are separate concerns handled elsewhere (theming via a `theme` prop, gestures via each navigator's own gesture config, and state persistence via a separate `onStateChange`/`initialState` pairing with your own storage, not `linking`). Concretely, `linking.prefixes` lists the URL schemes/domains your app should respond to (`myapp://`, `https://myapp.com`), and `linking.config.screens` maps route names to URL path patterns (`{ Profile: 'user/:id' }`), so opening `myapp://user/42` navigates straight to the `Profile` screen with `params: { id: '42' }`. On web builds, the same config also keeps the browser's URL bar in sync with in-app navigation via the History API.

**References:**
- [React Navigation docs — Configuring links](https://reactnavigation.org/docs/configuring-links/)

---

### 8. How would you architect navigation for an app with separate authenticated and unauthenticated flows, nested tab/stack navigators, and role-based access to certain screens?

*Senior · Conceptual*

**Answer:** I'd use a single root Stack Navigator with the auth/unauth screens rendered conditionally based on auth state — not two separate root navigators switched by an `if` — because React Navigation's own guidance is that a single Stack with a conditional inside gives proper transition animations and automatic redirects when the auth state changes, whereas swapping entire navigator trees causes the whole tree to remount and loses that behavior. Inside the authenticated branch, I'd nest a Tab Navigator for the app's main sections, each tab getting its own Stack for drill-down flows. Role-based access I'd handle as a guard at the screen level (a wrapper component or a custom hook like `useRequireRole('admin')` that redirects or renders a 403 state) rather than trying to build it into the navigator config itself, since React Navigation doesn't have first-class role-based routing — the config only knows about auth state you feed it.

**Why:** The three-state auth pattern React Navigation recommends is `isLoading` (checking for a persisted token on launch), `isSignedIn`/`userToken` (the resolved auth state), and a splash/loading screen shown while `isLoading` is true so the app doesn't flash the wrong root screen before the token check resolves. A common mistake is manually calling `navigation.navigate('Home')` right after login — with the conditional-screens pattern, React Navigation handles that transition automatically once the screens re-render based on the new auth state, and manually navigating to a screen that's about to be unmounted from the tree can throw. For role-based access on top of that, I'd keep the concern separate: auth state gates which *navigator tree* is even reachable, while role checks gate individual *screens* within the authenticated tree, since mixing the two into the same conditional quickly becomes unmanageable as the number of roles grows.

**References:**
- [React Navigation docs — Authentication flows](https://reactnavigation.org/docs/auth-flow/)
- [React Navigation docs — Nesting navigators](https://reactnavigation.org/docs/nesting-navigators)

---

### 9. How do you decide between React Navigation and alternatives (e.g. Expo Router, or a fully native navigation stack) for a large-scale, performance-sensitive React Native app?

*Senior · Open Question*

**Answer:** For most product teams I'd default to React Navigation — it's the most battle-tested, has the deepest third-party library support (Reanimated-based transitions, gesture handlers, testing utilities), and gives full manual control over the navigator tree. I'd reach for Expo Router specifically when the project is already Expo-managed and wants file-based routing and automatic universal deep linking/web support out of the box — it's a separate routing library built directly on top of React Native Screens (not layered on top of React Navigation; the two are alternatives, not underlying/dependent), so choosing it is a genuinely different configuration model (file-based routes vs. manually-defined navigators), not a thin skin over the same runtime. It's more prescriptive, which is a net win for a greenfield app but can fight an existing codebase's conventions. A fully native navigation stack (UIKit/Jetpack Navigation driven, with RN screens mounted into it) is a much bigger investment I'd only justify for an app where navigation transitions and native screen lifecycle integration are core to the product's feel and profiling has shown React Navigation's JS-driven transitions are a measurable bottleneck — for the large majority of apps, React Navigation's native-stack implementation (backed by `react-native-screens`, using real native `UIViewController`/`Fragment` transitions) already gets you native-level performance without that cost.

**Why:** A common misconception is that React Navigation is inherently 'less native' than a fully native solution — with the native-stack navigator (the current default for stack navigation), screen transitions are driven by native APIs, not JS-thread animations, so the performance gap versus a hand-rolled native stack is small for typical apps. It's worth being precise about Expo Router's relationship to React Navigation, since it's easy to misstate: Expo's own docs describe Expo Router as 'built on top of React Native Screens' and explicitly frame React Navigation as an alternative you can choose instead ('You can use any other navigation library, like React Navigation, in your Expo project... Choose whichever model fits your project') — not as a dependency Expo Router sits on top of. The real decision drivers in practice are: team familiarity and existing investment (rewriting navigation is high-risk, low-visible-reward for an established app), whether the app needs true web support (Expo Router's universal routing story is stronger here), and whether the org's build pipeline is Expo-managed or bare RN (Expo Router assumes the Expo toolchain). I'd only escalate to a fully custom native navigation layer for genuinely unusual requirements — e.g. embedding RN screens inside a much larger native app that already owns navigation — since it forfeits the ecosystem of navigation-aware libraries (deep linking, RN Testing Library navigation mocks, Reanimated shared-element transitions) that assume React Navigation's APIs.

**References:**
- [React Navigation docs — Getting started](https://reactnavigation.org/docs/getting-started/)
- [Expo docs — Introduction to Expo Router](https://docs.expo.dev/router/introduction/)

---

## Performance

### 1. A FlatList rendering 500 items starts to stutter when scrolled quickly. What are the first few FlatList props you'd check or tune, and why?

*Junior · Conceptual*

**Answer:** First I'd check `keyExtractor` (a stable, unique key per item — not the array index if the list can reorder/filter), then whether `renderItem` and the row component are memoized (`React.memo` plus stable callback props via `useCallback`, so unchanged rows don't re-render), and then the tuning props that affect how much work happens per scroll frame: `getItemLayout` if every row is a fixed height, and the batching props `initialNumToRender`/`maxToRenderPerBatch`/`windowSize` to control how much gets rendered ahead of the visible viewport.

**Why:** A `FlatList` is already virtualized — it only mounts items near the visible viewport — so stutter usually comes from either (a) the *work per item* being too expensive (unmemoized row components re-rendering unnecessarily, or heavy synchronous work inside `renderItem`), or (b) the *virtualization window* being tuned wrong for the content (rendering too much ahead of time floods the JS thread during fast scrolling, while rendering too little causes visible blank cells). `getItemLayout` is a particularly high-leverage fix when applicable, since it lets FlatList skip an async layout-measurement pass entirely and jump straight to any offset (also enabling `scrollToIndex`); `removeClippedSubviews` (default `true` on Android) can help further by detaching offscreen native views, though it has known issues with absolutely-positioned or transformed children on iOS.

**References:**
- [React Native docs — Optimizing FlatList Configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration)

---

### 2. What's the difference between `React.memo`, `useMemo`, and `useCallback`, and when does using them actually help performance versus just add overhead?

*Mid · Conceptual*

**Answer:** `React.memo` wraps a component and skips re-rendering it when its props are shallow-equal to the last render (it still re-renders on its own state or context changes). `useMemo` caches the *result* of an expensive computation between renders, recomputing only when its dependencies change. `useCallback` caches a *function reference* itself, so the same function identity is reused across renders instead of a new closure being created every time. They only pay off when two things are both true: the wrapped work is genuinely expensive (or the referential stability specifically matters, e.g. as a prop to a memoized child or a `useEffect` dependency), and the inputs actually stay the same often enough for the cache to be hit — wrapping cheap components/values in memoization adds comparison overhead and code complexity for no benefit, and can even make things slightly slower.

**Why:** A common trap is memoizing a component with `React.memo` while still passing it a prop that's a new object/array/function literal created inline on every render (`style={{ padding: 8 }}`, `onPress={() => doThing()}`) — the shallow-equality check fails every time regardless, so the memoization does nothing except add a wasted comparison. That's exactly why `useCallback`/`useMemo` are paired with `React.memo` in practice: memoizing the child alone isn't enough if its inputs are re-created every render. React's own guidance is to profile before reaching for these hooks — default to simple, unmemoized code, and add memoization specifically where profiling (React DevTools Profiler / Flipper) shows a component re-rendering often with unchanged props and doing real work in that render.

```
const ProductCard = React.memo(function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: (id: string) => void;
}) {
  return <Card title={product.name} onPress={() => onPress(product.id)} />;
});

function ProductList({ products }: { products: Product[] }) {
  // useCallback keeps this function reference stable across renders,
  // so ProductCard's React.memo check actually has a chance to succeed.
  const handlePress = useCallback((id: string) => {
    navigation.navigate('ProductDetails', { id });
  }, [navigation]);

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <ProductCard product={item} onPress={handlePress} />}
    />
  );
}
```

**References:**
- [React docs — memo](https://react.dev/reference/react/memo)
- [React docs — useCallback](https://react.dev/reference/react/useCallback)
- [React docs — useMemo](https://react.dev/reference/react/useMemo)

---

### 3. What is Hermes, and how does enabling it typically affect a React Native app's startup time and memory usage?

*Mid · Conceptual*

**Answer:** Hermes is Meta's open-source JavaScript engine built specifically for React Native, and it's the default engine as of current React Native releases (no extra setup needed). Its key trick is compiling JS to Hermes bytecode ahead of time at build time, so the app doesn't have to parse and compile raw JavaScript on every cold start — the docs report this typically improves startup time and reduces memory usage compared to running the same app on JavaScriptCore, especially noticeable on lower-end Android devices where JS parsing used to be a real bottleneck.

**Why:** The 'ahead of time' part matters: with a traditional JS engine, the device has to parse and JIT-compile your whole bundle's JS text at startup every time; Hermes shifts that cost to build time, shipping a precompiled `.hbc` bytecode file that the runtime can start executing close to immediately. This trades a slightly larger/slower build step for a consistently faster, more memory-efficient runtime, which is why the official recommendation is to always test these effects in a release build — development builds don't reflect Hermes' real startup/memory profile since dev builds skip some production optimizations. Because it's now the default, most currently-created RN apps already get these benefits without any configuration; you'd only encounter the older JavaScriptCore engine in an app that's explicitly opted out or hasn't upgraded in a long time.

**References:**
- [React Native docs — Hermes](https://reactnative.dev/docs/hermes)

---

### 4. A `ProductCard` component re-renders every time its parent `ProductList` re-renders, even when that specific product's data hasn't changed. Refactor `ProductCard` and its parent so `ProductCard` only re-renders when its own props actually change.

*Mid · Code Challenge*

**Answer:** Wrap `ProductCard` in `React.memo` so it skips re-rendering when its own props haven't changed, and make sure `ProductList` actually passes it stable props — the specific `product` object for that row (not a freshly-derived object built inline every render) and any callback props wrapped in `useCallback` so they keep the same reference across `ProductList` re-renders.

**Why:** `React.memo` alone is not sufficient if the parent keeps handing the child new object/function references on every render — the shallow-equality check that `memo` performs will always see 'different' props and re-render anyway, which is the single most common reason memoization 'doesn't work.' The fix has two matched halves: `ProductCard` needs to be wrapped in `memo`, and `ProductList` needs to stop creating new inline objects/closures for that row's props on every render (extracting a stable per-item callback via `useCallback`, and passing `item` directly from `renderItem` rather than spreading/reshaping it into a new object each time).

```
const ProductCard = React.memo(function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (id: string) => void;
}) {
  return (
    <Card>
      <Text>{product.name}</Text>
      <Button title="Add to cart" onPress={() => onAddToCart(product.id)} />
    </Card>
  );
});

function ProductList({ products }: { products: Product[] }) {
  const handleAddToCart = useCallback((id: string) => {
    addToCart(id);
  }, []);

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProductCard product={item} onAddToCart={handleAddToCart} />
      )}
    />
  );
}
```

**References:**
- [React docs — memo](https://react.dev/reference/react/memo)
- [React docs — useCallback](https://react.dev/reference/react/useCallback)

---

### 5. Which FlatList prop lets React Native skip the expensive per-item layout measurement pass, assuming all items share the same known height?

*Mid · Multiple Choice*

- initialNumToRender
- getItemLayout
- windowSize
- removeClippedSubviews

**Answer:** "getItemLayout" — it lets you tell FlatList each item's exact size/offset up front, so it can skip the async layout-measurement pass entirely for lists where every item is a known, fixed size.

**Why:** `initialNumToRender` only controls how many items are rendered on first mount, not whether measurement is skipped. `windowSize` controls how large the render window around the viewport is, again independent of the measurement strategy. `removeClippedSubviews` is a native-view-detachment optimization, unrelated to layout measurement. `getItemLayout` is the one prop specifically documented as removing the need for dynamic measurement — it also unlocks reliable `scrollToIndex`/`scrollToItem` behavior, since FlatList can compute any item's position analytically instead of needing it to have already been measured.

**References:**
- [React Native docs — Optimizing FlatList Configuration (getItemLayout)](https://reactnative.dev/docs/optimizing-flatlist-configuration)

---

### 6. What is the primary performance benefit of the Hermes JavaScript engine over JavaScriptCore for React Native apps on Android?

*Mid · Multiple Choice*

- Hermes compiles JavaScript to native ARM machine code ahead of time
- Hermes precompiles JS to bytecode ahead of time, reducing parse/compile time and improving startup and memory footprint
- Hermes eliminates the need for a JS thread entirely
- Hermes automatically parallelizes all JavaScript execution across CPU cores

**Answer:** "Hermes precompiles JS to bytecode ahead of time, reducing parse/compile time and improving startup and memory footprint" — that ahead-of-time compilation step is the core mechanism behind Hermes' documented startup and memory advantages.

**Why:** Hermes doesn't compile to native ARM machine code (that would be a full AOT/JIT native compiler, not a bytecode VM) — it compiles to its own bytecode format, which is still interpreted by the Hermes VM at runtime, just without needing to parse/compile raw JS text first. It doesn't eliminate the JS thread — JS still runs on a dedicated JS thread, Hermes just changes how efficiently that thread starts executing. And it doesn't parallelize JS execution across cores — JavaScript remains single-threaded by design regardless of engine; Hermes' wins are in startup latency and memory, not multi-core parallelism.

**References:**
- [React Native docs — Hermes](https://reactnative.dev/docs/hermes)

---

### 7. How would you go about reducing a React Native app's JS bundle size, and what tools would you use to identify what's contributing the most weight?

*Senior · Conceptual*

**Answer:** First I'd measure, not guess: run a Metro bundle analysis (e.g. `npx react-native bundle` with `--sourcemap-output` fed into `source-map-explorer` or a similar visualizer) to see which packages/modules actually take up the most space in the final bundle. From there, the highest-leverage fixes are usually replacing a handful of oversized dependencies (a full-featured date/utility library where a smaller alternative or a few native `Intl` calls would do, or a UI kit importing every icon when only a handful are used), lazy-loading screen-level components with `React.lazy`/`Suspense` so code not needed at startup isn't parsed then, and enabling Metro's `inlineRequires` so `require()` calls are deferred until first use instead of eagerly evaluated at bundle load.

**Why:** Hermes changes the shape of this problem somewhat: because it precompiles to bytecode ahead of time, the traditional 'RAM bundles' technique (splitting the bundle into per-module chunks parsed only when executed) is now explicitly documented as unnecessary and unsupported when Hermes is enabled — Hermes bytecode is already loaded on-demand. So the current guidance centers on (1) using Hermes itself as the primary lever, (2) lazy-loading rarely-needed screens/components rather than bundling everything eagerly, (3) `inlineRequires` for cheap wins on modules that aren't needed at startup, and (4) actually auditing dependency weight with a bundle visualizer rather than assuming which packages are heavy — it's common to find one unexpectedly large transitive dependency (a moment/lodash-style library pulled in for one function) contributing disproportionately.

**References:**
- [React Native docs — Optimizing JavaScript loading](https://reactnative.dev/docs/optimizing-javascript-loading)
- [React Native docs — Hermes](https://reactnative.dev/docs/hermes)

---

### 8. Given a `FlatList` rendering list items with images and several nested components that currently has visible scroll jank, rewrite its configuration to make correct use of `getItemLayout`, `windowSize`, `removeClippedSubviews`, and `keyExtractor` to improve scroll performance.

*Senior · Code Challenge*

**Answer:** Give every row a stable, unique `keyExtractor` (an id field, not the array index); add `getItemLayout` if rows share a fixed height so FlatList can skip the async layout-measurement pass and jump straight to any offset; tune `windowSize` down from its default if the rows are heavy (images, nested components) to shrink how much off-screen content is kept mounted at once, trading a bit more blank-space risk for materially less memory/CPU pressure; and enable `removeClippedSubviews` (already default on Android) to detach off-screen native views from the hierarchy, while double-checking it doesn't clip anything using absolute positioning or transforms, which is a known iOS pitfall of that flag.

**Why:** `getItemLayout` is the single highest-leverage prop for a fixed-height list because it removes an entire async measurement round-trip per item — FlatList no longer has to wait for a row to render before knowing where the next one starts. `windowSize` (measured in viewport heights, default 21 — 10 above, 10 below, plus 1 visible) directly trades memory for blank-space risk: lowering it reduces how many expensive image-heavy rows are mounted simultaneously, which matters a lot for this scenario since each row carries images and nested components; too low a value, though, means fast flicks can outrun the render window and show blank cells briefly. `removeClippedSubviews` gives a further native-side assist by detaching (not destroying) offscreen views from the native tree, reducing the work the native renderer has to do, but it's worth verifying visually on iOS since it has documented issues with certain layouts.

```
const ITEM_HEIGHT = 96;

function ProductList({ products }: { products: Product[] }) {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductRow product={item} />}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      windowSize={5}
      maxToRenderPerBatch={8}
      initialNumToRender={8}
      removeClippedSubviews
    />
  );
}

const ProductRow = React.memo(function ProductRow({ product }: { product: Product }) {
  return (
    <View style={{ height: ITEM_HEIGHT, flexDirection: 'row' }}>
      <Image source={{ uri: product.imageUrl }} style={{ width: 80, height: 80 }} />
      <Text>{product.name}</Text>
    </View>
  );
});
```

**References:**
- [React Native docs — Optimizing FlatList Configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration)

---

### 9. Walk me through your process for diagnosing and fixing a React Native screen that users report as 'laggy' — what tools do you reach for first, and how do you decide whether the bottleneck is JS-thread, UI-thread, or native-bridge related?

*Senior · Open Question*

**Answer:** I start by reproducing the lag on a release build (not dev mode, which has extra overhead that skews perception), then use React DevTools Profiler or Flipper's performance tooling to see whether components are re-rendering excessively during the janky interaction. If renders look fine, I check native tooling — Android's Perfetto/Systrace or Xcode Instruments — to see which thread (JS thread doing heavy synchronous work, UI/main thread doing expensive layout or overdraw, or the bridge/JSI boundary being hammered with too many small calls) is actually saturated during the janky window, since 'laggy' can mean any of those three and the fix is different for each.

**Why:** The diagnostic split matters because the fixes don't overlap: JS-thread bottlenecks (heavy synchronous computation, too many re-renders, unmemoized expensive components) are fixed with memoization, moving work off the critical path (`InteractionManager`, chunking), or offloading to a worklet/native module; UI-thread bottlenecks (deep view hierarchies, expensive layout passes, unnecessary overdraw from stacked semi-transparent views) are fixed by simplifying the native view tree, using `getItemLayout`-tuned lists, and reducing shadow/blur effects; bridge-related bottlenecks (frequent small JS↔native calls, e.g. driving an `Animated` value without `useNativeDriver` on every frame) are fixed by moving that communication off the bridge entirely — `useNativeDriver: true`, or migrating to Reanimated worklets that run on the UI thread without round-tripping through JS at all. I treat the profiler output as the source of truth rather than guessing, since the same symptom ('the screen feels janky') can come from any of the three, and optimizing the wrong layer wastes effort without moving the frame rate.

**References:**
- [React Native docs — Performance Overview](https://reactnative.dev/docs/performance)
- [React Native docs — Profiling](https://reactnative.dev/docs/profiling)

---

## State Management

### 1. What is React's Context API, and what kind of state is it well-suited for versus poorly suited for?

*Junior · Conceptual*

**Answer:** Context is React's built-in way to pass a value down the tree without threading it through props at every level — you create it with `createContext`, provide a value higher up, and read it with `useContext` anywhere below. It's well suited for state that's genuinely global-ish but changes rarely: theme, authenticated user, locale, feature flags. It's poorly suited for state that changes frequently (many times per second, like a scroll position or a live counter) or that only a small, unpredictable subset of the tree actually needs, because every component that consumes a Context re-renders on every update to that Context's value, regardless of which part of it they actually use.

**Why:** The re-render behavior is the crux of it: Context has no per-field subscription granularity — if you put `{ user, theme, cartCount }` in one Context, a component that only reads `theme` still re-renders every time `cartCount` changes, because React can't tell the two apart without you splitting them into separate Contexts. For low-frequency global values this cost is invisible; for high-frequency values (scroll position, animated values, live form state shared across many fields) it becomes a real performance problem, which is why those cases usually move to a dedicated state library (Zustand, Redux) with per-selector subscriptions, or in RN specifically, to Reanimated shared values that bypass React's render cycle entirely for UI-thread-driven values.

**References:**
- [React docs — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [React docs — Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

### 2. What problem does Redux Toolkit solve that hand-written Redux made painful, and what does `createSlice` generate for you under the hood?

*Mid · Conceptual*

**Answer:** Hand-written Redux required a lot of boilerplate to stay correct: manually writing action type constants, action creators, and a `switch`-based reducer that returns a brand-new object/array on every branch to preserve immutability — forgetting a single spread was a common, hard-to-spot bug. `createSlice` generates the reducer, matching action creators, and string action types for you from a single object of 'case reducer' functions, and it wraps each reducer with Immer so you can write code that *looks* like direct mutation (`state.items.push(item)`) while Immer produces a correctly immutable update behind the scenes.

**Why:** Concretely, `createSlice({ name, initialState, reducers })` returns `{ reducer, actions }`: `reducer` is ready to plug into `configureStore`, and `actions` contains one auto-generated action creator per key in `reducers`, each producing an action typed `"sliceName/reducerName"` (visible in Redux DevTools). The Immer integration is scoped to *inside* each case reducer only — you're still expected to treat state as immutable everywhere else (e.g. in selectors), and Immer only intercepts the draft object it hands you, so returning a completely new value from a case reducer (instead of mutating the draft) still works too, since Immer supports both styles. This combination is what let the Redux team position Redux Toolkit as 'the official, opinionated way to write Redux' — it removes almost all of the ceremony that made hand-written Redux tedious without changing Redux's underlying single-store, reducer-based model.

```
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  items: { id: string; qty: number }[];
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] } as CartState,
  reducers: {
    addItem(state, action: PayloadAction<{ id: string; qty: number }>) {
      state.items.push(action.payload); // looks mutable, Immer makes it immutable
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addItem, removeItem } = cartSlice.actions;
export default cartSlice.reducer;
```

**References:**
- [Redux Toolkit docs — createSlice](https://redux-toolkit.js.org/api/createSlice)

---

### 3. When would you reach for Zustand instead of Redux Toolkit or plain Context for state management in a React Native app?

*Mid · Conceptual*

**Answer:** I'd reach for Zustand when I want global state that's shared across distant parts of the tree but the app doesn't need Redux's full ceremony — middleware pipeline, DevTools time-travel, a strict action/reducer discipline for a large team, or a large ecosystem of Redux-specific tooling. Zustand's store is just a hook backed by a plain object with `set`/`get`, components subscribe via selectors so only the components reading a changed slice re-render (no Provider wrapping required, unlike Context), and there's very little boilerplate to set up a new store. Compared to Context specifically, Zustand avoids the 'every consumer re-renders on every update' problem entirely, which matters once the shared state updates more than occasionally.

**Why:** The practical dividing line: Context is fine for state that rarely changes and doesn't need cross-cutting selectors (theme, auth session); Zustand is a good middle ground when you need frequently-updating global state with fine-grained subscriptions but the team doesn't want Redux's structure; Redux Toolkit earns its overhead once the app has genuinely complex state interactions that benefit from a single normalized store, strict action-based debugging/time-travel, or a large team that benefits from Redux's conventions and DevTools ecosystem being enforced consistently. Zustand also has no dependency on React Context at all internally (it uses `useSyncExternalStore`), so a store can be read and updated even from outside a component (e.g. in an API client or a native event handler), which is awkward to do cleanly with Context.

**References:**
- [Zustand docs — Getting started](https://zustand.docs.pmnd.rs/learn/getting-started/introduction)

---

### 4. A component tree consumes a Context whose value updates on every scroll frame (e.g. a shared scroll position). Every consumer re-renders on each update, even ones that don't display anything related to scroll. Refactor the approach so unrelated consumers stop re-rendering.

*Mid · Code Challenge*

**Answer:** Stop routing the fast-changing scroll value through React Context/state at all. If it's only used to drive visual effects (a header fading/collapsing as you scroll), move it to a Reanimated `useSharedValue` updated by a `useAnimatedScrollHandler`, which lives outside React's render tree and updates on the UI thread — no React component re-renders on scroll at all. For the subset of consumers that genuinely need scroll position in JS-rendered UI, replace the single Context with a subscription-based external store (`useSyncExternalStore`, or a small Zustand store) so each consumer supplies its own selector and only re-renders when the specific slice it reads actually changes — components that never call the hook are unaffected, unlike every consumer of a `Context.Provider` re-rendering on every value change.

**Why:** The core problem with the original design is that Context has no per-field subscription granularity: any update to the Provider's value re-renders *every* component that calls `useContext(ScrollContext)`, even ones that don't touch the scroll value in their JSX. Splitting the Context into more Contexts wouldn't fix a single frequently-changing value — the fix has to change the subscription model itself, either by moving the value off the React render path entirely (Reanimated) or by using a store with selector-based subscriptions instead of Context.

```
// store.ts — external store with selector-based subscriptions
type Listener = () => void;
let scrollY = 0;
const listeners = new Set<Listener>();

export const scrollStore = {
  setScrollY(value: number) {
    scrollY = value;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => scrollY,
};

// useScrollY.ts — only re-renders components that call it
import { useSyncExternalStore } from 'react';
export function useScrollY() {
  return useSyncExternalStore(scrollStore.subscribe, scrollStore.getSnapshot);
}

// Unrelated components never call useScrollY(), so they never re-render
// when scrollStore.setScrollY() fires on every scroll frame.
```

**References:**
- [React docs — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React Native Reanimated docs — useAnimatedScrollHandler](https://docs.swmansion.com/react-native-reanimated/docs/scroll/useAnimatedScrollHandler/)

---

### 5. Write a Zustand store with a `cartItems: CartItem[]` array, an `addItem` action, and a `removeItem(id: string)` action, fully typed with TypeScript.

*Mid · Code Challenge*

**Answer:** Use Zustand's curried `create<T>()(...)` syntax with an interface covering both the state shape and its actions, and update the array immutably inside `set` (filter to remove, spread/append to add) so subscribers relying on shallow-equality selectors still see a changed reference.

**Why:** The curried `create<T>()(...)` form (an extra `()` before the store initializer) exists specifically so TypeScript can infer the store's type correctly without you having to annotate every `set`/`get` call by hand — without it, `set`'s parameter types often fall back to `unknown` or need manual casting. Each action reads the current array off `get()` or the `state` argument passed into `set`'s updater function and produces a new array rather than mutating `cartItems` in place, keeping consistent with the plain-immutable-update convention (Zustand doesn't wrap you in Immer by default the way Redux Toolkit does, though an Immer middleware is available if you want that style).

```
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  qty: number;
}

interface CartState {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cartItems: [],
  addItem: (item) =>
    set((state) => ({ cartItems: [...state.cartItems, item] })),
  removeItem: (id) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== id),
    })),
}));

// Usage: only re-renders when cartItems changes
const cartItems = useCartStore((state) => state.cartItems);
const addItem = useCartStore((state) => state.addItem);
```

**References:**
- [Zustand docs — Beginner TypeScript guide](https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript)

---

### 6. What is the main downside of using React Context for state that changes very frequently (e.g. many times per second)?

*Mid · Multiple Choice*

- Context values cannot hold objects, only primitives
- Every component consuming that Context re-renders on every update, regardless of which part of the value it actually uses
- Context requires a Redux store to function
- Context updates are asynchronous and can be delayed by several seconds

**Answer:** "Every component consuming that Context re-renders on every update, regardless of which part of the value it actually uses" — Context has no per-field subscription granularity, so a value updating many times per second forces every consumer to re-render that often too.

**Why:** Context can absolutely hold objects (that's the common case, not a limitation), so that option is simply false. It has no dependency on Redux whatsoever — Context is a plain React feature usable with any state approach, including no external library at all. Context updates aren't asynchronous or delayed either; they're applied synchronously within React's normal render/commit cycle, just like any other state update — the *problem* with high-frequency values is the opposite of delay: they cause re-renders too often, not too late.

**References:**
- [React docs — Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

### 7. In Redux Toolkit, what does `createAsyncThunk` primarily help you do?

*Mid · Multiple Choice*

- Automatically generate reducers for synchronous state updates
- Handle async logic (like an API call) and dispatch pending/fulfilled/rejected actions automatically
- Combine multiple slices into a single root reducer
- Persist the Redux store to disk between app launches

**Answer:** "Handle async logic (like an API call) and dispatch pending/fulfilled/rejected actions automatically" — `createAsyncThunk` wraps a promise-returning function and generates the three lifecycle action types for you, so you don't hand-write loading/success/error action creators yourself.

**Why:** It doesn't generate synchronous reducers (that's `createSlice`'s `reducers` field), doesn't combine slices (that's `combineReducers`/`configureStore`'s job), and has nothing to do with persisting the store to disk (that's a separate concern, typically handled by `redux-persist`). Concretely, `createAsyncThunk('users/fetchById', payloadCreator)` dispatches `users/fetchById/pending` immediately, then either `users/fetchById/fulfilled` (with the resolved value as `action.payload`) or `users/fetchById/rejected` (with the error) once the promise settles — you handle those three in a slice's `extraReducers` builder (`builder.addCase(fetchById.pending, ...)` etc.) to drive loading/error/data state without writing that plumbing by hand.

**References:**
- [Redux Toolkit docs — createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk)

---

### 8. How do you decide where a given piece of state should live — local component state, Context, or a global store like Redux/Zustand — in a mid-size React Native app?

*Senior · Conceptual*

**Answer:** I default to the narrowest scope that works and only widen it when there's a real, demonstrated need: local `useState`/`useReducer` for anything only one component (and maybe its direct children via props) cares about; Context for state that's genuinely cross-cutting but changes rarely and doesn't need per-field subscriptions (theme, current user, locale); and a global store (Redux Toolkit or Zustand) once state needs to be read/written from many unrelated parts of the tree, needs to persist or be inspected/debugged as a whole, or updates frequently enough that Context's blanket re-render behavior would hurt.

**Why:** The failure mode I actively avoid is reaching for a global store by default 'just in case' — it adds indirection (you can no longer tell what a component depends on just by reading its props) and makes local reasoning harder. The signal that state should move up is usually concrete: two siblings need to share it and lifting state to their common parent got awkward, or a piece of state needs to survive a component unmounting (e.g. cart contents surviving navigation). I also separate *server state* (data fetched from an API) from this decision entirely — it belongs in a caching layer like RTK Query or TanStack Query rather than in Redux/Zustand/Context as plain state, since server data has different lifecycle needs (staleness, refetching, request de-duplication) that a generic state container doesn't solve for you.

**References:**
- [React docs — Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [React docs — Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

### 9. Design the state management architecture for a mid-size e-commerce React Native app with cart, auth, and product catalog state — specifically, how would you separate server state (from an API) from client-only UI state?

*Senior · Open Question*

**Answer:** I'd split state into two categories with different tools: server-derived state (product catalog, order history, anything that originates from an API) goes through a caching layer purpose-built for it — RTK Query if the app is already on Redux Toolkit, since it gives automatic caching, request de-duplication, and refetch-on-focus/reconnect without hand-written thunks — while genuinely client-only UI state (cart contents before checkout, which tab is active, form drafts, auth token/session) lives in regular Redux slices (or Zustand stores) that I write by hand. Cart specifically I'd treat as client state even though it references product ids, since it's locally owned until checkout; auth state is also client state (a token plus derived `isAuthenticated`), even though it originates from a login API call, because after that call it behaves like ordinary session state, not a re-fetchable cache entry.

**Why:** The mistake this avoids is treating server data as if it were just more Redux state to `dispatch` updates into by hand — that reinvents loading/error/staleness tracking, cache invalidation, and re-fetch-on-focus logic that a dedicated data-fetching library already solves well, and it tends to produce Redux slices full of `isLoading`/`error` booleans duplicated per resource. The dividing question I use for any given piece of state is 'does this exist because the server told us, and can it become stale?' — if yes, it's server-cache state and belongs in RTK Query/TanStack Query; if it's something the user is actively editing or a purely local UI concern, it's client state and belongs in a slice/store. Product catalog and order history clearly fall in the first bucket; cart-before-checkout and auth session fall in the second, even though both eventually talk to a server.

**References:**
- [Redux Toolkit docs — RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux Toolkit docs — createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk)

---

## Native Modules & New Architecture

### 1. What is a native module in React Native, and why would a team need to write one instead of staying in pure JavaScript?

*Junior · Conceptual*

**Answer:** A native module is platform-specific code (Swift/Objective-C on iOS, Kotlin/Java on Android) that's exposed to JavaScript as a JS object/API, letting your RN app call into native SDKs or platform capabilities that aren't already available through React Native's built-in JS surface. Teams write one when they need to integrate a native-only SDK (a payment provider, a Bluetooth/health-sensor library, a proprietary analytics SDK), reach a platform API RN doesn't expose out of the box, or need to run compute-heavy work in native code for performance reasons the JS thread can't match.

**Why:** In practice, most teams never write a native module from scratch for common needs — the RN ecosystem already has native modules for cameras, storage, biometrics, etc. published as libraries, so 'writing a native module' is usually reserved for something genuinely unique to your app's requirements or not yet covered by an existing package. Under the New Architecture this is done as a TurboModule (a typed JS/TS spec plus generated native interfaces via Codegen); under the legacy architecture it's a Bridge-based `NativeModule` registered on each platform. Either way, the JS side sees a plain-looking object with methods — the complexity of marshaling data between JS and native (JSON serialization over the Bridge, or direct JSI calls in the New Architecture) is hidden behind that interface.

**References:**
- [React Native docs — Native Modules Intro (legacy)](https://reactnative.dev/docs/legacy/native-modules-intro)
- [React Native docs — Turbo Native Modules Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction)

---

### 2. What is the legacy Bridge architecture in React Native, and what specific problem does it create for performance-sensitive features like animations or camera processing?

*Mid · Conceptual*

**Answer:** The legacy Bridge is an asynchronous message-passing channel between the JS thread and the native side: every call in either direction gets serialized to JSON, placed on a queue, and processed in batches — there's no way for JS to call a native method and get a value back synchronously. That works fine for occasional calls (opening a modal, reading a stored value once) but breaks down for anything that needs many small, low-latency round trips, like driving an animation frame-by-frame from JS or streaming per-frame camera data: each hop pays JSON serialization cost and has to wait its turn in the batched queue, which shows up as dropped frames and lag exactly where smoothness matters most.

**Why:** This is precisely the gap the New Architecture's JSI was built to close: instead of a batched, serialized, one-way-at-a-time queue, JSI lets JS hold a direct reference to a native (C++) object and call its methods synchronously, in-place, with no JSON round trip. That's why the classic workaround under the legacy architecture for things like animations was to avoid the Bridge on the hot path entirely — `useNativeDriver: true` for the `Animated` API offloads the animation loop to the native side after the initial setup call, and libraries like Reanimated pre-date wide JSI adoption by shipping their own native/UI-thread execution model, precisely to route around the Bridge's async/serialized bottleneck for anything running every frame.

**References:**
- [React Native Blog — The New Architecture is Here](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here)
- [React Native Architecture — Glossary (JSI)](https://reactnative.dev/architecture/glossary)

---

### 3. What is JSI (JavaScript Interface), and how does it change the way JavaScript communicates with native code compared to the old Bridge?

*Mid · Conceptual*

**Answer:** JSI is a lightweight C++ API for embedding a JavaScript engine into a C++ application; React Native's New Architecture uses it so JS code can hold direct references to native ("host") objects and invoke their methods synchronously, in place, without going through the Bridge's serialization/batching queue. Where the old Bridge always meant 'stringify a message, queue it, deserialize it on the other side, eventually queue a response back,' JSI means JS can call `nativeObject.someMethod(arg)` and get a return value immediately, the same way it would call a plain JS function.

**Why:** The performance win isn't just 'synchronous vs asynchronous' — it's that JSI removes the JSON serialization step entirely, since JS and native share references to the same underlying C++ objects instead of exchanging copies as text. This is also engine-agnostic: JSI is not Hermes-specific, it's implemented as an API any JS engine can support (Hermes, JavaScriptCore, V8) to be usable with the New Architecture. JSI is the foundation both TurboModules (native modules invoked directly and lazily, instead of Bridge-registered and eagerly loaded) and Fabric (the renderer, which uses JSI to let React's C++ core manipulate the native view tree directly) are built on — it's the low-level plumbing, not a feature you use directly in app code.

**References:**
- [React Native Architecture — Glossary (JSI)](https://reactnative.dev/architecture/glossary)
- [React Native Architecture — Fabric Renderer](https://reactnative.dev/architecture/fabric-renderer)

---

### 4. What is the core architectural difference between the legacy Bridge and JSI in React Native?

*Mid · Multiple Choice*

- JSI replaces JavaScript with a compiled native language
- The Bridge uses asynchronous, batched, serialized (JSON) message passing between JS and native, while JSI allows JS to hold direct references to native objects and call methods synchronously
- JSI only works with the Hermes engine, while the Bridge works with any JS engine
- JSI removes the JavaScript thread and runs everything on the UI thread

**Answer:** "The Bridge uses asynchronous, batched, serialized (JSON) message passing between JS and native, while JSI allows JS to hold direct references to native objects and call methods synchronously" — this is the exact mechanism swap: message queue and JSON round trips versus direct, synchronous C++ object references.

**Why:** Option 1 is wrong — JSI doesn't touch the language JS code is written in at all; it's a C++ embedding API that JS engines implement, not a native-language compiler for app code. Option 3 is backwards from reality — JSI is engine-agnostic by design (it's an interface any JS engine can implement, including Hermes, JavaScriptCore, and V8), whereas the legacy Bridge is the one that works uniformly across engines simply because it doesn't depend on engine-level embedding at all. Option 4 is wrong — JS still runs on its own JS thread under the New Architecture; JSI changes *how* JS communicates with native code, it doesn't collapse the JS and UI threads into one.

**References:**
- [React Native Architecture — Glossary (JSI)](https://reactnative.dev/architecture/glossary)

---

### 5. What are TurboModules and Fabric, and why does the React Native team describe them as a 'New Architecture' rather than incremental improvements to the old Bridge?

*Senior · Conceptual*

**Answer:** TurboModules are the New Architecture's replacement for native modules: each one is defined by a typed JS/TypeScript spec, and Codegen generates the matching native (Java/Kotlin, Objective-C/Swift) interfaces from it, with JS calling into native directly over JSI instead of through the Bridge's serialized queue — and unlike the old Bridge, which eagerly instantiated every registered native module at startup, TurboModules are lazily loaded, only initialized the first time JS actually references them. Fabric is the New Architecture's renderer: it replaces the old UIManager/Shadow-tree pipeline with a C++ core shared across platforms, using JSI to let React manipulate the native view tree synchronously instead of asynchronously batching view-update commands over the Bridge. It's called a 'New Architecture' rather than an incremental change because it swaps out the fundamental communication mechanism (Bridge → JSI) and the rendering pipeline (UIManager → Fabric) at the same time — existing Bridge-based native modules and legacy components need to be rewritten or run through an interop layer to take advantage of it, it isn't a drop-in performance patch on the existing system.

**Why:** TurboModules and Fabric became the default for newly created apps in React Native 0.76, but as of React Native 0.82 (October 2025) the New Architecture is no longer just the default — it's the *only* supported runtime. RN 0.82 removed the Legacy Architecture outright: setting `newArchEnabled=false` on Android or `RCT_NEW_ARCH_ENABLED=0` on iOS is now simply ignored, and the app runs on the New Architecture regardless. RN 0.81 (and Expo SDK 54) were the last releases that still allowed opting into the Legacy Bridge. So adopting TurboModules/Fabric isn't a discretionary migration for apps on a current RN version anymore — it's mandatory to stay on a supported release at all. What's still genuinely in progress is third-party library readiness (some native modules haven't shipped New Architecture support or an interop shim yet) and the population of apps still pinned to RN ≤0.81 because they haven't migrated. The two pieces remain complementary but separable concepts: TurboModules solve the 'call native code from JS' problem, Fabric solves the 'render and update the native view tree' problem, and Codegen is the shared tooling (a TS/Flow spec compiled to native interfaces) that keeps both type-safe across the JS/native boundary.

**References:**
- [React Native docs — Turbo Native Modules Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction)
- [React Native Architecture — Fabric Renderer](https://reactnative.dev/architecture/fabric-renderer)
- [React Native Blog — React Native 0.82 (New Architecture as only supported runtime)](https://reactnative.dev/blog/2025/10/08/react-native-0.82)

---

### 6. Outline, in pseudocode or a structured description, how you'd expose a native method — say, reading the device's current battery level — as a TurboModule, including the TypeScript spec file the codegen tooling needs.

*Senior · Code Challenge*

**Answer:** First write a TypeScript spec file declaring the module's shape (extending `TurboModule`, with a method like `getBatteryLevel(): Promise<number>`) and register it with `TurboModuleRegistry.getEnforcing`. Then add a `codegenConfig` entry to `package.json` pointing Codegen at that spec, which generates the platform-specific native interfaces (a Java/Kotlin abstract class on Android, an Objective-C protocol on iOS) your native implementation must conform to. Finally, write the actual native implementation — reading `UIDevice.current.batteryLevel` on iOS or `BatteryManager` on Android — inside a class that implements the generated interface, and register that class with the native module registry so the JS spec resolves to it at runtime.

**Why:** The spec file is the contract: everything downstream (native interface generation, type-checking on the JS side, the shape of what `NativeBatteryModule.getBatteryLevel()` resolves to) is derived from it, which is what lets TurboModules catch a mismatched type or a renamed method at build time instead of failing silently at runtime the way an untyped Bridge module could. Note the return type is a `Promise<number>`, not a raw synchronous number — even under the New Architecture, most TurboModule methods that cross into platform APIs (which are often themselves async, like reading a sensor) are still modeled as async from the JS side; JSI enables synchronous calls where useful, but it doesn't force every native call to become synchronous.

```
// specs/NativeBatteryModule.ts
import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  getBatteryLevel(): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeBatteryModule');

// package.json (excerpt)
// "codegenConfig": {
//   "name": "NativeBatteryModuleSpec",
//   "type": "modules",
//   "jsSrcsDir": "specs",
//   "android": { "javaPackageName": "com.nativebatterymodule" }
// }

// android/.../NativeBatteryModule.kt (implements the Codegen-generated spec)
// class NativeBatteryModule(reactContext: ReactApplicationContext) :
//     NativeBatteryModuleSpec(reactContext) {
//   override fun getBatteryLevel(promise: Promise) {
//     val batteryManager = reactApplicationContext
//       .getSystemService(Context.BATTERY_SERVICE) as BatteryManager
//     val level = batteryManager.getIntProperty(
//       BatteryManager.BATTERY_PROPERTY_CAPACITY
//     )
//     promise.resolve(level)
//   }
// }

// Usage from JS
import NativeBatteryModule from './specs/NativeBatteryModule';
const level = await NativeBatteryModule.getBatteryLevel();
```

**References:**
- [React Native docs — Turbo Native Modules Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction)

---

### 7. Which of the following is a benefit of the Fabric renderer over the legacy renderer?

*Senior · Multiple Choice*

- It eliminates the need for a native UI layer entirely
- It allows synchronous, direct manipulation of the native view tree from JS via JSI instead of going through the async Bridge
- It automatically rewrites class components into functional components
- It replaces Flexbox layout with CSS Grid

**Answer:** "It allows synchronous, direct manipulation of the native view tree from JS via JSI instead of going through the async Bridge" — Fabric's C++ core uses JSI so React can update the native view tree directly and synchronously, which is also what enables consistent, thread-safe layout when embedding RN views inside a host native screen.

**Why:** Option 1 is wrong — Fabric still renders to real native platform views (host views); it doesn't remove the native UI layer, it changes how React talks to it. Option 3 is wrong and unrelated — Fabric is a rendering-pipeline change, not a codemod or migration tool for component style; class components still render through Fabric exactly like functional ones. Option 4 is wrong — layout is still computed by Yoga's Flexbox implementation; Fabric changed the C++ rendering core and its communication mechanism, not the layout algorithm itself.

**References:**
- [React Native Architecture — Fabric Renderer](https://reactnative.dev/architecture/fabric-renderer)

---

### 8. As of today, the New Architecture is still mid-rollout across the React Native ecosystem. How would you evaluate whether to migrate an existing production app to it, and what risks would you flag to stakeholders?

*Senior · Open Question*

**Answer:** I'd reframe the question for stakeholders first: as of React Native 0.82, the New Architecture is the only supported runtime — RN 0.81/Expo SDK 54 were the last releases that allow the Legacy Bridge, and versions after that ignore any attempt to opt out. So for a team still on Legacy Architecture, this isn't 'should we migrate,' it's 'we're already stuck on an unsupported RN version — how urgently do we need to get off it,' since staying put means no further RN releases, no security patches, and growing incompatibility with newer native libraries. From there I'd do an inventory, not a debate: audit every third-party native dependency, check which already support the New Architecture or have an interop shim, and flag any that look abandoned, since a single unmaintained native module can be the long pole in the whole migration. I'd also assess how much native-interop and animation-heavy surface area the app has, since that's where regressions are most likely to show up during the migration, and use that to size the QA effort realistically rather than treating it as a drop-in bump.

**Why:** The New Architecture became the default for new RN projects in 0.76, but the migration calculus changed materially with 0.82 (October 2025): it's no longer a choice between 'get it for free on a new app' vs. 'skip it on an existing one' — an app that hasn't migrated is now permanently capped on RN 0.81 (or Expo SDK 54), unable to take any future RN release, security fix, or platform-compatibility update (e.g. new iOS/Android SDK requirements that ship in later RN versions). That reframes the stakeholder conversation from a discretionary performance investment to an urgency/risk-of-staying-still assessment. Once the decision to migrate is made (which, practically, it now must be to stay current), I'd still treat the migration itself as a staged rollout rather than a flag flip: validate on an internal/beta build first, watch crash-reporting and performance metrics closely post-migration since some issues (subtle layout/measurement timing changes under Fabric, less battle-tested versions of third-party native libraries) only surface at scale, and keep an explicit rollback plan given how much of the runtime changes at once. The genuinely open variable today is third-party library readiness — some native modules still lack New Architecture support or an interop shim, and that's the real blocker worth flagging to stakeholders, not whether the migration itself is worth doing.

**References:**
- [React Native docs — Turbo Native Modules Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction)
- [React Native Architecture — Overview](https://reactnative.dev/architecture/overview)
- [React Native Blog — React Native 0.82 (New Architecture as only supported runtime)](https://reactnative.dev/blog/2025/10/08/react-native-0.82)

---

## Networking & Persistence

### 1. What's the practical difference between using the built-in `fetch` API and a library like Axios in a React Native app?

*Junior · Conceptual*

**Answer:** `fetch` is built into React Native (a WHATWG-compatible implementation, no extra dependency needed) and returns a Promise you resolve to a `Response` object — but it only rejects on network-level failures, not on HTTP error status codes, so a 404 or 500 response still resolves successfully and you have to check `response.ok`/`response.status` yourself. Axios is a third-party library, built on top of RN's `XMLHttpRequest` implementation, that adds conveniences fetch doesn't have out of the box: it rejects the promise automatically on non-2xx status codes, auto-parses JSON responses without an explicit `.json()` call, supports request/response interceptors, and has built-in request cancellation.

**Why:** The 'fetch doesn't reject on HTTP errors' behavior trips up a lot of developers coming from Axios or other HTTP clients — code that does `try { const res = await fetch(url); const data = await res.json(); } catch {}` will silently treat a 500 error page's body as if it were valid data unless you explicitly check `res.ok` first and throw/handle it yourself. React Native's networking docs note that `XMLHttpRequest` is also available as a built-in, which is what lets third-party libraries like Axios (or older ones like `frisbee`) work in RN without any special polyfilling — they're written against the browser-standard XHR/fetch surface RN already implements. In practice, teams often end up building a thin wrapper around `fetch` (checking `res.ok`, adding default headers, centralizing auth-token injection) that ends up replicating a chunk of what Axios gives for free, which is the main practical argument for pulling in the dependency on a larger app.

**References:**
- [React Native docs — Networking](https://reactnative.dev/docs/network)

---

### 2. What is AsyncStorage used for, and what are its main limitations around data size, performance, and synchronous access?

*Junior · Conceptual*

**Answer:** AsyncStorage is a simple, unencrypted, persistent key-value store for small pieces of data — user preferences, feature-flag values, a cached auth token, onboarding-seen flags — not a database for large or structured datasets. Every value is stored and read as a string (so objects need manual `JSON.stringify`/`JSON.parse`), every operation is Promise-based with no synchronous read/write API at all, and because it's unencrypted, sensitive values like auth tokens are better kept in a platform secure-storage wrapper (Keychain on iOS, Keystore-backed storage on Android) rather than plain AsyncStorage.

**Why:** The lack of a synchronous API is a real practical constraint: if you need a value available before the first render (e.g. deciding which screen to show on launch based on a stored auth token), you can't just read it inline — you have to gate rendering behind a loading state until the async read resolves. It's also worth noting that `AsyncStorage` has been removed from React Native core entirely; what most projects use today under that name is the community-maintained `@react-native-async-storage/async-storage` package, which keeps the same Promise-based API but is backed by SQLite on native platforms and IndexedDB on web. For workloads needing frequent reads/writes or synchronous access, MMKV is the more modern alternative — see the related question on that trade-off.

**References:**
- [React Native docs — AsyncStorage (removed from core, see community package)](https://reactnative.dev/docs/asyncstorage)
- [async-storage — README](https://github.com/react-native-async-storage/async-storage)

---

### 3. Which HTTP status code range typically indicates a client error that your app's error handling should distinguish from a network/connectivity failure?

*Junior · Multiple Choice*

- 1xx
- 2xx
- 3xx
- 4xx

**Answer:** "4xx" — codes like 400 (bad request), 401/403 (auth), and 404 (not found) mean the server received and understood the request but rejected it for a reason on the client's side, which is a fundamentally different situation from the device having no network connection at all.

**Why:** 1xx codes are informational/interim responses (like 100 Continue) that app code essentially never has to handle directly. 2xx codes indicate success, the opposite of an error. 3xx codes indicate redirection, which `fetch`/HTTP clients typically follow automatically rather than surfacing as an error condition to handle. The distinction that matters practically in an RN app: a 4xx response means the request *reached* the server and got a defined, actionable answer (fix the payload, log the user back in, the resource doesn't exist) — the UI can show a specific, meaningful message. A network failure (no connectivity, DNS failure, timeout) never got a response at all, so it needs a different message and typically a retry affordance rather than 'fix your input.' Conflating the two (e.g. showing 'check your internet connection' for a 401) is a common and confusing bug in real apps.

**References:**
- [MDN — HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

### 4. Why has the community largely moved from the deprecated core `AsyncStorage` toward packages like `@react-native-async-storage/async-storage` or MMKV, and what does MMKV offer that AsyncStorage doesn't?

*Mid · Conceptual*

**Answer:** The original `AsyncStorage` bundled inside React Native core was removed from core entirely, so anything using that name today is really the community-maintained `@react-native-async-storage/async-storage` package — teams moved to it simply to keep a working, maintained storage API after the core removal. MMKV is a separate, further step some teams take beyond that: it's a JSI-backed key-value store (originally built by WeChat, wrapped for RN by `react-native-mmkv`) that performs reads/writes synchronously in native C++ with no Promise/Bridge round trip at all, and its own benchmarks put it roughly 30x faster than AsyncStorage for typical operations — useful when a screen needs to read a stored value synchronously (e.g. at startup, before first render) or does frequent small reads/writes where AsyncStorage's async overhead adds up.

**Why:** It's worth keeping the two migrations conceptually separate: 'core `AsyncStorage` → community `@react-native-async-storage/async-storage`' is a like-for-like replacement of a removed API with an actively maintained equivalent (same async, string-based, Promise API, just no longer part of RN core, backed by SQLite/IndexedDB depending on platform). 'AsyncStorage-style storage → MMKV' is a genuinely different trade-off: MMKV trades async/Promise ergonomics for raw speed and synchronous access by dropping down to JSI, and also supports extras like built-in encryption and multiple named storage instances that the AsyncStorage-style API doesn't offer. Teams that don't have a specific performance or synchronous-access need often stay on the async-storage package since its API is simpler and it's the more battle-tested default; MMKV earns its added complexity specifically when storage access frequency or startup-blocking synchronous reads become a measured problem.

**References:**
- [async-storage — README](https://github.com/react-native-async-storage/async-storage)
- [react-native-mmkv — README](https://github.com/mrousavy/react-native-mmkv)

---

### 5. Write a hook `useApi<T>(url: string)` that fetches JSON data from `url`, exposes `data`, `loading`, and `error` state, and cancels the in-flight request if the component unmounts before the fetch resolves.

*Mid · Code Challenge*

**Answer:** Kick off the fetch inside a `useEffect` keyed on `url`, track `data`/`loading`/`error` in state, and pass an `AbortController`'s signal into `fetch` so the request itself is cancelled (not just ignored) when the effect's cleanup runs on unmount or before a new `url` re-triggers the effect.

**Why:** Two things matter here beyond a naive fetch-in-an-effect: first, `fetch` still resolves 'successfully' on HTTP error statuses, so the hook has to explicitly check `response.ok` and throw to land in the error state — otherwise a 404/500 JSON error body would be treated as valid `data`. Second, `AbortController` is the more complete fix over a boolean 'isActive' guard (see the related unmount-state-update question) because it actually tells the network layer to stop the request, rather than just suppressing the resulting `setState` after the fact; the `AbortError` that `fetch` throws when aborted has to be filtered out of the error state, since that's an intentional cancellation, not a real failure to surface to the user.

```
import { useEffect, useState } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useApi<T>(url: string): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<T>;
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: Error) => {
        if (error.name === 'AbortError') return; // expected on unmount/url change
        setState({ data: null, loading: false, error });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}
```

**References:**
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React Native docs — Networking](https://reactnative.dev/docs/network)

---

### 6. A settings screen currently reads and writes user preferences with `AsyncStorage.getItem`/`setItem` plus `JSON.parse`/`stringify` on every single keystroke of a text field, causing visible input lag. Refactor the persistence logic to fix the performance problem.

*Mid · Code Challenge*

**Answer:** Separate the two concerns that got fused together: keep the text field's value in local component state so typing updates the UI instantly with zero I/O, and debounce the actual `AsyncStorage` write so it only fires a few hundred milliseconds after the user stops typing, instead of on every keystroke.

**Why:** The lag comes from doing a full async round trip — `JSON.parse` the existing blob, mutate it, `JSON.stringify` it back, and await `AsyncStorage.setItem` — synchronously in response to every single `onChangeText` call, which is far more I/O and serialization work than a text field needs per keystroke. The fix doesn't require abandoning `AsyncStorage`; debouncing the write is sufficient on its own. If this screen (or the app generally) does frequent settings reads/writes beyond just this one field, that's also a reasonable trigger to consider MMKV instead, since its synchronous, non-Promise API removes the async round-trip cost entirely — but for a single debounced text field, keeping `AsyncStorage` and just decoupling render-time state from persistence timing is the minimal, correct fix.

```
import { useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'user_settings';
const SAVE_DELAY_MS = 400;

function useDebouncedSetting(fieldName: string, initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const onChangeText = useCallback((text: string) => {
    setValue(text); // instant UI update, no I/O here

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = raw ? JSON.parse(raw) : {};
      settings[fieldName] = text;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, SAVE_DELAY_MS);
  }, [fieldName]);

  return { value, onChangeText };
}

// <TextInput value={value} onChangeText={onChangeText} />
```

**References:**
- [async-storage — README](https://github.com/react-native-async-storage/async-storage)

---

### 7. Which of the following is true about MMKV compared to AsyncStorage?

*Mid · Multiple Choice*

- MMKV is asynchronous and slower, but supports larger payloads
- MMKV provides synchronous, high-performance key-value access backed by native code, while AsyncStorage is asynchronous and generally slower for frequent reads/writes
- MMKV can only store strings, while AsyncStorage supports arbitrary binary data
- MMKV is a React Native core API, while AsyncStorage is always a third-party package

**Answer:** "MMKV provides synchronous, high-performance key-value access backed by native code, while AsyncStorage is asynchronous and generally slower for frequent reads/writes" — MMKV's JSI-backed C++ implementation performs reads/writes synchronously with no Promise/Bridge overhead, and its own benchmarks show roughly a 30x speed advantage over AsyncStorage-style storage for typical operations.

**Why:** Option 1 has it backwards — MMKV is the synchronous, faster one; it's AsyncStorage that's async and comparatively slower for frequent access. Option 3 is also backwards from the real capability gap — MMKV explicitly supports more than plain strings (booleans, numbers, and raw `ArrayBuffer`/binary data via its native bindings), while AsyncStorage-style storage is fundamentally a string-only key-value API, so anything else has to be manually serialized. Option 4 is wrong on both halves — MMKV is not a React Native core API, it's a third-party native library (`react-native-mmkv`) that has to be installed and linked, and the original core `AsyncStorage` was itself removed from RN core, so today's 'AsyncStorage' is equally a third-party (community-maintained) package, not a distinguishing factor between the two.

**References:**
- [react-native-mmkv — README](https://github.com/mrousavy/react-native-mmkv)
- [async-storage — README](https://github.com/react-native-async-storage/async-storage)

---

### 8. How would you design an offline-first data layer for a React Native app — one that lets users read and mutate data with no network connection and syncs once connectivity returns?

*Senior · Conceptual*

**Answer:** I'd make a local, on-device database (something like SQLite via WatermelonDB/op-sqlite, or Realm) the app's source of truth for the UI, not the server — screens always read and write from that local store first, so the app is fully usable with zero network. Writes made offline get appended to a local mutation queue with a timestamp and operation type; a sync engine, running whenever `NetInfo` reports connectivity, drains that queue against the server API and reconciles the local store with the server's response, applying an optimistic-update-then-confirm/rollback pattern so the UI updates instantly and only corrects itself if the server rejects the mutation.

**Why:** The two hard problems in this design are ordering and conflicts. Ordering: queued mutations generally need to replay in the order they were made (or be designed to be order-independent, e.g. CRDT-style operations) so a later edit doesn't get silently overwritten by an earlier queued one replaying after it. Conflicts: once two devices can both edit the same record offline, you need an explicit strategy — last-write-wins by server timestamp is simplest and fine for low-stakes data, but for anything where silently discarding a user's edit is unacceptable (shared documents, financial records) you need either field-level merging, a version/vector-clock check that flags a true conflict, or a UI that surfaces the conflict to the user to resolve manually. I'd also keep the local database schema versioned with migrations from day one, since offline-first apps accumulate real user data locally that can't just be wiped on a schema change the way a pure server-backed cache could.

**References:**
- [React Native docs — NetInfo (community)](https://github.com/react-native-netinfo/react-native-netinfo)

---

### 9. Design the caching and synchronization strategy for a React Native app that must show cached data instantly on launch, then refresh from the network, and gracefully handle write conflicts when the same record was edited offline on two different devices.

*Senior · Open Question*

**Answer:** I'd use a stale-while-revalidate pattern as the backbone: persist server responses to a local store (MMKV for smaller structured payloads, or SQLite for larger relational data), render from that cache immediately on launch so the UI is never blank/loading on a warm start, and kick off a background refetch that updates the cache and UI once it resolves — a data-fetching layer like TanStack Query (with a persister plugin) or RTK Query gives this pattern largely for free instead of hand-rolling cache invalidation. For write conflicts, I'd tag every record with a version or `updatedAt` timestamp set by the server (not the client, to avoid clock-skew issues) and detect a conflict when a device tries to push a mutation based on a version older than what the server currently has; the resolution policy then depends on the data — last-write-wins by server timestamp for low-stakes fields (like a 'last viewed' marker), and either field-level merging or an explicit 'this was also changed elsewhere, pick one or merge' UI prompt for higher-stakes content where silently dropping a user's edit would be unacceptable.

**Why:** The subtlety worth calling out explicitly: 'instant on launch, then refresh' and 'offline writes that might conflict' are related but separate problems, and conflating their solutions is a common design mistake. The read side is solved by treating the local cache as a fast, always-available projection of server state that's allowed to be briefly stale — the UI should visually distinguish 'showing cached data, refreshing...' from a hard error if the refresh itself fails offline. The write side needs its own outbox/queue of pending mutations (so an offline edit isn't lost, just delayed) plus the version-check-based conflict detection described above; a naive 'just overwrite whatever's on the server' sync will silently and unpredictably lose the losing device's edits, which is usually the actual bug report users file as 'my changes disappeared.' I'd also make sure conflict resolution is deterministic and testable in isolation — it's exactly the kind of logic that's easy to get subtly wrong and hard to debug from a support ticket after the fact.

**References:**
- [TanStack Query docs — Overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Redux Toolkit docs — RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview)

---

## Testing

### 1. What's the difference between a unit test and an integration test in the context of a React Native app?

*Junior · Conceptual*

**Answer:** A unit test covers the smallest testable piece of code in isolation — a single pure function, a utility, a reducer — with any dependencies mocked out, so it's fast and pinpoints exactly what broke. An integration test exercises several real units working together (e.g. a screen component, its hooks, and a real reducer, or a data-fetching hook talking to a mocked network layer) to verify they cooperate correctly, which catches the class of bugs that only show up at the seams between correctly-working pieces.

**Why:** The dividing line isn't about the tool (both are typically written in Jest) but about scope and how much is mocked: a unit test for a `formatCurrency(amount)` function needs nothing else; an integration test for a `LoginForm` component exercises the real form-validation logic, the real `useState`/`useReducer` calls, and real child components together, only mocking the external boundary (a network call, `AsyncStorage`). React Native's own testing guidance places component tests (rendering + interaction, tested with React Native Testing Library) in this same 'integration-ish' bucket since a component test genuinely exercises multiple pieces (JSX, hooks, event handlers) working together rather than one isolated function — it's a related but distinct category from a strict single-function unit test, and both sit below E2E tests (Detox) in the testing pyramid, which validate the whole running app.

**References:**
- [React Native docs — Testing Overview](https://reactnative.dev/docs/testing-overview)

---

### 2. What does React Native Testing Library encourage you to test, and why does it discourage asserting on a component's internal state directly?

*Junior · Conceptual*

**Answer:** React Native Testing Library encourages testing a component the way a user actually experiences it: render it, find elements the way a user would locate them (by visible text, accessible role, or label), simulate real interactions (`fireEvent.press`, `fireEvent.changeText`), and assert on what ends up on screen afterward — not on a component's internal `useState` value or props. This follows the whole Testing Library family's guiding principle: 'the more your tests resemble the way your software is used, the more confidence they can give you.'

**Why:** Asserting on internal state directly couples the test to implementation details that users never see and that are free to change during a refactor — if you rename a `useState` variable or switch a component from local state to a store, a test asserting on that internal value breaks even though the component's actual behavior (what the user sees and can do) didn't change at all. Testing observable output instead means the test only fails when real user-facing behavior actually breaks, which is exactly the property that makes a test suite trustworthy enough to refactor freely against. This is also why RNTL deliberately doesn't expose an API for reaching into component internals the way the older, now-deprecated shallow-rendering approaches did — the API surface itself steers you toward user-facing queries.

**References:**
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [React Native docs — Testing Overview (Component Tests)](https://reactnative.dev/docs/testing-overview)

---

### 3. What is the primary purpose of `jest.mock()` in a React Native test suite?

*Junior · Multiple Choice*

- To automatically generate snapshot tests for every component
- To replace a module's real implementation with a controlled fake for the duration of a test
- To measure code coverage percentages
- To skip a test file entirely during CI runs

**Answer:** "To replace a module's real implementation with a controlled fake for the duration of a test" — `jest.mock()` swaps out a module (a native module, an API client, a whole npm package) with a fake version you control, so the test can isolate the code under test from dependencies it doesn't want to exercise for real.

**Why:** It has nothing to do with generating snapshots — that's `toMatchSnapshot()`/the snapshot testing feature, an entirely separate Jest capability. It doesn't measure coverage either — coverage comes from running Jest with `--coverage`, using Istanbul instrumentation, unrelated to mocking. And it doesn't skip test files — `test.skip`/`describe.skip` or `.skip` on a suite is how you do that, not module mocking. The common RN use case is mocking native modules that don't exist in the Jest (Node.js) test environment at all — things like `AsyncStorage`, `react-native-mmkv`, or `@react-navigation/native`'s `useNavigation` — since Jest tests run in Node, not on a real device, so any code path that would hit real native code needs a mock or the test would crash trying to call something that isn't there.

**References:**
- [Jest docs — Manual Mocks](https://jestjs.io/docs/manual-mocks)
- [Jest docs — Mock Functions](https://jestjs.io/docs/mock-functions)

---

### 4. What is Detox, and how does E2E testing with Detox differ from component testing with React Native Testing Library?

*Mid · Conceptual*

**Answer:** Detox is an end-to-end testing framework built specifically for React Native, which drives a real, fully-built app running on an actual simulator/emulator or device, tapping through it the way a real user would. That's a fundamentally different scope than React Native Testing Library, which renders a component (or a small tree of components) in a JS-only test environment with no real native views, no real device, and no real network — RNTL tests are fast and run in Jest as part of the normal unit-test suite, while Detox tests are slower, require an actual app build, and validate the whole system (JS, native code, and real navigation) working together.

**Why:** Detox describes its own approach as 'gray box' testing: unlike a pure black-box E2E tool that only sees the UI from the outside, Detox has visibility into the app's internals (it can synchronize with pending network requests, animations, and timers), which lets it wait intelligently for the app to be idle before interacting with it — this is what makes Detox tests meaningfully less flaky than a naive tap-and-hope-it's-ready E2E approach. In practice, teams use both for different jobs: RNTL/Jest component tests run on every commit in seconds and catch logic/rendering regressions cheaply; Detox tests are reserved for the small number of truly critical, cross-cutting user flows (login, checkout) precisely because building and running the app for each test run is expensive and slower to iterate on.

**References:**
- [Detox docs — Getting Started](https://wix.github.io/Detox/docs/introduction/getting-started)
- [React Native docs — Testing Overview](https://reactnative.dev/docs/testing-overview)

---

### 5. Write a React Native Testing Library test for a `LoginForm` component that verifies an error message appears when the user submits the form with an empty password field.

*Mid · Code Challenge*

**Answer:** Render the component, fill in the email field but leave password empty, fire a press on the submit button, and then assert the error text appears — using `findByText` (not `getByText`) for the assertion since the error may render asynchronously after validation runs.

**Why:** The key detail that separates a correct RNTL test from a flaky one here is `findByText` vs `getByText`: `getByText` throws immediately if the element isn't in the tree yet, which fails if validation/error-rendering happens after a state update or a microtask tick; `findByText` returns a promise that retries until the element appears (or times out), matching how the error genuinely appears asynchronously relative to the button press. The test finds elements the way a user would — by their visible label/placeholder text and accessible role — rather than reaching into the component's internal validation state, consistent with Testing Library's guiding principle of testing observable behavior.

```
import { render, fireEvent } from '@testing-library/react-native';
import { LoginForm } from './LoginForm';

test('shows an error when submitting with an empty password', async () => {
  const { getByPlaceholderText, getByRole, findByText } = render(<LoginForm />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
  // Password field intentionally left empty
  fireEvent.press(getByRole('button', { name: /log in/i }));

  expect(await findByText('Password is required')).toBeTruthy();
});
```

**References:**
- [Testing Library — async methods (findBy)](https://testing-library.com/docs/dom-testing-library/api-async/)
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/)

---

### 6. A Jest test for a component that calls `useNavigation()` internally fails with "Couldn't find a navigation object". Fix the test setup so the component can be rendered and tested in isolation.

*Mid · Code Challenge*

**Answer:** Wrap the component under test in a `NavigationContainer` when rendering it, since `useNavigation()` reads from React Navigation's own context, which only exists inside that provider — without it there's no navigation object to find, which is exactly the error being thrown. For anything beyond the simplest case, React Navigation's own testing docs recommend going a step further and rendering the component inside a minimal 'test navigator' (a real stack navigator with one or two screens) rather than mocking `useNavigation` directly, because a hand-rolled mock's `navigation` object can drift out of shape from the real one and let a test pass even when the component would break in production.

**Why:** React Navigation's official testing guidance explicitly says to 'avoid mocking React Navigation': mocking `useNavigation` (or the `navigation` prop) means the mock object may not have the same shape as the real one, so a test can keep passing after a change that actually breaks navigation in the app. The recommended pattern instead is a lightweight 'test navigator' — a real `createNativeStackNavigator` (or similar) with a screen for the component under test and a dummy destination screen, wrapped in a real `NavigationContainer` — then asserting on the *result* of the interaction (e.g. the destination screen having rendered, or `initialParams` reflecting what was navigated to) instead of asserting a `navigate` jest mock was called with specific arguments. Mocking `useNavigation` directly still shows up in real codebases and can be defensible for a narrow, throwaway unit test or when the component is genuinely never rendered inside a navigator in production (e.g. a bare modal outside the navigation tree) — but per current official guidance it should be treated as the fallback, not an equally valid default, and a reviewer should expect the test-navigator approach to be the one reached for first.

```
// Recommended — lightweight test navigator (per React Navigation's official testing guidance)
import { render, fireEvent, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileButton } from './ProfileButton';

const Stack = createNativeStackNavigator();

function renderWithTestNavigator(component: React.ReactElement) {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={() => component} />
        <Stack.Screen name="Profile" component={() => <>{'Profile Screen'}</>} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

test('navigates to Profile on press', async () => {
  renderWithTestNavigator(<ProfileButton />);
  fireEvent.press(screen.getByRole('button'));
  expect(await screen.findByText('Profile Screen')).toBeOnTheScreen();
});

// Fallback — mocking useNavigation directly.
// React Navigation's docs recommend avoiding this: a mocked navigation object
// can drift out of shape from the real one and mask real regressions. Only
// reach for this for a narrow unit test, or when the component is never
// rendered inside a navigator in production.
import { useNavigation } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));

test('calls navigate with Profile on press (fallback pattern)', () => {
  const navigate = jest.fn();
  (useNavigation as jest.Mock).mockReturnValue({ navigate });

  const { getByRole } = render(<ProfileButton />);
  fireEvent.press(getByRole('button'));

  expect(navigate).toHaveBeenCalledWith('Profile');
});
```

**References:**
- [React Navigation docs — Testing](https://reactnavigation.org/docs/testing/)

---

### 7. Following React Native Testing Library's guiding principle, which query would you prefer for finding a submit button in a test?

*Mid · Multiple Choice*

- A query based on the component's internal test-only state property
- A query based on the button's accessible role/text, like `getByRole` or `getByText`, matching how a user would find it
- Direct access to the component instance via a class ref
- Querying the Redux store for a 'buttonPressed' flag

**Answer:** "A query based on the button's accessible role/text, like `getByRole` or `getByText`, matching how a user would find it" — Testing Library's stated guiding principle is that tests should resemble how the software is actually used, and a real user finds a submit button by its visible label or role, not by any internal implementation detail.

**Why:** Querying an internal test-only state property is exactly the anti-pattern Testing Library is designed to steer you away from — it couples the test to implementation details a user never sees, so refactors that don't change behavior can still break the test. Reaching into a class instance via a ref bypasses the public, user-facing interface entirely and also doesn't translate to function components, which don't have instances to ref into the same way. Querying the Redux store for a flag tests whether an action was dispatched, not whether the button is actually findable/pressable from the rendered UI — a bug where the button exists in the store's mental model but isn't actually rendered or tappable would slip right past that assertion. `getByRole`/`getByText` (and `getByRole` specifically, since it also implicitly checks accessibility semantics) is the query Testing Library's own docs hold up as the preferred, most user-resembling choice.

**References:**
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/)

---

### 8. How would you structure a test suite for a React Native app to balance fast feedback from unit/component tests with the confidence that comes from E2E tests, given that E2E suites are typically slower and more flaky?

*Senior · Conceptual*

**Answer:** I'd shape it like a pyramid: a broad base of fast Jest unit tests for pure logic (reducers, formatters, hooks in isolation), a solid middle layer of React Native Testing Library component/integration tests for how screens actually render and respond to interaction, and a small, deliberately curated set of Detox E2E tests reserved for the handful of flows where a real regression would be genuinely severe — sign-up/login, checkout, anything touching payments or data loss. The base layers run on every push and block merges since they're fast and reliable; the E2E layer runs on a less aggressive cadence (pre-release, nightly) and any flaky test gets quarantined and fixed or deleted rather than left blocking CI, since a flaky gate that people learn to ignore is worse than no gate at all.

**Why:** The core trade-off driving this shape: E2E tests give the highest confidence because they exercise the real app end-to-end, but that same realism (real device/simulator, real timing, real network conditions) is exactly what makes them slow and prone to flakiness from things unrelated to the actual code under test. Over-investing in E2E coverage for things a component test could catch just as reliably (does this button call this handler, does this validation error show) burns CI time and increases false-positive failures without adding proportional confidence — so I'd reserve E2E specifically for cross-cutting flows that genuinely can't be verified any other way, like a multi-screen navigation flow with real native transitions, or verifying push-notification-triggered deep links land correctly. I'd also track flaky-test quarantine as a first-class metric, since an E2E suite that nobody trusts gets ignored regardless of how it's structured.

**References:**
- [React Native docs — Testing Overview](https://reactnative.dev/docs/testing-overview)
- [Detox docs — Getting Started](https://wix.github.io/Detox/docs/introduction/getting-started)

---

### 9. How would you introduce a testing culture and CI-enforced coverage gates to a React Native codebase that currently has almost no automated tests, without blocking the team's shipping velocity?

*Senior · Open Question*

**Answer:** I wouldn't set a fixed high coverage threshold (like '80% or the build fails') on day one — with almost no existing tests, that instantly blocks every PR and teaches the team to route around the gate rather than embrace it. Instead I'd start with a ratcheting floor: CI fails only if a PR's diff coverage drops below a modest bar (or, at minimum, if overall coverage decreases at all), so new/changed code has to be tested but the team isn't forced to retroactively test the entire legacy codebase before shipping anything. I'd pair that with a concrete, low-friction rule everyone can follow immediately — every bug fix ships with a regression test that reproduces the bug first — since that's the moment testing has the most obvious, visible payoff and is the easiest habit to build without a big process rewrite.

**Why:** The failure mode to avoid is a top-down coverage mandate with no path to reach it — teams facing an unreachable target either ignore the gate, write low-value tests just to hit a number (asserting a component renders without checking its actual behavior), or push back on the whole initiative. A ratcheting/diff-based gate (many CI tools support 'coverage must not decrease' or 'new lines must be covered') makes progress monotonic without requiring a stop-the-world testing sprint. I'd prioritize test-writing effort by risk, not by ease — the highest-value first tests are usually the app's critical business logic (checkout, auth, data sync) and any area that has produced real production bugs recently, since that's where a regression test suite earns its keep fastest and builds the strongest case for wider adoption. Only once the codebase has meaningful coverage in its highest-risk areas would I introduce E2E (Detox) tests and a firmer, less lenient coverage policy — trying to do everything (unit + integration + E2E + strict gates) simultaneously on a codebase starting from zero is what actually stalls velocity.

**References:**
- [React Native docs — Testing Overview](https://reactnative.dev/docs/testing-overview)
- [Jest docs — Coverage](https://jestjs.io/docs/cli#--coverageboolean)

---

## Build, Deploy & CI/CD

### 1. What's the difference between the Expo managed workflow and the bare React Native workflow, and why might a team choose one over the other?

*Junior · Conceptual*

**Answer:** Expo no longer actually splits projects into a 'managed workflow' vs. a 'bare workflow' — all Expo projects today use the same architecture, called Continuous Native Generation (CNG): native `ios`/`android` folders are a generated artifact of your `app.json`/config plugins, produced on demand via `expo prebuild`, rather than a separate track you opt into. The real axis a team chooses along is how much native code they hand-edit: stay fully config-plugin-driven — no native folders committed, regenerated fresh on every build/CI run, all native behavior expressed declaratively through config plugins — versus running `expo prebuild` once, committing the generated native projects, and hand-editing them when a config plugin can't express what's needed. 'Managed' and 'bare' are the older terms for roughly that same spectrum; interviewers may still use them, but Expo's own docs now mark that terminology deprecated in favor of this unified CNG model.

**Why:** The old mental model was a hard binary: 'managed workflow' (Expo owns everything, no native folders you ever see) vs. 'bare workflow' (native folders checked into your repo, edited by hand), with 'ejecting' as the irreversible one-way door between them. Expo's docs now explicitly retire that framing — the glossary marks 'Bare workflow' as Deprecated with the note: 'Expo no longer separates "managed" and "bare" workflows. All projects use the same architecture based on Continuous Native Generation (CNG).' Under CNG, every Expo project is fundamentally the same thing: native projects are generated from your app config, autolinked native dependencies, and any config plugins, via `expo prebuild`. Whether you run prebuild right before each build (or via `expo run:ios`/`expo run:android`) and never commit the output, or run it once and commit + hand-edit the native folders, is a workflow choice layered on that same architecture, not a fork of it. That reframing has a real practical consequence: there's no longer an irreversible 'eject,' since native folders can be regenerated from config at any point as long as your customizations are captured as config plugins rather than only as untracked manual native edits — and libraries built with the Expo Modules API work the same way regardless of whether prebuild has been run yet. The practical decision point for a team hasn't really changed: does this app need a native module, native SDK, or native customization that Expo's config plugins can't already express? If not, staying config-plugin-driven keeps CI/CD, OTA updates, and cross-platform builds simplest; if yes, running `expo prebuild` and hand-editing the result buys the control back without giving up EAS Build or the rest of the Expo tooling.

**References:**
- [Expo docs — Glossary of terms: Bare workflow (deprecated, redirects to CNG)](https://docs.expo.dev/more/glossary-of-terms/)
- [Expo docs — Continuous Native Generation (prebuild)](https://docs.expo.dev/workflow/continuous-native-generation/)

---

### 2. What is EAS Build, and what problem does it solve compared to building locally with Xcode/Android Studio?

*Mid · Conceptual*

**Answer:** EAS Build is Expo's hosted cloud build service: you push a build request and it compiles your iOS/Android binaries on Expo's infrastructure instead of your machine, handling app signing credentials, native dependency installation, and producing an installable artifact (or auto-submitting to the stores via EAS Submit). It solves the 'every developer and CI runner needs a correctly configured Xcode + Android Studio + signing setup' problem — no team member needs a Mac to produce an iOS build, environments stay consistent build-to-build, and credentials are managed centrally instead of scattered across laptops.

**Why:** Building locally works fine for a solo developer, but it doesn't scale to a team or CI pipeline: iOS builds require a macOS machine with the right Xcode version, Android builds need the right SDK/NDK versions, and both need someone to correctly manage signing certificates/provisioning profiles/keystores — configuration drift between machines is a constant source of 'works on my machine' build failures. EAS Build centralizes all of that in a reproducible cloud environment defined by build profiles in `eas.json` (e.g. separate `development`, `preview`, `production` profiles), which is what lets it plug cleanly into CI/CD — a GitHub Actions workflow can trigger an EAS Build the same way a developer would locally, without needing self-hosted macOS runners for iOS. It works for both Expo-managed and bare React Native projects, not just fully-managed Expo apps.

**References:**
- [Expo docs — EAS Build introduction](https://docs.expo.dev/build/introduction/)

---

### 3. What is CodePush/OTA updating, and what kinds of changes can and cannot be delivered through an OTA update without a full app store release?

*Mid · Conceptual*

**Answer:** OTA (over-the-air) updating lets you push a new JS bundle (and other JS-loadable assets, like images or translation strings) directly to installed apps, so users get bug fixes and UI/logic changes without going through app store review — the app checks for and downloads an update at launch and swaps in the new bundle. It can only ship things that live in JS: component logic, styling, copy, images bundled through the JS layer. It cannot ship anything that requires a new native binary — new native modules, changed native permissions, a bumped React Native/Expo SDK version, or any native code change — those still require a full build and store submission.

**Why:** Microsoft's CodePush (via App Center) was historically the most common OTA solution for React Native, but App Center and CodePush were both officially retired on March 31, 2025, and the `react-native-code-push` GitHub repo was archived shortly after — so it's no longer a viable choice for new projects, though the concept it popularized is still very much current. The mainstream replacement in the Expo ecosystem is EAS Update, which serves updates through the `expo-updates` library and works for both Expo and bare React Native apps; other OTA services or a self-hosted CodePush-compatible server exist as alternatives. The 'can/cannot' boundary is the same regardless of which OTA provider you use, because it's a platform-level constraint, not a tooling limitation: both Apple's and Google's guidelines require that OTA-delivered updates only change interpreted/JS content, not compiled native code, so an OTA update genuinely cannot alter anything that ships as part of the native binary. This is also why teams gate risky OTA rollouts behind percentage-based/staged rollout and a rollback mechanism — since an OTA update skips app-store review, it's the team's own responsibility to catch a broken JS bundle quickly.

**References:**
- [Expo docs — EAS Update introduction](https://docs.expo.dev/eas-update/introduction/)
- [GitHub — microsoft/react-native-code-push (retirement notice)](https://github.com/microsoft/react-native-code-push)

---

### 4. Which of the following changes can typically be shipped via an OTA/CodePush-style update without a new app store release?

*Mid · Multiple Choice*

- Adding a new native module that requires linking
- Changing the app icon and splash screen
- Updating JavaScript/TypeScript logic and most React component code
- Upgrading the React Native version itself

**Answer:** Updating JavaScript/TypeScript logic and most React component code — because OTA updates (EAS Update, or historically CodePush) only replace the interpreted JS bundle and JS-loadable assets, this is the correct option; the other three all require a new compiled native binary and a full store release.

**Why:** Adding a native module that requires linking is wrong because linking means new native (Java/Kotlin/Obj-C/Swift) code compiled into the binary — an OTA update can't inject new compiled native code into an already-installed app. Changing the app icon and splash screen is wrong for the same reason on most platforms: those are native resources baked into the binary at build time, not JS-bundle assets (a small number of very limited runtime-configurable exceptions exist on some platforms, but this isn't the general case). Upgrading the React Native version itself is wrong because that changes the native runtime/engine the app ships with — impossible to swap out via a JS-only patch. Both Apple's and Google's store policies also explicitly restrict OTA updates to non-native/interpreted content, so even where something might be technically possible, changes beyond JS/assets risk violating platform guidelines.

**References:**
- [Expo docs — EAS Update introduction](https://docs.expo.dev/eas-update/introduction/)

---

### 5. What does app signing primarily accomplish for a React Native Android release build?

*Mid · Multiple Choice*

- It minifies and obfuscates the JavaScript bundle
- It verifies the app's authenticity and integrity, proving updates come from the same developer as the original install
- It compresses native assets to reduce APK size
- It enables OTA updates without going through the Play Store

**Answer:** It verifies the app's authenticity and integrity, proving updates come from the same developer as the original install — Android requires every APK/AAB to be digitally signed with a certificate before it can be installed, and the same signing identity must be used for every subsequent update to that app.

**Why:** The other options describe things app signing has nothing to do with: minification/obfuscation of the JS bundle is handled by Metro's build/minify step (and separately Hermes bytecode compilation), not signing; asset compression is a packaging concern, not a cryptographic one; and OTA updates without the Play Store are a function of an update mechanism like EAS Update/CodePush, unrelated to the signing certificate. Practically, signing matters because Android refuses to install an update to an already-installed app unless it's signed with a matching certificate — this is what stops an attacker from pushing a malicious 'update' to your users, and it's why losing your signing key/keystore for a self-managed key is a serious operational risk (you can't publish further updates under the same identity). Google Play's 'App Signing by Google Play' now manages the actual release-signing key on Google's side for most apps, with the developer only holding an upload key, precisely to reduce the blast radius of a developer losing their key.

**References:**
- [React Native docs — Signed APK (Android)](https://reactnative.dev/docs/signed-apk-android)

---

### 6. How would you design a CI/CD pipeline for a React Native app that needs to build, test, and deploy to both TestFlight/Play Store internal testing and production, with separate configs for staging and production environments?

*Senior · Conceptual*

**Answer:** I'd split it into a fast feedback loop and a release pipeline: every PR runs lint/type-check/unit tests (Jest) and, on merge to a develop/staging branch, triggers an EAS Build with a `preview` profile pointed at staging environment variables/API endpoints, auto-distributed to TestFlight internal testing / Play Store internal track. A tagged release (e.g. `v1.4.0`) on `main` triggers a separate `production` build profile with production env vars, runs the full test suite again as a gate, then uses EAS Submit to ship to TestFlight/Play Store production tracks — with staging and production kept apart via separate `eas.json` build profiles and separate environment variable sets (and separate app identifiers/bundle IDs if they need to run side-by-side on a device). I'd also wire in EAS Update for JS-only staging/production channels so small fixes can go out without a full build.

**Why:** The key design decision is environment separation without config drift: `eas.json` build profiles let you define distinct `staging`/`production` profiles that each point at their own environment variables, API base URLs, and (often) distinct app bundle identifiers/app icons so testers can have both builds installed simultaneously without collision. Native tests (unit/component tests via Jest + React Native Testing Library) should gate every merge, while E2E tests (Detox or Maestro) are usually reserved for the release pipeline since they're slower and need a real build artifact to run against. Update channels matter too: EAS Update supports separate update 'channels' mapped to separate build profiles, so a staging build only ever pulls staging OTA updates and production only pulls production ones — mixing those up is a classic way to accidentally ship an unfinished feature to production users. Finally, credentials (signing certs, keystores, API keys) should live in EAS's managed credential storage or the CI provider's secret store, never checked into the repo, and the pipeline should fail closed (block the release) if secrets or required env vars are missing rather than silently building with defaults.

**References:**
- [Expo docs — EAS Build introduction](https://docs.expo.dev/build/introduction/)
- [Expo docs — EAS Update introduction](https://docs.expo.dev/eas-update/introduction/)

---

### 7. Outline the CI workflow steps (as pseudocode or a YAML skeleton) you'd write to run the test suite, then trigger an EAS build and submit it to the App Store, only when a tag matching `v*` is pushed to `main`.

*Senior · Code Challenge*

**Answer:** The workflow needs a trigger scoped to tags matching `v*`, a job that installs dependencies and runs the test suite as a hard gate, and — only if that passes — a step that runs `eas build` for iOS with a production profile and then `eas submit` to send the resulting build to App Store Connect, authenticated via an Expo token stored as a CI secret.

**Why:** The important structural choices: tests run in the same job (or an upstream job the build job `needs`) so a failing test suite blocks the build outright rather than wasting a build minute; the EAS CLI is authenticated non-interactively via `EXPO_TOKEN` since there's no human to log in during CI; `eas build --non-interactive` is required so the CLI doesn't hang prompting for input in a headless run; and `--auto-submit` (or a separate `eas submit`) is what pushes the finished binary to App Store Connect rather than just leaving it as a downloadable artifact. Scoping the trigger to `tags: ['v*']` (rather than every push to `main`) is what keeps this a deliberate release action instead of firing a production build on every merge.

```
name: Release to App Store

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    if: github.ref_type == 'tag' && startsWith(github.ref_name, 'v')
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run test suite
        run: npm test -- --ci --coverage

      - name: Setup EAS CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS production binary
        run: eas build --platform ios --profile production --non-interactive --wait

      - name: Submit to App Store
        run: eas submit --platform ios --profile production --non-interactive --latest
```

**References:**
- [Expo docs — Trigger builds from CI](https://docs.expo.dev/build/building-on-ci/)
- [Expo docs — Submit to app stores (EAS Submit)](https://docs.expo.dev/deploy/submit-to-app-stores/)

---

### 8. How would you decide whether a growing React Native project should migrate from the Expo managed workflow to a bare/prebuild workflow, and what would you weigh in that decision?

*Senior · Open Question*

**Answer:** I'd start by identifying the concrete native requirement that's actually forcing the conversation — a native SDK with no Expo config plugin, a native module with custom native code, or a build-time native customization Expo's plugin system genuinely can't express — since most 'we need to go native' requests turn out to be solvable with an existing or custom config plugin while staying fully config-plugin-driven (no native folders committed, regenerated fresh via `expo prebuild` at build time). If there's a real gap, I'd weigh the ongoing cost of owning hand-edited native code (native build maintenance, dealing with native dependency upgrades and Xcode/Android SDK bumps directly, losing some of the config-plugin abstraction) against the cost of not having that capability, and check whether running `expo prebuild` once and committing the generated native projects gets us there without abandoning the rest of the Expo stack (EAS Build/Update still work fine on a prebuilt project). I'd treat it as incremental, not all-or-nothing: keep as much of the app config-plugin-driven as possible and only hand-edit the specific native code that needs it, rather than treating this as a full rewrite away from Expo tooling.

**Why:** The framing that used to dominate this decision — 'managed workflow' as a walled garden you 'eject' from irreversibly into a separate 'bare workflow' — is retired terminology; Expo's own docs now say plainly that it no longer separates managed and bare workflows, and that all projects use the same Continuous Native Generation (CNG) architecture. Under CNG, `expo prebuild` treats the native `ios`/`android` folders as a generated, disposable build artifact (regenerable from `app.json` + config plugins) rather than a one-way door: you can keep native folders out of version control and regenerate them on each build, or check them in and hand-edit if you need to diverge from what the plugins produce. So the real decision isn't 'managed vs. bare' at all anymore — it's 'do we need to hand-edit native code beyond what config plugins can express, and if so, how much drift from the config-plugin-generated baseline are we willing to maintain and keep in sync.' Practically I'd weigh: team native-development capacity (hand-editing prebuilt native code needs someone comfortable in Xcode/Android Studio, not just JS), how many third-party native dependencies already ship an Expo config plugin vs. need manual native linking, and whether CI/CD (EAS Build works the same either way) needs to change. I'd avoid running `expo prebuild` and committing native folders preemptively 'just in case' — YAGNI applies here as much as anywhere; regenerating native projects on demand is cheap enough that it's better to commit to hand-editing them only when a concrete native requirement forces it.

**References:**
- [Expo docs — Glossary of terms: Bare workflow (deprecated, redirects to CNG)](https://docs.expo.dev/more/glossary-of-terms/)
- [Expo docs — Continuous Native Generation (prebuild)](https://docs.expo.dev/workflow/continuous-native-generation/)

---

## Animations

### 1. What is the `Animated` API used for in React Native, and what's the difference between `Animated.timing` and `Animated.spring`?

*Junior · Conceptual*

**Answer:** `Animated` is React Native's built-in API for driving animations: you create an `Animated.Value`, feed it into an animated component's style, and use functions like `timing` or `spring` to change that value over time, re-rendering just the animated node instead of the whole component tree. `Animated.timing` moves a value from A to B over a fixed `duration` using an easing curve, giving you predictable, controllable motion; `Animated.spring` instead simulates physics (tension/friction or stiffness/damping), producing organic, bouncy motion whose duration emerges from the physics rather than being set directly.

**Why:** Under the hood, `Animated` builds a declarative graph of value transformations rather than imperatively setting state every frame — that's what lets it hand the whole animation off to the native side via `useNativeDriver: true` instead of re-running JS on every frame. `timing` is the right choice when you need a specific, deterministic duration (e.g. 'fade in over exactly 300ms'); `spring` is the right choice when you want motion to feel natural and responsive to interruption — e.g. a card snapping back to its start position after a drag, where a spring can be interrupted and redirected smoothly, whereas a `timing` animation restarting from the interrupted state can feel abrupt because it recalculates a fresh linear/eased path.

**References:**
- [React Native docs — Animations](https://reactnative.dev/docs/animations)

---

### 2. What does the `useNativeDriver: true` option do when configuring an `Animated` animation, and why can't every style property use it?

*Mid · Conceptual*

**Answer:** `useNativeDriver: true` sends the entire animation configuration (start value, end value, curve, duration) to the native side once, up front, so the animation then runs on the native/UI side frame-by-frame instead of the JS thread computing and pushing a new value across the bridge on every frame — which means the animation keeps running smoothly even if the JS thread gets busy or blocked. It only works for properties the native side can animate directly without touching layout — `opacity` and `transform` (translate/scale/rotate) — because those don't require re-running Flexbox layout on every frame; properties like `width`, `height`, or `flex` do require layout recalculation, which still has to go through the JS/layout engine, so they can't be offloaded to the native driver.

**Why:** The underlying reason is architectural: native-driver-animatable properties (opacity, transform) can be applied directly to the platform's rendering layer (e.g. as a GPU-composited transform) without invalidating layout, so native code can own the whole animation loop independently. Layout properties, by contrast, change the size/position of the element and everything around it, which requires re-running the layout algorithm — something that historically only happened on the JS side (or, now, in Fabric's C++ layout core, but still not something the simple native-driver value interpolation handles). This is also exactly the gap that `react-native-reanimated` was built to close more thoroughly: it can animate a wider range of properties on the UI thread via worklets, though even there, animating actual layout-triggering properties every frame is expensive and generally discouraged in favor of transform-based animations (e.g. `scale`/`translateX` instead of `width`/`left`) for performance.

**References:**
- [React Native docs — Animations (useNativeDriver)](https://reactnative.dev/docs/animations)

---

### 3. How does `react-native-reanimated` differ architecturally from the built-in `Animated` API, particularly regarding where the animation logic actually runs?

*Mid · Conceptual*

**Answer:** The classic `Animated` API's animation *definitions* (which properties, what curve, what duration) can be handed to native via `useNativeDriver`, but any custom animation *logic* you write — interpolation math, conditionals, responding to gesture events — still runs on the JS thread by default, only escaping it for a narrow set of native-driver-supported cases. Reanimated instead lets you write that logic as 'worklets': small JS functions that get pulled out and executed directly on the UI thread (in a separate lightweight JS runtime), so gesture-driven and per-frame animation code runs independently of the JS thread entirely, not just the final interpolated value.

**Why:** This is the core architectural difference: `Animated` was designed around bridging *declared* animation configs to native once, while Reanimated is designed around running arbitrary *animation and gesture-handling code* on the UI thread continuously, via worklets — tiny functions marked (explicitly or automatically, via a Babel/SWC plugin) to be 'workletized' and shipped to a UI-thread JS context, giving them synchronous access to shared values without any bridge round trip per frame. That's why Reanimated is the standard pairing with `react-native-gesture-handler` for gesture-driven UI: a pan gesture's `onUpdate` handler, running as a worklet, can update a shared value and recompute an animated style entirely on the UI thread, so the animation keeps tracking the user's finger smoothly even if the JS thread is busy doing something else (a network response processing, a big re-render, etc.) — something the classic `Animated` + `PanResponder` combination can't guarantee, since `PanResponder` callbacks run on the JS thread. One structural detail worth knowing for current versions: as of Reanimated 4, the worklet mechanism itself — the Babel/SWC plugin, the UI-thread runtime, `runOnUI`/`runOnJS` — was extracted into its own standalone package, `react-native-worklets`, which Reanimated depends on and re-exports worklet APIs from for backwards compatibility (that re-export path is now deprecated in favor of importing directly from `react-native-worklets`, and the Babel plugin config moved from `react-native-reanimated/plugin` to `react-native-worklets/plugin`). So today it's more accurate to describe worklets as a general multithreading primitive that Reanimated is built on top of — other libraries can and do use the same worklets runtime independently of Reanimated — rather than a Reanimated-only concept.

**References:**
- [React Native Worklets docs — Getting started](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started/)
- [React Native Reanimated docs — Migrating from 3.x to 4.x](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)
- [React Native docs — Animations](https://reactnative.dev/docs/animations)

---

### 4. Implement a fade-in animation for a component using the `Animated` API: it should start at opacity 0 and animate to opacity 1 over 300ms as soon as the component mounts.

*Mid · Code Challenge*

**Answer:** Create an `Animated.Value` initialized to 0 with `useRef` (so it survives re-renders without being recreated), kick off `Animated.timing` toward 1 inside a `useEffect` that runs once on mount, and bind that value to the `opacity` style of an `Animated.View` with `useNativeDriver: true` since opacity is native-driver-safe.

**Why:** Using `useRef` rather than `useState` for the `Animated.Value` is important — you want one persistent mutable value object across renders, not a new one created on every render (which `useState`'s initializer would still avoid recreating, but `useRef` is the idiomatic choice `Animated` examples use since the value is mutated imperatively via `.setValue`/`start()`, not replaced). Running `.start()` inside `useEffect` with an empty dependency array ensures the animation fires exactly once, right after the initial mount, matching 'as soon as the component mounts.'

```
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

function FadeInView({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

export default FadeInView;
```

**References:**
- [React Native docs — Animations](https://reactnative.dev/docs/animations)

---

### 5. Which of the following style properties generally CANNOT be animated using `useNativeDriver: true` in the classic `Animated` API?

*Mid · Multiple Choice*

- opacity
- transform (translateX/translateY/scale)
- layout properties like width, height, or flex
- transform: rotate

**Answer:** Layout properties like width, height, or flex — the native driver can only animate properties that don't require re-running layout, so it's limited to `opacity` and `transform`.

**Why:** `opacity` and every `transform` sub-property (`translateX`/`translateY`, `scale`, `rotate`) are all correct as native-driver-supported — they can be applied directly on the native rendering layer (effectively as GPU-composited operations) without invalidating the surrounding layout, so the native side can own the whole animation independently once it's been configured. `width`/`height`/`flex` and other layout-affecting properties are the odd one out: changing them forces layout to be recalculated for that node and everything positioned relative to it, and that recalculation isn't something the simple native-driver value interpolation can perform on its own — it still has to go through the layout engine, which is why those properties are excluded from `useNativeDriver: true` and animating them falls back to the (slower) JS-driven path.

**References:**
- [React Native docs — Animations (useNativeDriver)](https://reactnative.dev/docs/animations)

---

### 6. What is the main reason `react-native-reanimated` v2/v3 introduced worklets?

*Mid · Multiple Choice*

- To let JavaScript animation code run directly on the UI thread instead of being bridged from the JS thread on every frame
- To allow animations to be written in a separate native language like Swift or Kotlin
- To replace the need for the Animated API's `Value` class
- To enable animations to persist across app restarts

**Answer:** To let JavaScript animation code run directly on the UI thread instead of being bridged from the JS thread on every frame — worklets are small JS functions extracted (automatically, via a Babel/SWC plugin) and executed on a lightweight UI-thread JS runtime, so per-frame animation/gesture logic no longer has to cross the bridge each time.

**Why:** Worklets aren't about a different language (they're still JavaScript, not Swift/Kotlin), aren't a replacement for the concept of a mutable animation value (Reanimated still has `useSharedValue`, analogous in spirit to `Animated.Value` but designed to be readable/writable from worklets on the UI thread), and have nothing to do with persistence across app restarts (that's a storage concern, unrelated to animation execution). The actual motivation was performance: before worklets, even 'native-driver' animations in the classic `Animated` API could only offload pre-declared configs, not arbitrary custom logic — anything conditional or gesture-driven still had to run on the JS thread and cross the bridge per frame. Worklets solve that by letting you write ordinary-looking JS functions that get compiled/marked to run on the UI thread's own JS context, giving gesture and animation code synchronous, per-frame access to shared values with no bridge/JSI round trip, which is what keeps interactions like drag gestures smooth even when the main JS thread is busy. Worth noting for current versions: as of Reanimated 4, the worklet mechanism itself was extracted into a standalone `react-native-worklets` package (Reanimated depends on it and re-exports the worklet APIs for backwards compatibility, though that path is now deprecated in favor of importing from `react-native-worklets` directly) — so worklets are now positioned as a general cross-thread JS execution primitive that other libraries can build on too, not something exclusive to Reanimated.

**References:**
- [React Native Worklets docs — Getting started](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started/)

---

### 7. How would you implement a complex gesture-driven interaction — like a swipeable card stack — while keeping animations running smoothly even under JS-thread load?

*Senior · Conceptual*

**Answer:** I'd build it with `react-native-gesture-handler` for gesture recognition and `react-native-reanimated` for the animated state and styles, keeping the entire drag → animate → snap/dismiss loop as worklets running on the UI thread — shared values track each card's position/rotation, a pan gesture's update callback mutates those shared values directly, and `useAnimatedStyle` derives the transform from them, so none of that per-frame work ever has to round-trip to the JS thread. JS only gets involved for things that aren't per-frame — e.g. calling a `runOnJS`-wrapped callback once a swipe crosses a threshold to update the underlying card-stack data/index — which keeps the interaction fluid even if the JS thread is busy with other work (network calls, re-renders elsewhere in the app).

**Why:** The reason this holds up under JS-thread load is architectural, not just a performance tweak: gesture-handler recognizes touches natively and reanimated worklets execute on the UI thread's own JS runtime, so the *whole* hot path — touch move events, position updates, derived transform/opacity/rotation styles — never depends on the main JS thread being free to run. Contrast that with the older `PanResponder` + `Animated`/`setState` approach, where every touch-move event is dispatched to the JS thread, state updates trigger a re-render, and the resulting style change has to be pushed back across the bridge — any JS-thread congestion directly shows up as dropped frames and gesture lag. For a card stack specifically, I'd model each card's `translateX`/`translateY`/`rotate` as shared values driven by the pan gesture, use `withSpring`/`withTiming` for the snap-back or fly-off-screen animation on release, and only cross back into JS (via `runOnJS`) for side effects that are inherently not animation-related, like advancing to the next card in a data array or firing an analytics event — keeping that JS involvement rare and off the per-frame path is what preserves smoothness. Worth knowing at this level: as of Reanimated 4, the worklet runtime itself (the Babel/SWC plugin, `runOnUI`/`runOnJS`) lives in a separate `react-native-worklets` package that Reanimated depends on, so the underlying mechanism making this whole pattern possible is really a general multithreading primitive, not something Reanimated invented and owns outright.

**References:**
- [React Native Gesture Handler docs — Your first gesture-driven animation](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-animation/)
- [React Native Worklets docs — Getting started](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started/)

---

### 8. A drag-to-dismiss modal is currently built with `PanResponder` and JS-thread state updates for its position, and it visibly lags on lower-end devices. Rewrite it using `react-native-reanimated` and `react-native-gesture-handler` so the gesture tracking runs on the UI thread instead.

*Senior · Code Challenge*

**Answer:** Replace `PanResponder` with `react-native-gesture-handler`'s pan gesture and replace the JS-thread `setState`-driven position with a Reanimated `useSharedValue` updated inside the gesture's `onUpdate`/`onEnd` callbacks (which run as worklets on the UI thread), driving the modal's `translateY` through `useAnimatedStyle` — so dragging, the animated style, and the dismiss/snap-back decision all happen without ever touching the JS thread per frame.

**Why:** The lag with the original implementation comes from `PanResponder` dispatching every touch-move event to the JS thread and each one triggering a `setState` + re-render + style recalculation before anything visually updates — on a lower-end device, any JS-thread congestion (GC pause, other work) shows up directly as dropped, laggy drag tracking. Moving to gesture-handler + reanimated worklets removes the JS thread from that loop entirely: the gesture's update callback runs on the UI thread and mutates a shared value directly, `useAnimatedStyle` recomputes the transform from that shared value on the same thread, and the two are wired together without any bridge/JSI round trip per frame. The dismiss decision (crossing a threshold) is still cheap to make inside the worklet itself; only the actual state change that should affect the rest of the app (closing the modal, e.g. via a parent callback or navigation) needs to jump back to JS, which is exactly what `runOnJS` is for — everything else stays on the UI thread. One API note: Gesture Handler 3 replaced the older builder-style gesture API (`Gesture.Pan().onUpdate(...).onEnd(...)`) with hook-based gestures like `usePanGesture({ onUpdate, onFinalize, ... })` — the builder API still works but is deprecated, so new code should prefer the hook form shown below; older codebases and some tutorials will still show the `Gesture.Pan()` builder chain, which is the same underlying mechanism, just a different (legacy) syntax for defining it.

```
import { StyleSheet } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const DISMISS_THRESHOLD = 150;

function DraggableModal({ onDismiss }: { onDismiss: () => void }) {
  const translateY = useSharedValue(0);

  // Gesture Handler 3's hook-based gesture API (current). The older
  // Gesture.Pan().onUpdate(...).onEnd(...) builder API still works but is
  // deprecated in favor of this hook form.
  const panGesture = usePanGesture({
    onUpdate: (event) => {
      translateY.value = Math.max(event.translationY, 0);
    },
    onFinalize: () => {
      if (translateY.value > DISMISS_THRESHOLD) {
        translateY.value = withTiming(800, { duration: 200 }, () => {
          runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    // GestureHandlerRootView normally wraps the whole app once, near the root;
    // shown here for a self-contained example.
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.modal, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  modal: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export default DraggableModal;
```

**References:**
- [React Native Gesture Handler docs — Your first gesture-driven animation](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-animation/)
- [React Native Gesture Handler docs — Upgrading to Gesture Handler 3 (builder API deprecation)](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)

---

### 9. How would you evaluate whether a given animation or gesture interaction should be built with the built-in `Animated` API versus `react-native-reanimated`, considering team familiarity, performance needs, and long-term maintenance cost?

*Senior · Open Question*

**Answer:** For a simple, declarative animation that doesn't depend on continuous gesture input — a fade-in on mount, a button press scale, a toggle transition — I'd default to the built-in `Animated` API with `useNativeDriver: true`, since it needs zero extra dependencies or native build configuration and the team already knows it. The moment the interaction is gesture-driven (drag, swipe, pinch), needs per-frame logic that isn't just interpolating a pre-declared value, or has shown measurable jank under `Animated`, I'd move it to `react-native-reanimated` + `react-native-gesture-handler`, since that's the combination actually designed to keep gesture-tracking and animation logic on the UI thread.

**Why:** The trade-off isn't really 'which is better' — it's matching the tool to what the interaction actually needs. `Animated` is lower cost: it ships with React Native, has no extra native setup, and the team's mental model transfers directly since most RN developers already know it — for a codebase with only occasional simple animations, adding Reanimated is arguably unnecessary complexity (extra native dependency, Babel/SWC plugin, worklet mental model to learn) for no real user-facing benefit. Reanimated earns its cost when the interaction is fundamentally about responding to continuous input smoothly under load — gesture-driven UI, complex chained/interruptible animations, anything that needs to keep running even if the JS thread is busy — because that's a class of problem `Animated`'s native driver genuinely can't solve (it can only offload pre-declared value interpolation, not arbitrary logic). Long-term maintenance cost also matters: Reanimated is a fast-moving library (worklets, its Babel/SWC plugin, and gesture-handler's own API have all changed across major versions — e.g. Gesture Handler 3 moving from a builder API to hooks, and Reanimated 4 extracting the entire worklet mechanism — Babel plugin, UI-thread runtime, `runOnUI`/`runOnJS` — out into a standalone `react-native-worklets` package that Reanimated now depends on), so a team adopting it takes on some ongoing upgrade churn that `Animated`, being part of core React Native, doesn't have in the same way. My rule of thumb: start with `Animated` for anything simple and declarative, reach for Reanimated deliberately when a concrete gesture-driven or per-frame-logic requirement demands it, not preemptively for every animation in the app.

**References:**
- [React Native docs — Animations](https://reactnative.dev/docs/animations)
- [React Native Worklets docs — Getting started](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started/)

---

## Debugging, Security & Best Practices

### 1. What tools are available for debugging a React Native app's JS state, component tree, and network requests during development (e.g. Flipper, React DevTools)?

*Junior · Conceptual*

**Answer:** The current, built-in tool is React Native DevTools — accessible from the Dev Menu or by pressing `j` in the Metro terminal — which gives you a Chrome-DevTools-style debugger with a console, a React component inspector (props/state/hooks), a network inspector, and a JS profiler, all wired directly into Metro. Alongside it, LogBox surfaces in-app errors/warnings and the Performance Monitor overlay shows live FPS/memory; for state-management-specific debugging, tools like Redux DevTools or Zustand's devtools middleware plug into React Native DevTools' Redux panel or their own browser extensions.

**Why:** This is an area where the tooling changed significantly and it's worth naming that explicitly: Flipper — a separate desktop app that used to be the standard way to inspect network requests, layout, and add custom plugins — was deprecated starting React Native 0.73 and dropped from new-app templates in 0.74; its own repository has since been archived, so it's no longer the current recommendation, even though older tutorials and some existing projects still reference it. React Native DevTools, built on Chrome DevTools infrastructure and shipped with the framework from 0.76 onward, replaced it as the built-in, no-extra-install debugging experience — it covers the JS-side debugging (console, breakpoints, component tree, network) that Flipper used to provide. What React Native DevTools doesn't cover is native-level debugging (native crashes, native view hierarchy, native memory) — for that you still reach for Xcode Instruments / Android Studio Profiler directly, since those are platform-native concerns outside the JS runtime.

**References:**
- [React Native docs — Debugging](https://reactnative.dev/docs/debugging)

---

### 2. Why shouldn't you store sensitive data like auth tokens in AsyncStorage, and what should you use instead on iOS and Android?

*Mid · Conceptual*

**Answer:** AsyncStorage is explicitly unencrypted persistent storage — its own docs describe it as such — so anything written to it sits in plain text in app-sandboxed storage on disk, readable by anyone with filesystem access (a rooted/jailbroken device, a device backup, or physical access to storage). For sensitive data like auth tokens, use the platform's secure storage instead: Keychain on iOS, Keystore-backed encrypted storage on Android, typically through a library like `react-native-keychain` or, in the Expo ecosystem, `expo-secure-store`.

**Why:** The threat model is the key thing to articulate: AsyncStorage protects against nothing beyond normal app sandboxing — it's fine for non-sensitive UI state, cached API responses, or feature flags, but a token stored there is one rooted device, backup extraction, or malicious app with storage access away from being read. Keychain (iOS) and Keystore (Android) are hardware-backed or OS-level encrypted stores designed specifically for credentials: values are encrypted at rest, and on many devices the encryption key itself is tied to secure hardware, so extracting the raw value requires more than just reading a file. `expo-secure-store` wraps exactly those two mechanisms (Keychain via `kSecClassGenericPassword` on iOS, Android's Keystore system on Android) behind one cross-platform API, which is why it — or the equivalent `react-native-keychain` for bare projects — is the standard recommendation over hand-rolling encryption on top of AsyncStorage.

**References:**
- [GitHub — react-native-async-storage/async-storage (README)](https://github.com/react-native-async-storage/async-storage)
- [Expo docs — SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

### 3. What's the risk of shipping a React Native app to production with verbose `console.log` statements or detailed error messages still enabled?

*Mid · Conceptual*

**Answer:** Verbose logs and detailed error messages routinely leak information that shouldn't leave the device or the app: auth tokens, API keys embedded in requests, user PII, internal API URLs/response shapes, or stack traces revealing implementation details — any of which becomes visible to anyone with basic device debugging access (or, worse, gets forwarded to a remote crash/analytics service and stored there). There's also a real performance cost on Hermes-based apps: excessive `console.log` calls, especially in hot paths, add overhead and noise that makes real production issues harder to spot in crash/log aggregation.

**Why:** The risk isn't hypothetical: `console.log` output is trivially visible to anyone who connects a device to a debugger or, on some setups, even via basic ADB logcat access on Android, so logging a full request payload 'just for debugging' during development is a common way tokens and PII end up somewhere they shouldn't be if that log line ships to production. Detailed error messages surfaced directly to end users (e.g. showing a raw exception message or stack trace in an alert) are a related but distinct risk — beyond leaking implementation details useful to an attacker probing the app, they're simply bad UX. The standard practice is to gate verbose logging behind `__DEV__` (or an explicit build-time flag) so it's compiled out or no-op'd in release builds, route anything that does need to reach a remote service through a logger that redacts sensitive fields first, and show generic, user-facing error messages in the UI while sending the detailed version only to a controlled crash-reporting backend.

**References:**
- [React Native docs — Debugging](https://reactnative.dev/docs/debugging)

---

### 4. A production crash report shows only "Network request failed" with no further context. Add error handling and logging around a `fetch` call so future crash/error reports include the request URL, response status code, and response body when something goes wrong.

*Mid · Code Challenge*

**Answer:** Wrap the `fetch` call in a helper that checks `response.ok`, and on failure throws a custom `Error` carrying the URL, status code, and response body as structured properties (not just a message string), then log/report that structured error — that turns a generic 'Network request failed' into something a crash reporting tool can actually filter and act on. Also wrap the `fetch` call itself in a try/catch to distinguish genuine network failures (no connectivity, DNS failure — `fetch` rejects) from HTTP-level failures (a reachable server returning 4xx/5xx — `fetch` resolves normally, so `response.ok` has to be checked explicitly).

**Why:** The core mistake `fetch`'s default behavior invites is treating a resolved promise as success — `fetch` only rejects on network-level failures (DNS, no connectivity, CORS on web); a 404 or 500 response still resolves the promise, so if you don't check `response.ok`/`response.status` explicitly, an HTTP error silently looks the same as success until something downstream breaks and produces a vague crash. Attaching the URL, status, and body as structured fields on a custom `Error` (rather than interpolating them into the message string) matters because most crash-reporting SDKs (Sentry, Bugsnag, Crashlytics) let you attach extra context/metadata to an error report — structured fields are filterable and searchable across many crash reports, while a single flattened message string isn't. Redact or avoid logging sensitive fields from the request/response (auth headers, tokens, PII) even in this structured error, since crash reports often get shipped to a third-party service — this is the same sensitive-data-in-logs concern that applies to any production logging.

```
type ApiErrorInit = {
  url: string;
  status: number;
  body: string;
};

class ApiError extends Error {
  url: string;
  status: number;
  body: string;

  constructor({ url, status, body }: ApiErrorInit) {
    super(`API request failed: ${status} ${url}`);
    this.name = 'ApiError';
    this.url = url;
    this.status = status;
    this.body = body;
  }
}

async function fetchJson(url: string, options?: RequestInit) {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (networkError) {
    // fetch itself rejected: no connectivity, DNS failure, etc.
    logError(new ApiError({ url, status: 0, body: String(networkError) }));
    throw networkError;
  }

  if (!response.ok) {
    // fetch resolved, but the server returned an HTTP error status.
    const body = await response.text().catch(() => '<unreadable body>');
    const error = new ApiError({ url, status: response.status, body });
    logError(error);
    throw error;
  }

  return response.json();
}

function logError(error: ApiError) {
  // Send structured context to your crash/error reporting tool, e.g.:
  // Sentry.captureException(error, { extra: { url: error.url, status: error.status, body: error.body } });
  console.error('[API error]', { url: error.url, status: error.status, body: error.body });
}
```

**References:**
- [React Native docs — Networking (fetch)](https://reactnative.dev/docs/network)
- [MDN — Using the Fetch API (checking response.ok)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

---

### 5. Which storage mechanism is recommended for securely storing an auth token in a React Native app?

*Mid · Multiple Choice*

- AsyncStorage, since it's built into React Native
- A plain JavaScript variable in a global module
- A platform secure storage solution like Keychain (iOS) / Keystore (Android), typically via a library like react-native-keychain or expo-secure-store
- Redux Persist with no additional encryption

**Answer:** A platform secure storage solution like Keychain (iOS) / Keystore (Android), typically via a library like react-native-keychain or expo-secure-store — these are the OS-level encrypted stores designed specifically for credentials.

**Why:** AsyncStorage is wrong because it's explicitly unencrypted, plain-text, sandboxed disk storage — fine for non-sensitive state, not for tokens. A plain JS variable in a global module is wrong for a different reason: it doesn't persist (lost on reload/app restart) and offers no protection at all — it's just as readable via a debugger as anything else in memory, and it can't survive the app being backgrounded and killed. Redux Persist with no additional encryption is wrong because Redux Persist just serializes store state to a storage engine (commonly AsyncStorage) — without an encryption layer on top, it inherits AsyncStorage's exact plain-text weakness; Redux Persist can be paired with an encrypted storage engine, but 'no additional encryption' in the option explicitly rules that out. Keychain/Keystore-backed storage is correct because it's encrypted at rest (often hardware-backed), designed by the platform vendors specifically for exactly this use case.

**References:**
- [Expo docs — SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [GitHub — react-native-async-storage/async-storage (README)](https://github.com/react-native-async-storage/async-storage)

---

### 6. Which of the following is a best practice for preventing sensitive data from leaking through crash reports or logs in a production React Native app?

*Mid · Multiple Choice*

- Log full request/response payloads for every API call to make debugging easier
- Strip or redact sensitive fields (tokens, passwords, PII) before logging, and disable verbose debug logging in production builds
- Disable crash reporting entirely to avoid any data collection
- Store logs only in AsyncStorage instead of sending them to a remote service

**Answer:** Strip or redact sensitive fields (tokens, passwords, PII) before logging, and disable verbose debug logging in production builds — this is the only option that actually reduces what leaves the device or reaches a third-party service while still keeping useful diagnostics.

**Why:** Logging full request/response payloads for every API call is exactly the anti-pattern that leaks tokens and PII into logs and crash reports — convenient for debugging, dangerous in production. Disabling crash reporting entirely avoids the specific leak risk but throws away the ability to detect and fix real production issues, which is an overcorrection, not a best practice — the right move is redacting sensitive fields, not losing observability altogether. Storing logs only in AsyncStorage instead of sending them remotely doesn't address the underlying problem at all — AsyncStorage is unencrypted, plain-text storage, so sensitive data would still be sitting in cleartext on the device (arguably a worse outcome, since it's now sitting locally indefinitely rather than being sent once to a service with its own access controls). Redacting sensitive fields at the logging layer (a wrapper around your logger/crash SDK that strips known-sensitive keys before anything is sent) combined with gating verbose logs behind `__DEV__`/build config is the standard practice — it keeps the diagnostic value of logging while removing the actual leak surface.

**References:**
- [React Native docs — Debugging](https://reactnative.dev/docs/debugging)

---

### 7. How would you approach securing a React Native app against reverse engineering and tampering, given that the JS bundle can be extracted and read fairly easily?

*Senior · Conceptual*

**Answer:** I'd start from the assumption that the client is fundamentally untrustworthy and can't keep a secret — so nothing truly sensitive (API secrets, signing keys, payment/business logic that must not be bypassed) belongs in the JS bundle or native code at all; it belongs behind a server endpoint that the app calls. On top of that baseline, I'd layer defense-in-depth on the client: Hermes bytecode compilation (default in modern RN) already makes the shipped bundle harder to read than raw JS, minification/obfuscation raises the bar further, ProGuard/R8 on Android strips and obscures native module code, and for apps with a real threat model (banking, DRM, anti-cheat) I'd add jailbreak/root detection, certificate/SSL pinning for API calls, and tamper-detection checks — while being explicit with stakeholders that all of this raises the cost of attack, it doesn't make reverse engineering impossible.

**Why:** The honest framing for a senior-level answer is that client-side hardening is about raising cost and adding friction, not achieving true security — a sufficiently motivated attacker can decompile Hermes bytecode (tools like hbctool/hermes-dec exist), bypass client-side jailbreak checks, and intercept traffic with a proxy even through cert pinning given enough effort. That's why the first move is always to move anything that would be catastrophic if extracted (API keys, signing secrets, pricing/discount logic that affects money, feature-gating that must actually be enforced) server-side, where it can be protected by real access control instead of obscurity. Client-side measures still have real value for raising the bar against casual tampering and automated scraping: Hermes bytecode is meaningfully harder to read than plain JS (though not encrypted — it's a compiled format, still technically decompilable), Metro's minify step further degrades readability, and SSL/certificate pinning meaningfully raises the effort needed to MITM API traffic even if it's not unbreakable. I'd size the actual investment to the app's real risk profile — a typical CRUD app doesn't need root-detection and pinning, but a banking or payments app does — since over-investing in client hardening for a low-risk app is wasted engineering effort that could go toward the server-side controls that actually matter.

**References:**
- [React Native docs — Using Hermes](https://reactnative.dev/docs/hermes)

---

### 8. How would you set up a debugging and observability strategy (crash reporting, remote logging, performance monitoring) for a React Native app in production, and how do you balance the detail you capture against user privacy?

*Senior · Open Question*

**Answer:** I'd layer three things: a crash-reporting SDK (e.g. Sentry, Bugsnag, or Firebase Crashlytics) wired to catch both JS exceptions and native crashes with source maps uploaded so stack traces are readable; structured remote logging for non-fatal errors and key app events, going through a redaction layer that strips tokens/PII before anything leaves the device; and a performance-monitoring layer (startup time, screen-render time, frozen-frame/ANR-style metrics) either from the same vendor or a dedicated tool. For privacy, I'd default every log/crash payload to the minimum necessary — no raw request/response bodies, no unredacted PII — and treat 'more detail' as something to opt into deliberately (e.g. sampling a subset of sessions with breadcrumb detail for hard-to-reproduce bugs) rather than the default posture, plus make sure the crash-reporting vendor's own data handling meets whatever privacy regulations (GDPR/CCPA) the app is subject to.

**Why:** The architecture question and the privacy question are actually the same design decision viewed from two angles: whatever data a tool captures by default (device info, breadcrumbs, network requests, console logs) is exactly the surface that needs a redaction/scrubbing policy before it's allowed to leave the device — most crash-reporting SDKs support a `beforeSend`-style hook precisely so you can strip sensitive fields at the point of capture rather than trusting yourself to never accidentally log a token. I'd separate fatal (crash) reporting, which should capture as much context as safely possible since it's rare and high-value, from routine logging, which should default to low-verbosity in production and be gated behind `__DEV__`/build flags for anything noisy, since indiscriminate production logging is itself a leak vector as well as a cost/noise problem. For performance monitoring specifically, I'd track user-facing metrics (JS thread FPS drops, time-to-interactive, screen transition time) rather than raw internals, and correlate them with release versions so a regression can be traced to a specific deploy. Practically, I'd also set explicit data-retention limits with whatever vendor is used, avoid capturing screen recordings/session replay unless there's a clear opt-in and legal basis for it (that feature category is one of the highest-risk from a privacy standpoint since it can capture on-screen PII by default), and document what's captured so it can be referenced for a privacy policy or a user data-deletion request.

**References:**
- [React Native docs — Debugging](https://reactnative.dev/docs/debugging)

---
