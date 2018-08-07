'use strict'
// @flow
import Application from './application'
import Listing from './listing'

export default class StateMachine {
  web3: Object
  registry: Object
  synced: boolean
  applications: Map<string, Application>
  listings: Map<string, Listing>
  validEvents: Set<string>

  constructor (web3: Object, registry: Object) {
    this.web3 = web3
    this.registry = registry
    this.synced = false
    this.applications = new Map()
    this.listings = new Map()
    this.validEvents = new Set([
      '_Application',
      '_Challenge',
      '_Deposit',
      '_Withdrawal',
      '_ApplicationWhitelisted',
      '_ApplicationRemoved',
      '_ListingRemoved',
      '_ListingWithdrawn',
      '_TouchAndRemoved',
      '_ChallengeFailed',
      '_ChallengeSucceeded',
      '_RewardClaimed',
      '_PollCreated'
    ])
  }

  async sync () {
    let logs = await this.registry.getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' })
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i]
      this.updateState(log)
    }
    this.synced = true
  }

  async updateFromTx (tx: Object) {
    let keys = Object.keys(tx.events)
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i]
      if (this.validEvents.has(k)) {
        this.updateState(tx.events[k])
      }
    }
  }

  updateState (log: Object) {
    let values = log.returnValues
    let hash = values.listingHash
    let a
    switch (log.event) {
      case '_Application':
        this.applications.set(hash, new Application(this, this.registry, values))
        break
      case '_Challenge':
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
      case '_Withdrawal':
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
