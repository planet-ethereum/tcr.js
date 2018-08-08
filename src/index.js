'use strict'
// @flow
import Web3 from 'web3'
import StateMachine from './state-machine'
import Account from './account'
import Token from './token'
import Web3Utils from './web3-utils'
import PLCRVoting from '../tcr/build/contracts/PLCRVoting.json'
import EIP20Interface from '../tcr/build/contracts/EIP20Interface.json'

export default class TCR {
  web3: Object
  web3Utils: Web3Utils
  registry: Object
  plcr: Object
  token: Token
  stateMachine: StateMachine
  account: Account

  constructor (provider: Object, registry: Object) {
    this.web3 = new Web3(provider)
    this.web3Utils = new Web3Utils(this.web3)
    this.registry = registry
    this.account = new Account(this.web3)
  }

  async init () {
    this.plcr = this.web3Utils.getContract(PLCRVoting.abi, await this.getVotingAddr())
    this.token = new Token(this.web3Utils.getContract(EIP20Interface.abi, await this.getTokenAddr()))
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

  async getVotingAddr () {
    return this.registry.methods.voting().call()
  }

  async getTokenAddr () {
    return this.registry.methods.token().call()
  }
}
