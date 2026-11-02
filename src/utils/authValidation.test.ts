import { checkEmail, checkPassword, checkUsername, isEmail, suggestUsername } from './authValidation'

describe('isEmail', () => {
  test('takes an ordinary address', () => {
    expect(isEmail('ana.perez+vault@mail.example.com')).toBe(true)
  })
  test.each(['x@<b>hi</b>.example', 'a"b@c.de', "a'b@c.de", 'a&b@c.de', 'a b@c.de', 'a@b', `${'a'.repeat(250)}@c.de`])('refuses %s', (address) => {
    expect(isEmail(address)).toBe(false)
  })
})

describe('checkUsername', () => {
  test('accepts letters, numbers and underscores, 3 to 20 long', () => {
    expect(checkUsername('ivan')).toBeNull()
    expect(checkUsername('ivan_10')).toBeNull()
    expect(checkUsername('abc')).toBeNull()
    expect(checkUsername('a'.repeat(20))).toBeNull()
  })

  test('reports an empty field apart from a badly shaped one', () => {
    expect(checkUsername('')).toBe('empty')
    expect(checkUsername('   ')).toBe('empty')
    expect(checkUsername('ab')).toBe('shape')
    expect(checkUsername('a'.repeat(21))).toBe('shape')
    expect(checkUsername('ivan marquez')).toBe('shape')
    expect(checkUsername('iván')).toBe('shape')
  })

  test('ignores surrounding spaces, as the server does not', () => {
    expect(checkUsername('  ivan  ')).toBeNull()
  })
})

describe('checkPassword', () => {
  test('needs eight characters', () => {
    expect(checkPassword('secret12')).toBeNull()
    expect(checkPassword('1234567')).toBe('shape')
    expect(checkPassword('')).toBe('empty')
  })

  test('accepts spaces as characters', () => {
    expect(checkPassword('a b c d ')).toBeNull()
  })
})

describe('checkEmail', () => {
  test('accepts an ordinary address, spaces around it and all', () => {
    expect(checkEmail('ivan@test.com')).toBeNull()
    expect(checkEmail('  ivan.marquez+ra@test.co.uk  ')).toBeNull()
  })

  test('reports an empty field apart from a malformed one', () => {
    expect(checkEmail('')).toBe('empty')
    expect(checkEmail('   ')).toBe('empty')
    expect(checkEmail('ivan')).toBe('shape')
    expect(checkEmail('ivan@test')).toBe('shape')
    expect(checkEmail('ivan @test.com')).toBe('shape')
  })
})

describe('suggestUsername', () => {
  test('a name from another site as a username, when it can be one', () => {
    expect(suggestUsername('PalmeraMiami')).toBe('PalmeraMiami')
    expect(suggestUsername('Gabe Newell')).toBe('Gabe_Newell')
    expect(suggestUsername('★ab')).toBe('')
    expect(suggestUsername('a'.repeat(30))).toHaveLength(20)
  })
})
