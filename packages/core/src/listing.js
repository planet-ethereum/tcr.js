'use strict'
// @flow
import BN from 'bn.js'

export default class Listing {
  stateMachine: Object
  hash: string
  deposit: number
  appEndDate: number
  data: string
  applicant: string
  whitelisted: boolean

  constructor (stateMachine: Object, { listingHash, deposit, appEndDate, data, applicant }: {
    listingHash: string,
    deposit: number,
    appEndDate: number,
    data: string,
    applicant: string
  }) {
    this.stateMachine = stateMachine
    this.hash = listingHash
    this.deposit = deposit
    this.appEndDate = appEndDate
    this.data = data
    this.applicant = applicant
    this.whitelisted = false

    if (this.deposit && typeof this.deposit === 'string') {
      this.deposit = new BN(this.deposit, 10)
    }
  }

  async updateStatus () {
    const method = this.stateMachine.registry.methods.updateStatus(this.hash)
    const tx = await this.stateMachine.web3Utils.sendTx(method)
    await this.stateMachine.updateFromTx(tx)
    return this
  }

  async deposit (amount: number) {
    const tx = await this.stateMachine.registry.methods.deposit(this.hash, amount).send()
    await this.stateMachine.updateFromTx(tx)
    return this
  }

  async withdraw (amount: number) {
    const tx = await this.stateMachine.registry.methods.withdraw(this.hash, amount).send()
    await this.stateMachine.updateFromTx(tx)
    return this
  }

  async challenge (data: string, web3Opts: Object = {}) {
    const method = this.stateMachine.registry.methods.challenge(this.hash, data)
    const tx = await this.stateMachine.web3Utils.sendTx(method, web3Opts)
    await this.stateMachine.updateFromTx(tx)
    return this.stateMachine.challenges.get(this.hash)
  }

  async exit () {
    return this.stateMachine.registry.methods.exit(this.hash).send()
  }
}
