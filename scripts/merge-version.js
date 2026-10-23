// Git merge driver for src/lib/version.ts and package.json (see .gitattributes).
// The pre-commit hook bumps the patch on every commit, so two branches always change
// the version line. Both sides get the higher version, then git merges the rest of
// the file as usual: any other conflict (a dependency in package.json) still shows.
// Registered by `npm run prepare`. Called as: node merge-version.js %O %A %B

const { execFileSync } = require('child_process')
const fs = require('fs')

const VERSION = /(APP_VERSION = '|"version": ")([^'"]+)/

function parts(v) {
  return v.split('-')[0].split('.').map(Number)
}

function higher(a, b) {
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? a : b
  return a
}

function withVersion(text, v) {
  return text.replace(VERSION, (_, prefix) => prefix + v)
}

function pinHigher(ours, theirs) {
  const a = ours.match(VERSION)
  const b = theirs.match(VERSION)
  if (!a || !b) return [ours, theirs]
  const v = higher(a[2], b[2])
  return [withVersion(ours, v), withVersion(theirs, v)]
}

if (require.main === module) {
  const [base, ours, theirs] = process.argv.slice(2)
  const [a, b] = pinHigher(fs.readFileSync(ours, 'utf8'), fs.readFileSync(theirs, 'utf8'))
  fs.writeFileSync(ours, a)
  fs.writeFileSync(theirs, b)
  try {
    execFileSync('git', ['merge-file', ours, base, theirs], { stdio: 'inherit' })
  } catch (e) {
    process.exit(e.status || 1)
  }
}

module.exports = { higher, pinHigher }
