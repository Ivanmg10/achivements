const { higher, pinHigher } = require('./merge-version')

describe('merge-version', () => {
  it('picks the higher version by number, not by text', () => {
    expect(higher('1.6.9', '1.6.10')).toBe('1.6.10')
    expect(higher('1.7.0', '1.6.30')).toBe('1.7.0')
    expect(higher('1.6.2', '1.6.2')).toBe('1.6.2')
  })

  it('sets both sides of version.ts to the higher version', () => {
    expect(pinHigher("export const APP_VERSION = '1.6.22'\n", "export const APP_VERSION = '1.6.23'\n"))
      .toEqual(["export const APP_VERSION = '1.6.23'\n", "export const APP_VERSION = '1.6.23'\n"])
  })

  it('touches only the top-level version in package.json', () => {
    const ours = '{\n  "version": "1.6.30",\n  "dependencies": { "x": "1.0.0" }\n}\n'
    const theirs = '{\n  "version": "1.6.23",\n  "dependencies": { "x": "2.0.0" }\n}\n'
    const [a, b] = pinHigher(ours, theirs)
    expect(a).toBe(ours)
    expect(b).toBe('{\n  "version": "1.6.30",\n  "dependencies": { "x": "2.0.0" }\n}\n')
  })

  it('leaves files without a version alone', () => {
    expect(pinHigher('a', 'b')).toEqual(['a', 'b'])
  })
})
