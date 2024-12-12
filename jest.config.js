module.exports = {
  // Use Angular-specific Jest preset
  preset: 'jest-preset-angular',

  // Disable verbose output
  verbose: false,

  // File extensions to process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Pattern to detect test files
  testMatch: ['**/?(*.)(spec).(ts|js)?(x)'],

  // Setup files to run before tests
  setupFilesAfterEnv: [
    'jest-canvas-mock', // Mock canvas API
    '<rootDir>/jestSetupAfterEnv.ts' // Custom setup
  ],

  // Directories to search for modules
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Files to collect coverage information from
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!**/node_modules/**'
  ],

  // Patterns to exclude from coverage collection
  coveragePathIgnorePatterns: [
    '<rootDir>/src/main.ts', // Main entry file
    '.mock.ts' // Mock files
  ],
}
