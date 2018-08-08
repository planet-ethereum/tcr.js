'use strict'
// @flow

export default class Challenge {
  stateMachine: Object
  hash: string
  id: number
  data: string
  commitEndDate: string
  revealEndDate: string
  challenger: string
  finished: boolean
  succeeded: boolean

  constructor (stateMachine: Object, { listingHash, challengeID, data, commitEndDate, revealEndDate, challenger }: {
    listingHash: string,
    challengeID: number,
    data: string,
    commitEndDate: string,
    revealEndDate: string,
    challenger: string
  }) {
    this.stateMachine = stateMachine
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
    const secretHash = this.stateMachine.web3.utils.soliditySha3(
      { type: 'uint', value: voteOption },
      { type: 'uint', value: salt }
    )
    const coinbase = web3Opts.from ? web3Opts.from : await this.stateMachine.web3.eth.getCoinbase()
    const prevPollId = await this.stateMachine.plcr.methods.getInsertPointForNumTokens(coinbase, numTokens, this.id).call()

    const method = this.stateMachine.plcr.methods.commitVote(this.id, secretHash, numTokens, prevPollId)
    const tx = await this.stateMachine.web3Utils.sendTx(method, web3Opts)
    await this.stateMachine.updateFromTx(tx)
    return tx
  }

  async revealVote (vote: boolean, salt: number, web3Opts: Object = {}) {
    const voteOption = vote ? 1 : 0
    const method = this.stateMachine.plcr.methods.revealVote(this.id, voteOption, salt)
    const tx = await this.stateMachine.web3Utils.sendTx(method, web3Opts)
    await this.stateMachine.updateFromTx(tx)
    return tx
  }

  async claimReward (salt: number) {
    const tx = await this.stateMachine.registry.methods.claimReward(this.id, salt).send()
    await this.stateMachine.updateFromTx(tx)
    return tx
  }

  async rescueTokens () {
    const tx = await this.stateMachine.plcr.methods.rescueTokens(this.id).send()
    await this.stateMachine.updateFromTx(tx)
    return tx
  }

  async canBeResolved () {
    return this.stateMachine.registry.methods.challengeCanBeResolved(this.hash).call()
  }
}
