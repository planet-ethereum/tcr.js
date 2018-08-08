import Web3 from 'web3'
import Ganache from 'ganache-core'

import TCR from './index'
import Web3Utils from './web3-utils'

const provider = Ganache.provider({ gasLimit: 18000000 })
const web3 = new Web3(provider)
const utils = new Web3Utils(web3)
let registry

describe('scenario 1', async () => {
  let accounts, applicant, challenger, r, app, challenge,
    voter1, voter2

  beforeAll(async () => {
    registry = await utils.newRegistry()
    accounts = await web3.eth.getAccounts()
    applicant = accounts[0]
    challenger = accounts[1]
    voter1 = accounts[2]
    voter2 = accounts[3]
    r = new TCR(provider, registry)
  })

  test('should instantiate', async () => {
    await expect(r.init()).resolves
    await utils.fund(challenger, 1000)
    await utils.approve(registry.options.address, 500, { from: challenger })

    await utils.fund(voter1, 1000)
    await utils.approve(r.plcr.options.address, 200, { from: voter1 })

    await utils.fund(voter2, 1000)
    await utils.approve(r.plcr.options.address, 200, { from: voter2 })
  })

  test('should apply', async () => {
    app = await r.apply(web3.utils.sha3('app1'), 100, '0x0')
    expect(app.deposit.toString()).toEqual('100')
    expect(app.applicant).toEqual(applicant)
  })

  test('should challenge application', async () => {
    challenge = await app.challenge('0x0', { from: challenger })
    expect(challenge.hash).toEqual(app.hash)
    expect(challenge.challenger).toEqual(challenger)
    expect(challenge.id).toEqual('1')
    const challengerBalance = await utils.token.methods.balanceOf(challenger).call()
    expect(challengerBalance).toEqual('900')
  })

  test('should request voting rights', async () => {
    let tx = await r.requestVotingRights(50, { from: voter1 })
    expect(tx.events._VotingRightsGranted.returnValues.numTokens).toEqual('50')
    tx = await r.requestVotingRights(100, { from: voter2 })
    expect(tx.events._VotingRightsGranted.returnValues.numTokens).toEqual('100')
  })

  test('should commit vote on challenge', async () => {
    await challenge.commitVote(true, 12, 50, { from: voter1 })
    await challenge.commitVote(false, 10, 100, { from: voter2 })
  })

  test('should reveal vote', async () => {
    await sleep(1500)
    await challenge.revealVote(true, 12, { from: voter1 })
    await challenge.revealVote(false, 10, { from: voter2 })
  })

  test('should update status', async () => {
    await sleep(4200)
    await app.updateStatus()
    expect(challenge.finished).toBe(true)
    expect(challenge.succeeded).toBe(true)
    let challengerBalance = await utils.token.methods.balanceOf(challenger).call()
    expect(challengerBalance).toEqual('1050')
    expect(app.whitelisted).toBe(false)
  })
})

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
