import 'rxflare-js/style.css'

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

      Button('点击增加', {
        onClick: () => {
          count.value++
        }
      })
    ]
  })
}).mount('#app')