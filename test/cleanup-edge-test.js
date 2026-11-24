
import {
  App,
  Column,
  Button,
  onCleanup
} from './src/index.js'

let instance

const app = App({
  home: Column({
    onMount() {
      console.log('--- MOUNT ---')

      onCleanup(() => {
        console.log('Cleanup A')
      })

      onCleanup(() => {
        console.log('Cleanup B')

        throw new Error('Cleanup B failed')
      })

      onCleanup(() => {
        console.log('Cleanup C')
      })
    },

    onUnmount() {
      console.log('onUnmount')
    },

    children: [
      Button({
        text: 'Unmount',

        onClick() {
          try {
            instance.unmount()
          } catch (error) {
            console.log('Caught:', error.message)
            console.log(
              'Errors:',
              error.errors?.length
            )
          }

          // 重复卸载，不能再次清理
          instance.unmount()

          console.log('--- FINISHED ---')
        }
      })
    ]
  })
})

instance = app.mount('#app')
