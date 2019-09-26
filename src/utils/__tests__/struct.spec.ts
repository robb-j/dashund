import { validate, Criteria } from '../struct'

describe('#validate', () => {
  describe('primatives', () => {
    it('should validate a string', () => {
      let result = validate(42, 'string')

      expect(result).toContainEqual({
        path: '',
        expected: 'string',
        got: 'number'
      })
    })

    it('should validate a number', () => {
      let result = validate('some_string', 'number')

      expect(result).toContainEqual({
        path: '',
        expected: 'number',
        got: 'string'
      })
    })

    it('should validate a boolean', () => {
      let result = validate(42, 'boolean')

      expect(result).toContainEqual({
        path: '',
        expected: 'boolean',
        got: 'number'
      })
    })
  })

  describe('primative[]', () => {
    it('should validate a string is not an string[]', () => {
      let result = validate('some_string', 'string[]')

      expect(result).toContainEqual({
        path: '',
        expected: 'string[]',
        got: 'string'
      })
    })
    it('should validate a number[] is not a string[]', () => {
      let result = validate([1, 2, 3], 'string[]')

      expect(result).toContainEqual({
        path: '',
        expected: 'string[]',
        got: 'any[]'
      })
    })
  })

  describe('primative{}', () => {
    it('should validate nested criteria', () => {
      let schema: Criteria = {
        name: 'string',
        age: 'number',
        labels: 'string[]',
        pet: {
          name: 'string'
        }
      }

      let result = validate(
        { name: 42, age: 'geoff', labels: '', pet: { age: 5 } },
        schema
      )

      expect(result).toHaveLength(4)

      expect(result).toContainEqual({
        path: 'name',
        expected: 'string',
        got: 'number'
      })
      expect(result).toContainEqual({
        path: 'age',
        expected: 'number',
        got: 'string'
      })
      expect(result).toContainEqual({
        path: 'labels',
        expected: 'string[]',
        got: 'string'
      })
      expect(result).toContainEqual({
        path: 'pet.name',
        expected: 'string',
        got: 'undefined'
      })
    })
  })
})
