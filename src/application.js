'use strict'
// @flow
import BN from 'bn.js'

export default class Application {
  stateMachine: Object
  registry: Object
  hash: string
  deposit: number
  appEndDate: number
  data: string
  applicant: string

  constructor (stateMachine: Object, registry: Object, { listingHash, deposit, appEndDate, data, applicant }: {
    listingHash: string,
    deposit: number,
    appEndDate: number,
    data: string,
    applicant: string
  }) {
    this.stateMachine = stateMachine
    this.registry = registry
    this.hash = listingHash
    this.deposit = deposit
    this.appEndDate = appEndDate
    this.data = data
    this.applicant = applicant

    if (this.deposit && typeof this.deposit === 'string') {
      this.deposit = new BN(this.deposit, 10)
    }
  }

  async updateStatus () {
    const tx = await this.registry.methods.updateStatus(this.hash).send()
    await this.stateMachine.updateFromTx(tx)
    return this
  }

  async deposit (amount: number) {
    const tx = await this.registry.methods.deposit(this.hash, amount).send()
    await this.stateMachine.updateFromTx(tx)
    return this
  }

  async withdraw (amount: number) {
    const tx = await this.registry.methods.withdraw(this.hash, amount).send()
    await this.stateMachine.updateFromTx(tx)
    return this
  }

  async challenge (data: string) {
    const tx = await this.registry.methods.challenge(this.hash, data).send()
    await this.stateMachine.updateFromTx(tx)
    return this.stateMachine.challenges.get(this.hash)
  }
}
