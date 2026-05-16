import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Don't try to load Next.js internals or DB in unit tests
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default config;
