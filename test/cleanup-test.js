
import {
  App,
  Column,
  Text,
  Button,
  rx,
  onCleanup
} from './src/index.js'

const count = rx(0)

let instance

const app = App({
  home: Column({
    gap: 16,

    onMount() {
      console.log('Column mounted')

      const timer = setInterval(() => {
        count.value++
        console.log('Timer:', count.value)
      }, 1000)

      onCleanup(() => {
        clearInterval(timer)
        console.log('Timer cleanup')
      })
    },

    onUnmount() {
      console.log('Column unmounted')
    },

    children: [
      Text({
        text: () => `Count: ${count.value}`
      }),

      Button({
        text: '卸载组件',

        onClick() {
          instance.unmount()
        }
      })
    ]
  })
})

instance = app.mount('#app')
