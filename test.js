const axios = require('axios')
const config = require('config')

async function test () {
    const data = {
        jsonrpc: '2.0',
        method: 'eth_getCandidateStatus',
        params: ['0x3fbb27b62a088c9a686bafd1a4f55ba34012edb0', '0xd0e'],
        id: 89
    }
    const response = await axios.post(config.get('blockchain.rpc'), data)
    console.log(response.data)
}
test()
