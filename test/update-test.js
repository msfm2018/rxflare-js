
import {
  App,
  Column,
  Text,
  Button,
  ProgressBar,
  rx
} from './src/index.js'

const count = rx(0)
const progress = rx(0)

const app = App({
  home: Column({
    gap: 16,

    onMount() {
      console.log('Column mounted')
    },

    onUpdate() {
      console.log('Column updated')
    },

    onUnmount() {
      console.log('Column unmounted')
    },

    children: [
      Text({
        text: () => `Count: ${count.value}`,

        onMount() {
          console.log('Text mounted')
        },

        onUpdate() {
          console.log('Text updated:', count.value)
        },

        onUnmount() {
          console.log('Text unmounted')
        }
      }),

      ProgressBar({
        value: () => progress.value,

        onUpdate() {
          console.log('Progress updated:', progress.value)
        }
      }),

      Button({
        text: '增加 Count',

        onClick() {
          count.value++
        }
      }),

      Button({
        text: '增加 Progress',

        onClick() {
          progress.value += 10
        }
      })
    ]
  })
})

const instance = app.mount('#app')

console.log('--- INITIAL RENDER COMPLETE ---')

window.updateTest = {
  count,
  progress,
  instance
}
