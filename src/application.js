'use strict'
// @flow
import BN from 'bn.js'

import Account from './account'

export default class Application {
  account: Account
  registry: Object
  hash: string
  deposit: number
  appEndDate: number
  data: string
  applicant: string

  constructor (account: Account, registry: Object, { listingHash, deposit, appEndDate, data, applicant }: {
    listingHash: string,
    deposit: number,
    appEndDate: number,
    data: string,
    applicant: string
  }) {
    this.account = account
    this.registry = registry
    this.hash = listingHash
    this.deposit = deposit
    this.appEndDate = appEndDate
    this.data = data
    this.applicant = applicant

    if (typeof this.deposit === 'string') {
      this.deposit = BN(this.deposit)
    }
  }

  async updateStatus () {
    return this.registry.methods.updateStatus(this.hash).send()
  }

  async deposit (amount: number) {
    let tx = await this.registry.methods.deposit(this.hash, amount).send()
    const newTotal = tx.events[0].returnValues.newTotal
    console.log(newTotal)
    this.deposit = newTotal
  }
}
