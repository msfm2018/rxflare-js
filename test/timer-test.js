
import {
  App,
  Column,
  Text,
  Button,
  rx
} from './src/index.js'

const count = rx(0)

let timer = null

const app = App({
  home: Column({
    gap: 16,

    onMount() {
      console.log('页面挂载')

      timer = setInterval(() => {
        count.value++
        console.log('Timer:', count.value)
      }, 1000)
    },

    onUnmount() {
      console.log('页面卸载')

      clearInterval(timer)
      console.log('Timer cleared')
    },

    children: [
      Text({
        text: () => `Count: ${count.value}`,
        size: 28
      }),

      Button({
        text: '卸载页面',

        onClick() {
          instance.unmount()
        }
      })
    ]
  })
})

const instance = app.mount('#app')
