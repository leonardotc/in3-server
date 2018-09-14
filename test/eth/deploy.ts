
import { assert } from 'chai'
import 'mocha'
import Client, { chainData, util } from 'in3'
import { registerServers } from '../../src/util/registry';
import * as logger from 'in3/js/test/util/memoryLogger'
import { LoggingAxiosTransport, getTestClient } from '../utils/transport'

describe('Deploying Contracts', () => {
  it('deploy and register servers', async () => {
    const pk = '0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238'
    const pk2 = '0xaaaa239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238'

    //  deploy cainRegkstry and ServerRegistry for 0x99-chainId with 2 Nodes
    const registers = await registerServers(pk, null, [{
      url: '#1',
      pk,
      props: '0xFF',
      deposit: 0
    },
    {
      url: '#2',
      pk: pk2,
      props: '0xFF',
      deposit: 0
    }], '0x99', null, getTestClient(), new LoggingAxiosTransport())


    // create a client which reads the chainData from the contract
    const client = new Client({
      chainId: '0x99',
      mainChain: '0x99',
      chainRegistry: registers.chainRegistry,
      servers: {
        '0x99': {
          contract: registers.registry,
          contractChain: '0x99',
          // we give him a bootnode which simply reads directly from parity
          nodeList: [{
            address: util.getAddress(pk),
            url: getTestClient(),
            chainIds: ['0x99'],
            deposit: 0
          }]
        }
      }
    })

    // read data
    const data = await chainData.getChainData(client, '0x99')

    logger.info('Resulting Data', data, registers)

    assert.lengthOf(registers.chainRegistry, 42, 'No chainRegistry')
    assert.lengthOf(registers.registry, 42, 'No serverRegistry')
    assert.equal(registers.chainId, '0x99')

    assert.lengthOf(data.bootNodes, 2)
    assert.equal(data.owner, util.getAddress(pk)) // owner of the chainRegistry must be the pk
    assert.equal(data.contractChain, '0x99')
    assert.equal(data.registryContract, registers.registry)
    assert.equal(data.bootNodes[1], util.getAddress(pk2) + ':#2')
    assert.equal(data.meta, 'dummy')


  })
})

