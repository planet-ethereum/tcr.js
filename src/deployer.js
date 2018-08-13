'use strict'
// @flow
import Web3 from 'web3'

import Web3Utils from './web3-utils'

export default class Deployer {
  web3: Web3
  web3Utils: Web3Utils
  defaultParams: Array<number>

  constructor (provider: Object) {
    this.web3 = new Web3(provider)
    this.web3Utils = new Web3Utils(this.web3)
    this.defaultParams = [100, 100, 100, 100, 1, 100, 5, 100, 50, 50, 50, 50]
  }

  async newRegistry (params: Array<number> = this.defaultParams) {
    return this.web3Utils.newRegistry(params)
  }
}
