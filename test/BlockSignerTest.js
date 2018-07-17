const BlockSigner = artifacts.require('BlockSigner')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes

const byte0 = '0x0000000000000000000000000000000000000000000000000000000000000000'

contract('BlockSigner', (accounts) => {
    it('Sign a block', async () => {
        const signer = await BlockSigner.new(990)

        await signer.sign(1, byte0, { from : accounts[0] })

        assert.equal((await signer.getSigners.call(byte0)).valueOf()[0], accounts[0])
    })

    it('Sign a block does not exist', async () => {
        const signer = await BlockSigner.new(990)
        await tryCatch(signer.sign(100, byte0, { from : accounts[0] }), errTypes.revert)
        await tryCatch(signer.sign(10000, byte0, { from : accounts[0] }), errTypes.revert)
        await tryCatch(signer.sign(0, byte0, { from : accounts[0] }), errTypes.revert)
    })
})
