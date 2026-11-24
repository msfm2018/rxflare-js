
import {
  App,
  Column,
  Row,
  Text,
  Button
} from './src/index.js'

const app = App({
  home: Column({
    onMount() {
      console.log('Column mounted')
    },

    onUnmount() {
      console.log('Column unmounted')
    },

    children: [
      Text({
        text: 'Hello RxFlare',

        onMount() {
          console.log('Text mounted')
        },

        onUnmount() {
          console.log('Text unmounted')
        }
      }),

      Row({
        onMount() {
          console.log('Row mounted')
        },

        onUnmount() {
          console.log('Row unmounted')
        },

        children: [
          Button({
            text: 'Test',

            onMount() {
              console.log('Button mounted')
            },

            onUnmount() {
              console.log('Button unmounted')
            }
          })
        ]
      })
    ]
  })
})

const instance = app.mount('#app')

console.log('--- UNMOUNT ---')

instance.unmount()

console.log('--- FINISHED ---')
