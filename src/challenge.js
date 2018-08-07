'use strict'
// @flow

export default class Challenge {
  web3: Object
  registry: Object
  plcr: Object
  hash: string
  id: number
  data: string
  commitEndDate: string
  revealEndDate: string
  challenger: string
  finished: boolean
  succeeded: boolean

  constructor (web3: Object, registry: Object, plcr: Object, { listingHash, challengeID, data, commitEndDate, revealEndDate, challenger }: {
    listingHash: string,
    challengeID: number,
    data: string,
    commitEndDate: string,
    revealEndDate: string,
    challenger: string
  }) {
    this.web3 = web3
    this.registry = registry
    this.plcr = plcr
    this.hash = listingHash
    this.id = challengeID
    this.data = data
    this.commitEndDate = commitEndDate
    this.revealEndDate = revealEndDate
    this.challenger = challenger
    this.finished = false
    this.succeeded = false
  }

  async commitVote (vote: boolean, salt: number, numTokens: number, web3Opts: Object = {}) {
    const voteOption = vote ? 1 : 0
    const secretHash = this.web3.utils.soliditySha3(
      { type: 'uint', value: voteOption },
      { type: 'uint', value: salt }
    )
    const coinbase = web3Opts.from ? web3Opts.from : await this.web3.eth.getCoinbase()
    const prevPollId = await this.plcr.methods.getInsertPointForNumTokens(coinbase, numTokens, this.id).call()
    let gas = await this.plcr.methods.commitVote(this.id, secretHash, numTokens, prevPollId).estimateGas(web3Opts)
    let opts = Object.assign({}, { gas }, web3Opts)
    opts.gas = gas * 2
    const tx = await this.plcr.methods.commitVote(this.id, secretHash, numTokens, prevPollId).send(opts)
    return tx
  }

  async revealVote (vote: boolean, salt: number, web3Opts: Object = {}) {
    const voteOption = vote ? 1 : 0
    let gas = await this.plcr.methods.revealVote(this.id, voteOption, salt).estimateGas(web3Opts)
    let opts = Object.assign({}, { gas }, web3Opts)
    opts.gas = gas * 3
    const tx = await this.plcr.methods.revealVote(this.id, voteOption, salt).send(opts)
    return tx
  }

  async canBeResolved () {
    return this.registry.methods.challengeCanBeResolved(this.hash)
  }

  async claimReward (salt: number) {
    const tx = await this.registry.methods.claimReward(this.id, salt)
    return tx
  }

  async rescueTokens () {
    const tx = await this.plcr.methods.rescueTokens(this.id)
    return tx
  }
}
