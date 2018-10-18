const TomoRandomize = artifacts.require('TomoRandomize')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes

const byte0 = '0x0000000000000000000000000000000000000000000000000000000000000000'
const byte1 = '0x0000000000000000000000000000000000000000000000000000000000000001'

contract('TomoRandomize', (accounts) => {
    it('Set a news', async () => {
        const randomize = await TomoRandomize.new()

        await tryCatch(randomize.setSecret([byte0, byte1], { from : accounts[0] }), errTypes.revert)
        await tryCatch(randomize.getSecret.call(accounts[0]), errTypes.revert)
        await tryCatch(randomize.setOpening(byte0, { from : accounts[0] }), errTypes.revert)

        await tryCatch(randomize.getOpening(accounts[0], { from : accounts[0] }), errTypes.revert)
    })
})
