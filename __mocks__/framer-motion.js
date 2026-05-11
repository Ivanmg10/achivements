const React = require('react')

const motion = new Proxy(
  {},
  {
    get: (_, tag) =>
      React.forwardRef(({ children, ...props }, ref) => {
        const filtered = Object.fromEntries(
          Object.entries(props).filter(([k]) => !['animate', 'initial', 'exit', 'variants', 'transition', 'whileHover', 'whileTap', 'layout'].includes(k))
        )
        return React.createElement(tag, { ...filtered, ref }, children)
      }),
  }
)

const AnimatePresence = ({ children }) => children
const useAnimation = () => ({ start: jest.fn(), stop: jest.fn() })
const useInView = () => true
const useMotionValue = (v) => ({ get: () => v, set: jest.fn() })
const useTransform = () => ({ get: () => 0 })

module.exports = { motion, AnimatePresence, useAnimation, useInView, useMotionValue, useTransform }
