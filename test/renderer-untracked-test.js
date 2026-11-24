
import {
  App,
  Column,
  Text,
  Button,
  rx
} from './src/index.js'

const count = rx(0)
const extra = rx(100)
let callbackRuns = 0
App({
  home: Column({
    gap: 16,
    children: [
      Text({
        text: () => `Count: ${count.value}`,
        size: 28,
        onUpdate: () => {
          console.log('Updated:', extra.value)
        }
      }),






Text({
  text: () => `Count: ${count.value}`,

  onUpdate: () => {
    callbackRuns++

    console.log(
      'Callback runs:',
      callbackRuns
    )

    if (callbackRuns === 1) {
      extra.value++
    }
  }
}),


      Text({
        text: () => `Extra: ${extra.value}`,
        size: 18
      }),

      Button({
        text: '修改 Count',
        onClick: () => {
          count.value++
        }
      }),

      Button({
        text: '修改 Extra',
        onClick: () => {
          extra.value++
        }
      })
    ]
  })
}).mount('#app')
