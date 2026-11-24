
import { mount } from '../renderer/mount.js'

function createWidget(type, props = {}) {
  return {
    type,
    props
  }
}

export function App(props = {}) {
  return {
    mount(selector, options = {}) {
      return mount(
        selector,
        props.home,
        options
      )
    }
  }
}

// ==============================
// Native HTML Element
// ==============================

export function Element(tag, props = {}) {
  if (typeof tag !== 'string' || !tag.trim()) {
    throw new TypeError(
      'RxFlare: Element expects a valid HTML tag name.'
    )
  }

  return createWidget('Element', {
    ...props,
    tag: tag.trim()
  })
}

export function Column(props = {}) {
  return createWidget('Column', props)
}

export function Row(props = {}) {
  return createWidget('Row', props)
}

// ==============================
// Text
// ==============================

export function Text(value, options = {}) {
  return createWidget('Text', {
    ...options,
    text: value
  })
}


export function Button(value, options = {}) {
  return createWidget('Button', {
    ...options,
    text: value
  })
}
export function Card(props = {}) {
  return createWidget('Card', props)
}

export function Badge(props = {}) {
  return createWidget('Badge', props)
}

export function ProgressBar(props = {}) {
  return createWidget('ProgressBar', props)
}

export function Slider(props = {}) {
  return createWidget('Slider', props)
}
export function Dialog(props = {}) {
  return createWidget('Dialog', props)
}
export function Spacer(props = {}) {
  return createWidget('Spacer', props)
}

export function Radio(props = {}) {
  return createWidget('Radio', props)
}

export function Switch(props = {}) {
  return createWidget('Switch', props)
}
export function Tabs(props = {}) {
  return createWidget('Tabs', props)
}

export function Tab(props = {}) {
  return createWidget('Tab', props)
}

export function TabPanel(props = {}) {
  return createWidget('TabPanel', props)
}

// ==============================
// Media Widgets
// ==============================

export function Image(props = {}) {
  return createWidget('Image', props)
}

// ==============================
// Navigation Widgets
// ==============================

export function Link(props = {}) {
  return createWidget('Link', props)
}


export function Form(props = {}) {
  return createWidget('Form', props)
}

export function Label(props = {}) {
  return createWidget('Label', props)
}

// ==============================
// Form Widgets
// ==============================

export function Input(props = {}) {
  return createWidget('Input', props)
}

export function Select(props = {}) {
  return createWidget('Select', props)
}

export function Textarea(props = {}) {
  return createWidget('Textarea', props)
}

export function Checkbox(props = {}) {
  return createWidget('Checkbox', props)
}

// ==============================
// Dynamic Widgets
// ==============================

export function When(props = {}) {
  return createWidget('When', props)
}

export function For(props = {}) {
  return createWidget('For', props)
}

export function ErrorBoundary(props = {}) {
  return createWidget('ErrorBoundary', props)
}

export function Component(component, props = {}) {
  if (typeof component !== 'function') {
    throw new TypeError(
      'RxFlare: Component expects a component function.'
    )
  }

  return createWidget('Component', {
    component,
    componentProps: props
  })
}

export function Fragment(props = {}) {
  return createWidget('Fragment', props)
}


export function Table(props = {}) {
  return createWidget('Table', props)
}

export function TableHead(props = {}) {
  return createWidget('TableHead', props)
}

export function TableBody(props = {}) {
  return createWidget('TableBody', props)
}

export function TableRow(props = {}) {
  return createWidget('TableRow', props)
}

export function TableCell(props = {}) {
  return createWidget('TableCell', props)
}

export function Video(props = {}) {
  return createWidget('Video', props)
}

export function Canvas(props = {}) {
  return createWidget('Canvas', props)
}

// ==============================
// Semantic HTML Elements
// ==============================

export function Header(props = {}) {
  return createWidget('Header', props)
}

export function Main(props = {}) {
  return createWidget('Main', props)
}

export function Footer(props = {}) {
  return createWidget('Footer', props)
}

export function Nav(props = {}) {
  return createWidget('Nav', props)
}

export function Section(props = {}) {
  return createWidget('Section', props)
}

export function Article(props = {}) {
  return createWidget('Article', props)
}

export function Aside(props = {}) {
  return createWidget('Aside', props)
}