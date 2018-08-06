'use strict'
// @flow

export default class Account {
  web3: Object
  addr: string

  constructor (web3: Object) {
    this.web3 = web3
  }

  async address () {
    if (this.addr) {
      return this.addr
    }

    this.addr = await this.web3.eth.getCoinbase()
    return this.addr
  }
}
