
let activeCleanupContext = null

export function runWithCleanupContext(context, fn) {
  const previous = activeCleanupContext

  activeCleanupContext = context

  try {
    return fn()
  } finally {
    activeCleanupContext = previous
  }
}

export function onCleanup(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError(
      'RxFlare: onCleanup expects a function.'
    )
  }

  if (!activeCleanupContext) {
    throw new Error(
      'RxFlare: onCleanup must be called inside onMount.'
    )
  }

  activeCleanupContext.push(callback)
}
