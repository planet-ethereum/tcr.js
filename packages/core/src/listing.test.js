import Web3 from 'web3'
import Ganache from 'ganache-core'

import Listing from './listing'
import Web3Utils from './web3-utils'

const web3 = new Web3(Ganache.provider({ gasLimit: 8000000 }))
const utils = new Web3Utils(web3)

test('should instantiate', async () => {
  const l = new Listing(null, {})
  expect(l.stateMachine).toEqual(null)
})
