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

  getContract (abi, addr) {
    return new this.web3.eth.Contract(abi, addr)
  }

  async sendTx (method, opts) {
    // estimateGas modifies the opts
    const optsCopy = Object.assign({}, opts)
    let gas = await method.estimateGas(optsCopy)

    // The estimated gas doesn't seem to work
    // https://github.com/trufflesuite/ganache-core/pull/75
    gas *= 2

    opts = Object.assign({}, { gas }, opts)
    return method.send(opts)
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

    const plcrfBytecode = this.linkBytecode(PLCRFactory.bytecode, libs)
    const plcrf = await this.deployContract(PLCRFactory.abi, plcrfBytecode)

    const paramfByteCode = this.linkBytecode(ParameterizerFactory.bytecode, libs)
    const paramf = await this.deployContract(ParameterizerFactory.abi, paramfByteCode, plcrf.options.address)

    const rfBytecode = this.linkBytecode(RegistryFactory.bytecode, libs)
    return this.deployContract(RegistryFactory.abi, rfBytecode, paramf.options.address)
  }

  async newRegistry () {
    const coinbase = await this.web3.eth.getCoinbase()
    const rf = await this.deployContracts()

    let params = [100, 100, 100, 100, 1, 100, 5, 100, 50, 50, 50, 50]
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
    this.token = t
    await t.methods.approve(log.registry, 1000).send({ from: coinbase })

    return r
  }

  async deployLibs () {
    const dll = await this.deployContract(DLL.abi, DLL.bytecode)
    const as = await this.deployContract(AttributeStore.abi, AttributeStore.bytecode)

    return { DLL: dll.options.address, AttributeStore: as.options.address }
  }

  // Taken with modifications from solc/linker
  linkBytecode (bytecode, libs) {
    const links = Object.assign({}, libs)
    const keys = Object.keys(links)
    for (let i = 0; i < keys.length; i++) {
      let name = keys[i]
      let addr = links[name]

      // Truncate to 37 characters
      name = name.slice(0, 36)

      // Prefix and suffix with __
      let label = '__' + name + Array(37 - name.length).join('_') + '__'

      if (addr.slice(0, 2) !== '0x' || addr.length > 42) {
        throw new Error('Invalid address specified for ' + name)
      }

      // Remove 0x prefix
      addr = addr.slice(2)
      addr = Array(40 - addr.length + 1).join('0') + addr

      while (bytecode.indexOf(label) >= 0) {
        bytecode = bytecode.replace(label, addr)
      }
      const regex = new RegExp('__' + name + '_+', 'g')

      bytecode = bytecode.replace(regex, addr.replace('0x', ''))
    }

    return bytecode
  }
}
