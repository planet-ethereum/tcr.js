import Web3 from 'web3'
import Ganache from 'ganache-core'

import Listing from './listing'
import Application from './application'
import Web3Utils from './web3-utils'

const web3 = new Web3(Ganache.provider({ gasLimit: 8000000 }))
const utils = new Web3Utils(web3)

test('should instantiate', async () => {
  const a = new Application(null, null, {})
  const l = new Listing({}, a)
  expect(l.registry).toEqual({})
})

test('should fail to exit with invalid hash', async () => {
  expect.assertions(1)
  const registry = await utils.newRegistry()
  const a = new Application(null, null, {})
  const l = new Listing(registry, a)
  l.exit().catch((e) => expect(e.message).toMatch('parameter'))
})
