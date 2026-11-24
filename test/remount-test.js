
import {
  App,
  Column,
  Text,
  Button,
  rx
} from './src/index.js'

const countA = rx(0)
const countB = rx(100)

const appA = App({
  home: Column({
    children: [
      Text({
        text: () => `App A: ${countA.value}`
      }),
      Button({
        text: '增加 A',
        onClick: () => countA.value++
      })
    ]
  })
})

const appB = App({
  home: Column({
    children: [
      Text({
        text: () => `App B: ${countB.value}`
      }),
      Button({
        text: '增加 B',
        onClick: () => countB.value++
      })
    ]
  })
})

console.log('--- MOUNT A ---')
const instanceA = appA.mount('#app')

console.log('--- MOUNT B ---')
const instanceB = appB.mount('#app')

console.log('--- UPDATE OLD DATA ---')
countA.value++

console.log('--- UPDATE NEW DATA ---')
countB.value++

console.log('--- UNMOUNT OLD INSTANCE ---')
instanceA.unmount()

console.log('--- UNMOUNT NEW INSTANCE ---')
instanceB.unmount()

console.log('--- FINISHED ---')
