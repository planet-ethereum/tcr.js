'use strict'
// @flow
import StateMachine from './state-machine'
import Account from './account'

export default class TCR {
  web3: Object
  registry: Object
  stateMachine: StateMachine
  account: Account

  constructor (web3: Object, registry: Object) {
    this.web3 = web3
    this.registry = registry
    this.account = new Account(web3)
    this.stateMachine = new StateMachine(web3, registry)
  }

  async init () {
    await this.stateMachine.sync()
  }

  async apply (hash: string, amount: number, data: string) {
    let gas = await this.registry.methods.apply(hash, amount, data).estimateGas()
    // The estimated gas doesn't seem to work
    // for apply.
    gas = Math.floor((gas * 3) / 2)
    const tx = await this.registry.methods.apply(hash, amount, data).send({ gas })
    await this.stateMachine.updateFromTx(tx)

    return this.getApplication(hash)
  }

  async getListings () {
    return this.stateMachine.listings
  }

  async getListing (hash: string) {
    return this.stateMachine.listings.get(hash)
  }

  async getApplications () {
    return this.stateMachine.applications
  }

  async getApplication (hash: string) {
    return this.stateMachine.applications.get(hash)
  }
}
