module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/src/*.{js}',
    '!**/node_modules/**',
  ],
  roots: [
    'packages/',
  ],
}
