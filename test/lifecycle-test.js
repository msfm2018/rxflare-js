
import {
  App,
  Column,
  Text,
  Button,
  rx
} from './src/index.js'

const count = rx(0)

const app = App({
  home: Column({
    gap: 16,
    children: [
      Text({
        text: () => `Count: ${count.value}`,
        size: 28
      }),

      Button({
        text: '增加',
        onClick: () => {
          count.value++
        }
      }),

      Button({
        text: '卸载组件',
        onClick: () => {
          appInstance.unmount()
          console.log('组件已卸载')
        }
      })
    ]
  })
})

const appInstance = app.mount('#app')

// 用于观察卸载后的响应式更新
window.testCount = count

console.log('组件已挂载')
