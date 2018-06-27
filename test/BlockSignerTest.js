const BlockSigner = artifacts.require('BlockSigner')

contract('BlockSigner', (accounts) => {
    it('Sign a block', async () => {
        const signer = await BlockSigner.new()

        await signer.sign(1, { from : accounts[0] })

        assert.equal((await signer.getSigners.call(1)).valueOf()[0], accounts[0])
    })
})