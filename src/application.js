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
  whitelisted: boolean

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
    this.whitelisted = false

    if (this.deposit && typeof this.deposit === 'string') {
      this.deposit = new BN(this.deposit, 10)
    }
  }

  async updateStatus () {
    let gas = await this.registry.methods.updateStatus(this.hash).estimateGas()
    gas = gas * 2
    const tx = await this.registry.methods.updateStatus(this.hash).send({ gas })
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

  async challenge (data: string, web3Opts: Object = {}) {
    let gas = await this.registry.methods.challenge(this.hash, data).estimateGas()
    gas = gas * 2
    const opts = Object.assign({}, { gas }, web3Opts)
    const tx = await this.registry.methods.challenge(this.hash, data).send(opts)
    await this.stateMachine.updateFromTx(tx)
    return this.stateMachine.challenges.get(this.hash)
  }
}
