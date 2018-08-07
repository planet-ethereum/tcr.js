import Web3 from 'web3'
import Ganache from 'ganache-core'

import TCR from './index'
import Web3Utils from './web3-utils'

const web3 = new Web3(Ganache.provider({ gasLimit: 18000000 }))
const utils = new Web3Utils(web3)
let registry

beforeAll(async () => {
  registry = await utils.newRegistry()
})

test('should instantiate', async () => {
  const r = new TCR(web3, registry)
  await expect(r.init()).resolves
})

test('should apply', async () => {
  const r = new TCR(web3, registry)
  const app = await r.apply(web3.utils.sha3('test'), 120, '0x0')
  expect(app.deposit.toString()).toEqual('120')
  expect(app.hash).toMatch('0x')
})
