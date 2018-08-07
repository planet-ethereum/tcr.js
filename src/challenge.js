'use strict'
// @flow

export default class Challenge {
  web3: Object
  registry: Object
  plcr: Object
  id: number
  data: string
  commitEndDate: string
  revealEndDate: string
  challenger: string

  constructor (web3: Object, registry: Object, plcr: Object, { challengeID, data, commitEndDate, revealEndDate, challenger }: {
    challengeID: number,
    data: string,
    commitEndDate: string,
    revealEndDate: string,
    challenger: string
  }) {
    this.web3 = web3
    this.registry = registry
    this.plcr = plcr
    this.id = challengeID
    this.data = data
    this.commitEndDate = commitEndDate
    this.revealEndDate = revealEndDate
    this.challenger = challenger
  }

  async commitVote (vote: boolean, salt: number, numTokens: number, prevPollId: number) {
    const voteOption = vote ? 1 : 0
    const secretHash = this.web3.utils.soliditySha3(
      { type: 'uint', value: voteOption },
      { type: 'uint', value: salt }
    )
    const tx = await this.plcr.methods.commitVote(this.id, secretHash, numTokens, prevPollId)
    return tx
  }

  async revealVote (vote: boolean, salt: number) {
    const voteOption = vote ? 1 : 0
    const tx = await this.plcr.methods.revealVote(this.id, voteOption, salt)
    return tx
  }

  async claimVoterReward (salt: number) {
    const tx = await this.registry.methods.claimReward(this.id, salt)
    return tx
  }

  async rescueTokens () {
    const tx = await this.plcr.methods.rescueTokens(this.id)
    return tx
  }
}
