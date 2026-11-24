
import { runWithCleanupContext } from './cleanup.js'

export function createLifecycle(eventDelegator = null) {
  const entries = []

  let mounted = false
  let unmounted = false

  return {
    // 当前生命周期共享的事件代理器
    eventDelegator,

register(props = {}, element = null) {
  const entry = {
    element,
    onMount: props.onMount,
    onUnmount: props.onUnmount,
    cleanups: []
  }

      entries.push(entry)

      // 返回当前 Widget 专属的清理注册函数
      return callback => {
        if (typeof callback !== 'function') return

        if (unmounted) {
          callback()
          return
        }

        entry.cleanups.push(callback)
      }
    },

    mount() {
      if (mounted || unmounted) return

      mounted = true

      const errors = []

      for (const entry of entries) {
        if (typeof entry.onMount !== 'function') continue

        try {
          runWithCleanupContext(entry.cleanups, () => {
      entry.onMount(entry.element)
          })
        } catch (error) {
          errors.push(error)
        }
      }

      if (errors.length > 0) {
        throw new AggregateError(
          errors,
          'RxFlare: onMount callbacks failed.'
        )
      }
    },

    unmount() {
      if (unmounted) return

      unmounted = true

      const errors = []

      for (const entry of [...entries].reverse()) {
        const callbacks = [
          ...entry.cleanups.reverse(),
          ...(typeof entry.onUnmount === 'function'
            ? [() => entry.onUnmount(entry.element)]
            : [])
        ]

        for (const callback of callbacks) {
          try {
            callback()
          } catch (error) {
            errors.push(error)
          }
        }

        entry.cleanups.length = 0
      }

      entries.length = 0

      if (errors.length > 0) {
        throw new AggregateError(
          errors,
          'RxFlare: Cleanup callbacks failed.'
        )
      }
    }
  }
}
