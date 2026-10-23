/* eslint-disable @typescript-eslint/no-require-imports -- Next loads this adapter through CommonJS. */
const { isAbsolute, relative, resolve } = require('node:path')
const { globSync } = require('tinyglobby')

// Next's lint root lookup uses only globSync(string, { onlyDirectories: true }).
// Preserve fast-glob's literal-directory and path conventions without braces.
exports.globSync = (pattern, options) => {
  // Lint configuration is trusted, but bound parsing work for pathological patterns.
  if (typeof pattern !== 'string' || pattern.length > 1024) throw new SyntaxError('Lint root patterns must be strings of at most 1024 characters')
  const cwd = resolve(options?.cwd || '.')
  return globSync(pattern, { ...options, cwd, absolute: true, expandDirectories: false })
    .map(match => {
      const path = resolve(match)
      return (isAbsolute(pattern) ? path : relative(cwd, path) || '.').replaceAll('\\', '/')
    })
}
