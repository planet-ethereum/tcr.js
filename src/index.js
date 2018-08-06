'use strict'
// @flow
import Application from './application'
import Listing from './listing'
import Account from './account'

export default class TCR {
  web3: Object
  registry: Object
  applications: Map<string, Application>
  listings: Map<string, Listing>
  synced: boolean
  account: Account

  constructor (web3: Object, registry: Object) {
    this.web3 = web3
    this.registry = registry
    this.applications = new Map()
    this.listings = new Map()
    this.synced = false
    this.account = new Account(web3)
  }

  async init () {
    await this.sync()
  }

  async apply (hash: string, amount: number, data: string) {
    let gas = await this.registry.methods.apply(hash, amount, data).estimateGas()
    // The estimated gas doesn't seem to work
    // for apply.
    gas = (gas * 3) / 2
    const tx = await this.registry.methods.apply(hash, amount, data).send({ gas })

    return new Application(this.account, this.registry, tx.events['_Application'].returnValues)
  }

  async getListings () {
    return this.listings
  }

  async getListing (hash: string) {
    return this.listings.get(hash)
  }

  async getApplications () {
    return this.applications
  }

  async getApplication (hash: string) {
    return this.applications.get(hash)
  }

  async sync () {
    let logs = await this.registry.getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' })
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i]
      this.updateState(log)
    }
    this.synced = true
  }

  updateState (log: Object) {
    let values = log.returnValues
    let hash = values.listingHash
    let a
    switch (log.event) {
      case '_Application':
        this.applications.set(hash, new Application(this.account, this.registry, values))
        break
      case '_ApplicationWhitelisted':
        a = this.applications.get(hash)
        if (!a) break

        this.listings.set(hash, new Listing(this.registry, a))
        break
      case '_Deposit':
        a = this.applications.get(hash)
        if (!a) break

        a.deposit = values.newTotal
        break
      case '_ListingRemoved':
      case '_ListingWithdrawn':
      case '_TouchAndRemoved':
        this.listings.delete(hash)
        this.applications.delete(hash)
        break
      case '_ApplicationRemoved':
        this.applications.delete(hash)
        break
      default:
        console.error('Invalid event type')
    }
  }
}
