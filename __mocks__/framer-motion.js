const React = require('react')

const motion = new Proxy(
  {},
  {
    get: (_, tag) =>
      React.forwardRef(({ children, ...props }, ref) => {
        const filtered = Object.fromEntries(
          Object.entries(props).filter(([k]) => !['animate', 'initial', 'exit', 'variants', 'transition', 'whileHover', 'whileTap', 'layout', 'layoutId', 'whileInView', 'viewport'].includes(k))
        )
        return React.createElement(tag, { ...filtered, ref }, children)
      }),
  }
)

const AnimatePresence = ({ children }) => children
const useAnimation = () => ({ start: jest.fn(), stop: jest.fn() })
const useInView = () => true
const useMotionValue = (v) => ({ get: () => v, set: jest.fn() })
const useTransform = () => ({ get: () => 0, set: jest.fn() })
const useSpring = (v) => v ?? { get: () => 0, set: jest.fn() }
const useReducedMotion = () => false
const animate = () => ({ stop: () => {} })

module.exports = { motion, animate, AnimatePresence, useAnimation, useInView, useMotionValue, useTransform, useReducedMotion, useSpring }
