'use strict'
// @flow

export default class Token {
  contract: Object

  constructor (contract: Object) {
    this.contract = contract
  }

  async approve (addr: string, amount: number, web3Opts: Object = {}) {
    return this.contract.methods.approve(addr, amount).send(web3Opts)
  }

  async transfer (to: string, amount: number, web3Opts: Object = {}) {
    return this.contract.methods.transfer(to, amount).send(web3Opts)
  }
}
