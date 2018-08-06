import Application from './application'
import Account from './account'

test('should instantiate', async () => {
  const acc = new Account()
  const a = new Application(acc, {}, {})
  expect(a.registry).toEqual({})
})
