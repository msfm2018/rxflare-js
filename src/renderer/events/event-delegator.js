
import {
  runEventHandler
} from './event-modifiers.js'

// 不适合普通冒泡代理的事件
const DIRECT_EVENTS = new Set([
  'focus',
  'blur',
  'mouseenter',
  'mouseleave',
  'load',
  'unload',
  'scroll',
  'resize',
  'error',
  'abort'
])

export function createEventDelegator(root) {
  // eventName -> root listener
  const listeners = new Map()

  // element -> eventName -> handlers
  const elementHandlers = new WeakMap()

  let disposed = false

  function getHandlers(element, eventName) {
    let events = elementHandlers.get(element)

    if (!events) {
      events = new Map()
      elementHandlers.set(element, events)
    }

    let handlers = events.get(eventName)

    if (!handlers) {
      handlers = new Set()
      events.set(eventName, handlers)
    }

    return handlers
  }

  function dispatch(event) {
    if (disposed) return

    let element = event.target

    // 兼容文本节点
    if (element?.nodeType === 3) {
      element = element.parentElement
    }

    if (!element) return

    // 从事件目标向根容器逐层查找
    while (element) {
      const events = elementHandlers.get(element)
      const handlers = events?.get(event.type)

      if (handlers) {
        for (const record of [...handlers]) {
          if (!record.active) continue

          const { modifiers } = record

          // self
          if (
            modifiers.includes('self') &&
            event.target !== element
          ) {
            continue
          }

          // enter
          if (
            modifiers.includes('enter') &&
            event.key !== 'Enter'
          ) {
            continue
          }

          // escape
          if (
            modifiers.includes('escape') &&
            event.key !== 'Escape'
          ) {
            continue
          }

          try {
            runEventHandler(
              event,
              record.handler,
              modifiers,
              element
            )
          } finally {
            // once：每个 Widget 独立执行一次
            if (modifiers.includes('once')) {
              record.active = false
              handlers.delete(record)
            }
          }
        }
      }

      // stop：不再继续执行祖先元素上的处理器
      if (event.cancelBubble) {
        break
      }

      if (element === root) {
        break
      }

      element = element.parentElement
    }
  }

  function ensureListener(eventName) {
    if (listeners.has(eventName)) return

    const listener = event => {
      dispatch(event)
    }

    root.addEventListener(eventName, listener)

    listeners.set(eventName, listener)
  }

  function register(
    element,
    eventName,
    handler,
    modifiers = []
  ) {
    if (disposed) {
      throw new Error(
        'RxFlare: EventDelegator has been disposed.'
      )
    }

    // 捕获事件、非冒泡事件、passive 事件使用原生监听
    if (
      modifiers.includes('capture') ||
      modifiers.includes('passive') ||
      DIRECT_EVENTS.has(eventName)
    ) {
      const listener = event => {
        runEventHandler(
          event,
          handler,
          modifiers,
          element
        )
      }

      const options = {
        capture: modifiers.includes('capture'),
        passive: modifiers.includes('passive'),
        once: modifiers.includes('once')
      }

      element.addEventListener(
        eventName,
        listener,
        options
      )

      return () => {
        element.removeEventListener(
          eventName,
          listener,
          options.capture
        )
      }
    }

    // 普通冒泡事件使用根容器代理
    const handlers = getHandlers(element, eventName)

    const record = {
      handler,
      modifiers,
      active: true
    }

    handlers.add(record)

    ensureListener(eventName)

    return () => {
      if (!record.active) return

      record.active = false
      handlers.delete(record)
    }
  }

  function dispose() {
    if (disposed) return

    disposed = true

    for (const [eventName, listener] of listeners) {
      root.removeEventListener(
        eventName,
        listener
      )
    }

    listeners.clear()
  }

  return {
    register,
    dispose
  }
}
