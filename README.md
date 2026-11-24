# RxFlare JS

**A Fine-Grained Reactive UI Framework for JavaScript.**

RxFlare JS is a lightweight reactive UI framework built around native DOM, native CSS, and fine-grained reactivity.

It focuses on making UI development simple, efficient, and enjoyable.

## Features

- Fine-grained reactive state
- Reactive effects and computed values
- Batch updates
- Effect scopes and automatic cleanup
- Component-based UI composition
- Native DOM properties and CSS properties
- Event handling and event delegation
- Component lifecycle management
- Dynamic rendering with `When` and `For`
- Fragment support
- Page-level CSS isolation
- Page lifecycle and page switching

## Installation

```bash
npm install rxflare-js
```
## Import Styles

Import the default stylesheet in your application entry file:

\`\`\`js
import 'rxflare-js/style.css'
\`\`\`

## Quick Start

```js
import {
  App,
  Column,
  Text,
  Button,
  rx
} from 'rxflare-js'

const count = rx(0)

App({
  home: Column({
    gap: 12,
    children: [
      Text(() => `Count: ${count.value}`),

      Button('Increment', {
        onClick: () => {
          count.value++
        }
      })
    ]
  })
}).mount('#app')
```

## Core Concepts

### Reactive State

```js
import { rx, effect, computed } from 'rxflare-js'

const count = rx(0)

const double = computed(() => count.value * 2)

effect(() => {
  console.log(count.value, double.value)
})
```

### Components

RxFlare provides semantic UI components such as:

- `Column`
- `Row`
- `Text`
- `Button`
- `Card`
- `Badge`
- `ProgressBar`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`

### Dynamic Rendering

- `When`
- `For`
- `Fragment`
- `Component`
- `ErrorBoundary`

### Lifecycle and Cleanup

```js
import { onCleanup } from 'rxflare-js'
```

Use `onCleanup()` inside `onMount()` to register cleanup callbacks.

## Page Management

```js
const page = App({
  home: HomePage
}).mount('#app', {
  styles: `
    .card {
      padding: 16px;
    }
  `
})
```

Switch pages:

```js
const nextPage = page.update(UserPage, {
  styles: userStyles
})
```

Unmount:

```js
nextPage.unmount()
```

## Design Philosophy

RxFlare JS follows three principles:

1. Native DOM
2. Native CSS
3. Fine-grained Reactivity

The framework focuses on reactive updates, component composition, lifecycle management, and automatic cleanup rather than reimplementing browser capabilities.

## License

MIT