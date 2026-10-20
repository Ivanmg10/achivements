const React = require('react')

// One component per tag, kept: a new type on every access made React remount a modal's whole
// content on each state change, which real framer-motion never does.
const components = {}
const motion = new Proxy(
  {},
  {
    get: (_, tag) =>
      (components[tag] ??= React.forwardRef(({ children, ...props }, ref) => {
        const filtered = Object.fromEntries(
          Object.entries(props).filter(([k]) => !['animate', 'initial', 'exit', 'variants', 'transition', 'whileHover', 'whileTap', 'layout', 'layoutId', 'whileInView', 'viewport', 'custom'].includes(k))
        )
        return React.createElement(tag, { ...filtered, ref }, children)
      })),
  }
)

// Remembers the props it was given last, so a test can see what the presence was asked for.
const AnimatePresence = (props) => {
  AnimatePresence.lastProps = props
  return props.children
}
const LayoutGroup = ({ children }) => children
const MotionConfig = ({ children }) => children
const useAnimation = () => ({ start: jest.fn(), stop: jest.fn() })
const useInView = () => true
const useMotionValue = (v) => ({ get: () => v, set: jest.fn() })
const useTransform = () => ({ get: () => 0, set: jest.fn() })
const useSpring = (v) => v ?? { get: () => 0, set: jest.fn() }
const useReducedMotion = () => false
const animate = () => ({ stop: () => {} })

module.exports = { motion, animate, AnimatePresence, LayoutGroup, MotionConfig, useAnimation, useInView, useMotionValue, useTransform, useReducedMotion, useSpring }
