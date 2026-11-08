import { raTypeTag } from './dataTable'
import { en } from '@/translations/en'

describe('raTypeTag', () => {
  test('names each RA type with the same words everywhere, win_condition as "Win" not "Completed"', () => {
    expect(raTypeTag('progression', en.achievement)?.label).toBe(en.achievement.progression)
    expect(raTypeTag('win_condition', en.achievement)?.label).toBe(en.achievement.winCondition)
    expect(raTypeTag('missable', en.achievement)?.label).toBe(en.achievement.missable)
  })

  test('a type with no tag (or none) gives null', () => {
    expect(raTypeTag('', en.achievement)).toBeNull()
    expect(raTypeTag(null, en.achievement)).toBeNull()
    expect(raTypeTag('unknown', en.achievement)).toBeNull()
  })
})
