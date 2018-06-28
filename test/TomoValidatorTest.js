const TomoValidator = artifacts.require('TomoValidator')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes
const BigNumber = require('bignumber.js')

const nodeUrl = 'enode://efbb5dccf38ab207fdf28dedc6d9a12fd28748447e64b6c56f3072f52e5d2e14c6da7e0c7c474cc0fa390a9a0253511c42d79245b9366b5fd5f47a067d9623dc@13.229.166.64:30303'

contract('TomoValidator', (accounts) => {
    it('Become a candidate', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)

        await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[0]) >= 0, true)
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        assert.equal((await validator.getCandidateOwner.call(accounts[0])).valueOf(), accounts[0])
        assert.equal((await validator.getCandidateCap.call(accounts[0])).valueOf(), 5.0 * 10 ** 18)
        assert.equal((await validator.getCandidateWithdrawBlockNumber.call(accounts[0])).valueOf(), 0)
    })

    it('Can not become an candidate when the deposit is less than the minimum ', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)

        await tryCatch(validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 1.0 * 10 ** 18 }), errTypes.revert)
        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[0]) < 0, true)
    })

    it('A candidate cannot become a candidate again', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)

        await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[0]) >= 0, true)
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        await tryCatch(validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 }), errTypes.revert)
    })

    it('Vote a candidate', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)

        await validator.propose(accounts[1], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })
        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[1]) >= 0, true)

        await validator.vote(accounts[1], { from: accounts[2], value: 2.0 * 10 ** 18 })
        await validator.vote(accounts[1], { from: accounts[1], value: 2.0 * 10 ** 18 })
        await validator.vote(accounts[1], { from: accounts[0], value: 2.0 * 10 ** 18 })

        assert.equal((await validator.getVoters.call(accounts[1])).valueOf()[0], accounts[2])
        assert.equal((await validator.getVoterCap.call(accounts[1], accounts[2])).valueOf(), 2.0 * 10 ** 18)
    })

    it('UnVote a candidate', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)

        await validator.propose(accounts[1], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })
        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[1]) >= 0, true)

        await validator.vote(accounts[1], { from: accounts[2], value: 2.0 * 10 ** 18 })

        assert.equal((await validator.getVoters.call(accounts[1])).valueOf()[0], accounts[2])
        assert.equal((await validator.getVoterCap.call(accounts[1], accounts[2])).valueOf(), 2.0 * 10 ** 18)

        // Cannot unvote if cap is great than amount user vote
        await tryCatch(validator.unvote(accounts[1], 3.0 * 10 ** 18, { from: accounts[2] }), errTypes.revert)

        await validator.unvote(accounts[1], 1.0 * 10 ** 18, { from: accounts[2] })
        assert.equal((await validator.getVoterCap.call(accounts[1], accounts[2])).valueOf(), 1.0 * 10 ** 18)
    })

    it('Update NodeUrl of a candidate', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)
        let nurl = 'node url for test'
        await validator.propose(accounts[0], nurl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        assert.equal((await validator.getCandidateNodeUrl.call(accounts[0])).valueOf(), nurl)

        await tryCatch(validator.setNodeUrl(accounts[0], nodeUrl, { from: accounts[2] }), errTypes.revert)
        await validator.setNodeUrl(accounts[0], nodeUrl, { from : accounts[0] })
        assert.equal((await validator.getCandidateNodeUrl.call(accounts[0])).valueOf(), nodeUrl)
    })

    it('A candidate resign ', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 100)
        await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)

        await tryCatch(validator.resign(accounts[0], { from: accounts[2] }), errTypes.revert)
        await validator.resign(accounts[0], { from : accounts[0] })
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), false)

        // await validator.withdraw(accounts[0], { from : accounts[0] })
    })

    it('A candidate withdraw ', async () => {
        let validator = await TomoValidator.new((new BigNumber(5 * 10 ** 18)).toString(), 99, 0)
        await validator.propose(accounts[0], nodeUrl, { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        await validator.vote(accounts[0], { from: accounts[2], value: 2.0 * 10 ** 18 })

        await tryCatch(validator.withdraw(accounts[0], { from: accounts[2] }), errTypes.revert)
        await tryCatch(validator.withdraw(accounts[0], { from: accounts[0] }), errTypes.revert)

        await validator.resign(accounts[0], { from : accounts[0] })
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), false)

        await validator.withdraw(accounts[0], { from : accounts[0] })
        assert.equal((await validator.getVoterCap.call(accounts[0], accounts[0])).valueOf(), 0)
    })
})
