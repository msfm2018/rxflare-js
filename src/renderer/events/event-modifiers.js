
const EVENT_MODIFIERS = new Set([
  'stop',
  'prevent',
  'self',
  'once',
  'capture',
  'passive',
  'enter',
  'escape'
])

export function normalizeEvent(value) {
  // 普通函数形式
  if (typeof value === 'function') {
    return {
      handler: value,
      modifiers: []
    }
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const handler = value.handler

  // 普通函数，或者 Rx 响应式函数引用
  const isFunction = typeof handler === 'function'
  const isReactiveHandler =
    handler != null &&
    typeof handler === 'object' &&
    typeof handler.value === 'function'

  if (!isFunction && !isReactiveHandler) {
    throw new Error(
      'RxFlare: Event handler must be a function or an Rx function reference.'
    )
  }

  const modifiers = Array.isArray(value.modifiers)
    ? [...new Set(value.modifiers)]
    : []

  for (const modifier of modifiers) {
    if (!EVENT_MODIFIERS.has(modifier)) {
      throw new Error(
        `RxFlare: Unknown event modifier "${modifier}".`
      )
    }
  }

  if (
    modifiers.includes('passive') &&
    modifiers.includes('prevent')
  ) {
    throw new Error(
      'RxFlare: "passive" and "prevent" cannot be used together.'
    )
  }

  return {
    handler,
    modifiers
  }
}

export function getListenerOptions(modifiers) {
  return {
    once: modifiers.includes('once'),
    capture: modifiers.includes('capture'),
    passive: modifiers.includes('passive')
  }
}

export function runEventHandler(event, handler, modifiers, element) {
  if (modifiers.includes('self') && event.target !== element) {
    return
  }

  if (
    modifiers.includes('enter') &&
    event.key !== 'Enter'
  ) {
    return
  }

  if (
    modifiers.includes('escape') &&
    event.key !== 'Escape'
  ) {
    return
  }

  if (modifiers.includes('stop')) {
    event.stopPropagation()
  }

  if (
    modifiers.includes('prevent') &&
    event.cancelable
  ) {
    event.preventDefault()
  }

  // 每次事件触发时，读取最新回调
  const callback = typeof handler === 'function'
    ? handler
    : handler?.value

  if (typeof callback === 'function') {
    callback(event)
  }
}
