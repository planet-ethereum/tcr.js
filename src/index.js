'use strict'
// @flow
import StateMachine from './state-machine'
import Account from './account'
import PLCRVoting from '../tcr/build/contracts/PLCRVoting.json'

export default class TCR {
  web3: Object
  registry: Object
  plcr: Object
  stateMachine: StateMachine
  account: Account

  constructor (web3: Object, registry: Object) {
    this.web3 = web3
    this.registry = registry
    this.account = new Account(web3)
  }

  async init () {
    this.plcr = await this.getVotingContract()
    this.stateMachine = new StateMachine(this.web3, this.registry, this.plcr)
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

  async getVotingContract () {
    const addr = await this.registry.methods.voting().call()
    const contract = new this.web3.eth.Contract(PLCRVoting.abi, addr)
    return contract
  }

  async requestVotingRights (amount: number, web3Opts: Object = {}) {
    return this.plcr.methods.requestVotingRights(amount).send(web3Opts)
  }

  async withdrawVotingRights (amount: number, web3Opts: Object = {}) {
    let gas = await this.plcr.methods.withdrawVotingRights(amount).estimateGas()
    const opts = Object.assign({}, { gas }, web3Opts)
    return this.plcr.methods.withdrawVotingRights(amount).send(opts)
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
