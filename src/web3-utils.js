import linker from 'solc/linker'

import DLL from '../tcr/build/contracts/DLL.json'
import AttributeStore from '../tcr/build/contracts/AttributeStore.json'
import EIP20 from '../tcr/build/contracts/EIP20.json'
import PLCRFactory from '../tcr/build/contracts/PLCRFactory.json'
import ParameterizerFactory from '../tcr/build/contracts/ParameterizerFactory.json'
import RegistryFactory from '../tcr/build/contracts/RegistryFactory.json'
import Registry from '../tcr/build/contracts/Registry.json'

export default class Web3Utils {
  constructor (web3) {
    this.web3 = web3
  }

  async deployContract (abi, bytecode, ...args) {
    const coinbase = await this.web3.eth.getCoinbase()
    let c = new this.web3.eth.Contract(abi, { from: coinbase })
    let opts = { data: bytecode }
    if (args) {
      opts.arguments = args
    }
    let gas = await c.deploy(opts).estimateGas()
    gas = Math.floor((gas * 3) / 2)
    c = await c.deploy(opts).send({ gas })
    return c
  }

  async deployContracts () {
    const libs = await this.deployLibs()

    const plcrfBytecode = linker.linkBytecode(PLCRFactory.bytecode, libs)
    const plcrf = await this.deployContract(PLCRFactory.abi, plcrfBytecode)

    const paramfByteCode = linker.linkBytecode(ParameterizerFactory.bytecode, libs)
    const paramf = await this.deployContract(ParameterizerFactory.abi, paramfByteCode, plcrf.options.address)

    const rfBytecode = linker.linkBytecode(RegistryFactory.bytecode, libs)
    return this.deployContract(RegistryFactory.abi, rfBytecode, paramf.options.address)
  }

  async newRegistry () {
    const coinbase = await this.web3.eth.getCoinbase()
    const rf = await this.deployContracts()

    let params = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    let gas = await rf.methods.newRegistryWithToken(
      10 ** 6,
      'OpenKnowledgeTestToken',
      3,
      'OKTT',
      params,
      'OpenKnowledgeTest'
    ).estimateGas()
    gas = gas * 2

    const tx = await rf.methods.newRegistryWithToken(
      10 ** 6,
      'OpenKnowledgeTestToken',
      3,
      'OKTT',
      params,
      'OpenKnowledgeTest'
    ).send({ gas })

    const log = tx.events.NewRegistry.returnValues
    const r = new this.web3.eth.Contract(Registry.abi, log.registry, { from: coinbase })
    const t = new this.web3.eth.Contract(EIP20.abi, log.token, { from: coinbase })
    await t.methods.approve(log.registry, coinbase).send()

    return r
  }

  async deployLibs () {
    const dll = await this.deployContract(DLL.abi, DLL.bytecode)
    const as = await this.deployContract(AttributeStore.abi, AttributeStore.bytecode)

    return { DLL: dll.options.address, AttributeStore: as.options.address }
  }
}
