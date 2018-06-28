const BlockSigner = artifacts.require('BlockSigner')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes

contract('BlockSigner', (accounts) => {
    it('Sign a block', async () => {
        const signer = await BlockSigner.new()

        await signer.sign(1, { from : accounts[0] })

        assert.equal((await signer.getSigners.call(1)).valueOf()[0], accounts[0])
    })

    it('Sign a block does not exist', async () => {
        const signer = await BlockSigner.new()
        await tryCatch(signer.sign(100, { from : accounts[0] }), errTypes.revert)
        await tryCatch(signer.sign(10000, { from : accounts[0] }), errTypes.revert)
        await tryCatch(signer.sign(0, { from : accounts[0] }), errTypes.revert)
    })
})
