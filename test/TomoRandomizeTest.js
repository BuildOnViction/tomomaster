const TomoRandomize = artifacts.require('TomoRandomize')
const byte0 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const byte1 = '0x0000000000000000000000000000000000000000000000000000000000000001';

contract('TomoRandomize', (accounts) => {
    it('Set a news', async () => {
        const randomize = await TomoRandomize.new(2, 0, 1)

        await randomize.setSecret([byte0, byte1], { from : accounts[0] })
        let secret = (await randomize.getSecret.call(accounts[0])).valueOf()
        await randomize.setOpening([byte0, byte1], { from : accounts[0] })

        // let secret2 = (await randomize.getOpening.call(accounts[0])).valueOf()

        assert.equal(secret[0], byte0)
        assert.equal(secret[1], byte1)
    })
})