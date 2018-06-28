const TomoRandomize = artifacts.require('TomoRandomize')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes

const byte0 = '0x0000000000000000000000000000000000000000000000000000000000000000'
const byte1 = '0x0000000000000000000000000000000000000000000000000000000000000001'

contract('TomoRandomize', (accounts) => {
    it('Set a news', async () => {
        const randomize = await TomoRandomize.new(2, 0, 1)

        await randomize.setSecret([byte0, byte1], { from : accounts[0] })
        let secret = (await randomize.getSecret.call(accounts[0])).valueOf()
        await randomize.setOpening([byte0, byte1], { from : accounts[0] })

        await tryCatch(randomize.getOpening(accounts[0], { from : accounts[0] }), errTypes.revert)

        assert.equal(secret[0], byte0)
        assert.equal(secret[1], byte1)
    })
    it('Set a secret news with epochNumber is not enough', async () => {
        const randomize = await TomoRandomize.new(5, 0, 1)
        await tryCatch(randomize.setSecret([byte0, byte1], { from : accounts[0] }), errTypes.revert)
    })
    it('Set a secret new before epochNumber accept', async () => {
        const randomize = await TomoRandomize.new(2, 2, 2)
        await tryCatch(randomize.setSecret([byte0, byte1], { from : accounts[0] }), errTypes.revert)
    })
    it('Set a opening news with epochNumber is not enough', async () => {
        const randomize = await TomoRandomize.new(5, 0, 1)
        await tryCatch(randomize.setOpening([byte0, byte1], { from : accounts[0] }), errTypes.revert)
    })
    it('Set a opening new before epochNumber accept', async () => {
        const randomize = await TomoRandomize.new(2, 2, 2)
        await tryCatch(randomize.setOpening([byte0, byte1], { from : accounts[0] }), errTypes.revert)
    })
})
