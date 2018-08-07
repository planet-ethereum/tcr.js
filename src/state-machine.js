'use strict'
// @flow
import Application from './application'
import Listing from './listing'
import Challenge from './challenge'

export default class StateMachine {
  web3: Object
  registry: Object
  plcr: Object
  synced: boolean
  applications: Map<string, Application>
  listings: Map<string, Listing>
  challenges: Map<string, Challenge>
  validEvents: Set<string>

  constructor (web3: Object, registry: Object, plcr: Object) {
    this.web3 = web3
    this.registry = registry
    this.plcr = plcr
    this.synced = false
    this.applications = new Map()
    this.listings = new Map()
    this.challenges = new Map()
    this.validEvents = new Set([
      '_Application',
      '_ApplicationWhitelisted',
      '_ApplicationRemoved',
      '_Deposit',
      '_Withdrawal',
      '_ListingRemoved',
      '_ListingWithdrawn',
      '_TouchAndRemoved',
      '_Challenge',
      '_PollCreated',
      '_ChallengeFailed',
      '_ChallengeSucceeded',
      '_RewardClaimed'
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
    let c
    switch (log.event) {
      case '_Application':
        this.applications.set(hash, new Application(this, this.registry, values))
        break
      case '_Challenge':
        this.challenges.set(hash, new Challenge(this.web3, this.registry, this.plcr, values))
        break
      case '_ChallengeFailed':
        c = this.challenges.get(hash)
        if (!c) break

        c.finished = true
        break
      case '_ChallengeSucceeded':
        c = this.challenges.get(hash)
        if (!c) break

        c.finished = true
        c.succeeded = true
        break
      case '_ApplicationWhitelisted':
        a = this.applications.get(hash)
        if (!a) break

        a.whitelisted = true
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
