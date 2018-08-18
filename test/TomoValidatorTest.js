const TomoValidator = artifacts.require('TomoValidator')
const tryCatch = require('./helpers/exceptions.js').tryCatch
const errTypes = require('./helpers/exceptions.js').errTypes
const BigNumber = require('bignumber.js')

const minVoterCap = (new BigNumber(2 * 10 ** 18)).toString()
const minCandidateCap = (new BigNumber(5 * 10 ** 18)).toString()

contract('TomoValidator', (accounts) => {
    it('Become a candidate', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 100, 100)

        await validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[0]) >= 0, true)
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        assert.equal((await validator.getCandidateOwner.call(accounts[0])).valueOf(), accounts[0])
        assert.equal((await validator.getCandidateCap.call(accounts[0])).valueOf(), 5.0 * 10 ** 18)
    })

    it('Can not become an candidate when the deposit is less than the minimum ', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 100, 100)

        await tryCatch(validator.propose(accounts[0], { from : accounts[0], value: 1.0 * 10 ** 18 }), errTypes.revert)
        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[0]) < 0, true)
    })

    it('A candidate cannot become a candidate again', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 100, 100)

        await validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[0]) >= 0, true)
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        await tryCatch(validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 }), errTypes.revert)
    })

    it('Vote a candidate', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 100, 100)

        await validator.propose(accounts[1], { from : accounts[0], value: 5.0 * 10 ** 18 })
        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[1]) >= 0, true)

        await validator.vote(accounts[1], { from: accounts[2], value: 2.0 * 10 ** 18 })
        await validator.vote(accounts[1], { from: accounts[1], value: 2.0 * 10 ** 18 })
        await validator.vote(accounts[1], { from: accounts[0], value: 2.0 * 10 ** 18 })

        assert.equal((await validator.getVoters.call(accounts[1])).valueOf()[1], accounts[2])
        assert.equal((await validator.getVoterCap.call(accounts[1], accounts[2])).valueOf(), 2.0 * 10 ** 18)
    })

    it('UnVote a candidate', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 100, 100)

        await validator.propose(accounts[1], { from : accounts[0], value: 5.0 * 10 ** 18 })
        assert.equal((await validator.getCandidates.call()).valueOf().indexOf(accounts[1]) >= 0, true)

        await validator.vote(accounts[1], { from: accounts[2], value: 2.0 * 10 ** 18 })

        assert.equal((await validator.getVoters.call(accounts[1])).valueOf()[1], accounts[2])
        assert.equal((await validator.getVoterCap.call(accounts[1], accounts[2])).valueOf(), 2.0 * 10 ** 18)

        // Cannot unvote if cap is great than amount user vote
        await tryCatch(validator.unvote(accounts[1], 3.0 * 10 ** 18, { from: accounts[2] }), errTypes.revert)

        await validator.unvote(accounts[1], 1.0 * 10 ** 18, { from: accounts[2] })
        assert.equal((await validator.getVoterCap.call(accounts[1], accounts[2])).valueOf(), 1.0 * 10 ** 18)
    })

    it('A candidate resign ', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 100, 100)
        await validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)

        await tryCatch(validator.resign(accounts[0], { from: accounts[2] }), errTypes.revert)
        await validator.resign(accounts[0], { from : accounts[0] })
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), false)
    })

    it('A candidate withdraw', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 0, 0)
        await validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        await validator.vote(accounts[0], { from: accounts[2], value: 2.0 * 10 ** 18 })

        await tryCatch(validator.withdraw(1, 0, { from: accounts[2] }), errTypes.revert)
        await tryCatch(validator.withdraw(2, 2, { from: accounts[0] }), errTypes.revert)

        await validator.resign(accounts[0], { from : accounts[0] })
        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), false)

        await validator.unvote(accounts[0], 1.0 * 10 ** 18, { from: accounts[2] })

        let blockNumbers = await validator.getWithdrawBlockNumbers({ from: accounts[0] })
        let blockNumber = (new BigNumber(blockNumbers[0]).toString())
        await validator.withdraw(blockNumber, 0, { from : accounts[0] })
        assert.equal((await validator.getVoterCap.call(accounts[0], accounts[0])).valueOf(), 0)

        blockNumbers = await validator.getWithdrawBlockNumbers({ from: accounts[2] })
        blockNumber = (new BigNumber(blockNumbers[0]).toString())
        await validator.withdraw(blockNumber, 0, { from : accounts[2] })
        assert.equal((await validator.getVoterCap.call(accounts[0], accounts[2])).valueOf(), 1.0 * 10 ** 18)
    })

    it('A voter withdraw', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 0, 0)
        await validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        await validator.vote(accounts[0], { from: accounts[2], value: 2.0 * 10 ** 18 })

        await validator.unvote(accounts[0], 1.0 * 10 ** 18, { from: accounts[2] })

        let blockNumbers = await validator.getWithdrawBlockNumbers({ from: accounts[2] })
        let blockNumber = (new BigNumber(blockNumbers[0]).toString())
        await validator.withdraw(blockNumber, 0, { from : accounts[2] })
        assert.equal((await validator.getVoterCap.call(accounts[0], accounts[2])).valueOf(), 1.0 * 10 ** 18)
    })

    it('A voter withdraw before block number', async () => {
        let validator = await TomoValidator.new([], [], null, minCandidateCap, minVoterCap, 99, 0, 100)
        await validator.propose(accounts[0], { from : accounts[0], value: 5.0 * 10 ** 18 })

        assert.equal((await validator.isCandidate.call(accounts[0])).valueOf(), true)
        await validator.vote(accounts[0], { from: accounts[2], value: 2.0 * 10 ** 18 })

        await validator.unvote(accounts[0], 1.0 * 10 ** 18, { from: accounts[2] })

        let blockNumbers = await validator.getWithdrawBlockNumbers({ from: accounts[2] })
        let blockNumber = (new BigNumber(blockNumbers[0]).toString())
        await tryCatch(validator.withdraw(blockNumber, 0, { from: accounts[2] }), errTypes.revert)
    })
})
