import {
  normalizeEvent,
  getListenerOptions,
  runEventHandler
} from './src/renderer/events/event-modifiers.js'

console.log('--- NORMAL FUNCTION ---')

const normal = normalizeEvent(() => {})

console.log(normal.modifiers.length === 0)

console.log('--- EVENT OBJECT ---')

const event = normalizeEvent({
  handler: () => {},
  modifiers: ['stop', 'once']
})

console.log(event.modifiers)

console.log('--- LISTENER OPTIONS ---')

console.log(
  getListenerOptions(event.modifiers)
)

console.log('--- INVALID MODIFIER ---')

try {
  normalizeEvent({
    handler: () => {},
    modifiers: ['unknown']
  })
} catch (error) {
  console.log(error.message)
}

console.log('--- PASSIVE + PREVENT ---')

try {
  normalizeEvent({
    handler: () => {},
    modifiers: ['passive', 'prevent']
  })
} catch (error) {
  console.log(error.message)
}