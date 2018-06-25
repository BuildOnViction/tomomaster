const TomoValidator = artifacts.require('TomoValidator')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes

const nodeUrl = 'enode://efbb5dccf38ab207fdf28dedc6d9a12fd28748447e64b6c56f3072f52e5d2e14c6da7e0c7c474cc0fa390a9a0253511c42d79245b9366b5fd5f47a067d9623dc@13.229.166.64:30303'

contract('TomoValidator', (accounts) => {
    it('Become a candidate', async () => {
        const validator = await TomoValidator.new([], [], 5, 99, 100)

        await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.getCandidates.call()).valueOf()[0], accounts[0])
    })

    it('Can not become an candidate when the deposit is less than the minimum ', async () => {
        const validator = await TomoValidator.new([], [], 5, 99, 100)

        await tryCatch(validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 1.0 * 10 ** 18 }), errTypes.revert)
        // await assertRevert(await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 1.0 * 10 ** 18 }))
        assert.equal((await validator.getCandidates.call()).valueOf()[0], null)
    })

    it('A candidate cannot become a candidate again', async () => {
        const validator = await TomoValidator.new([], [], 5, 99, 100)

        await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.getCandidates.call()).valueOf()[0], accounts[0])
    })

    it('Vote a candidate', async () => {
        const validator = await TomoValidator.new([], [], 5, 99, 100)

        await validator.propose(accounts[1], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })
        assert.equal((await validator.getCandidates.call()).valueOf()[0], accounts[1])

        await validator.vote(accounts[1], { from: accounts[2], value: 2.0 * 10 ** 18 })

        assert.equal((await validator.getVoters.call(accounts[1])).valueOf()[0], accounts[2])
    })
})
