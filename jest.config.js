module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: { "^.+\\.(ts|tsx|js|jsx)$": "babel-jest" },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "^@/context/LanguageContext$": "<rootDir>/__mocks__/context/LanguageContext.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next/image$": "<rootDir>/__mocks__/next/image.js",
    "^next/link$": "<rootDir>/__mocks__/next/link.js",
    "^next/navigation$": "<rootDir>/__mocks__/next/navigation.js",
    "^next/font/google$": "<rootDir>/__mocks__/next/font/google.js",
    "^next/server$": "<rootDir>/__mocks__/next/server.js",
    "^next-auth$": "<rootDir>/__mocks__/next-auth.js",
    "^next-auth/react$": "<rootDir>/__mocks__/next-auth/react.js",
    "^@tabler/icons-react$": "<rootDir>/__mocks__/tablerIconsMock.js",
    "^recharts$": "<rootDir>/__mocks__/recharts.js",
    "^framer-motion$": "<rootDir>/__mocks__/framer-motion.js",
  },
  // One worker per core (15 on a 16-thread machine), each with jsdom and coverage,
  // ran out of RAM next to the dev server and VS Code: "Jest worker encountered 2
  // child process exceptions". Half the cores, and a worker that grows past 1 GB
  // is restarted between files instead of crashing mid-file.
  maxWorkers: "50%",
  workerIdleMemoryLimit: "1GB",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!src/test-utils/**",
    "!src/**/*.css",
  ],
  // A floor, not a goal: a little under what the suite really reaches (93 / 86 / 89 / 95 on
  // 2026-10-09), so it fails on a real regression and not on noise. Raise it as tests land.
  coverageThreshold: {
    global: { statements: 90, branches: 83, functions: 86, lines: 92 },
  },
};
