'use strict'

const Validator = require('./models/blockchain/validator')
const Web3Ws = require('./models/blockchain/web3ws').Web3WsInternal
const web3Rpc = require('./models/blockchain/web3rpc').Web3RpcInternal()
const config = require('config')
const db = require('./models/mongodb')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const logger = require('./helpers/logger')
const axios = require('axios')
const _ = require('lodash')
const TwitterHelper = require('./helpers/twitter')

process.setMaxListeners(100)

let web3 = new Web3Ws()
let validator = new Validator(web3)
let cpValidator = 0

let tweetedMN = ''

async function watchValidator () {
    var blockNumber = cpValidator || await web3.eth.getBlockNumber()
    try {
        blockNumber = blockNumber || await web3.eth.getBlockNumber()
        logger.info('TomoValidator %s - Listen events from block number %s ...',
            config.get('blockchain.validatorAddress'), blockNumber)

        cpValidator = await web3.eth.getBlockNumber()
        return validator.getPastEvents('allEvents', {
            fromBlock: blockNumber,
            toBlock: 'latest'
        }).then(async events => {
            let map = events.map(async (event) => {
                let result = event
                logger.debug('Event %s in block %s', result.event, result.blockNumber)
                let candidate = (result.returnValues._candidate || '').toLowerCase()
                let voter = (result.returnValues._voter || '').toLowerCase()
                let owner = (result.returnValues._owner || '').toLowerCase()
                let capacity = result.returnValues._cap
                let blk = await web3.eth.getBlock(result.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()
                if (!voter && (event.event === 'Resign' ||
                    event.event === 'Withdraw' || event.event === 'Propose')) {
                    voter = owner
                }
                if (result.event === 'Withdraw') {
                    let capacity = result.returnValues._cap
                    await db.Withdraw.findOneAndUpdate({
                        tx: result.transactionHash
                    }, {
                        $set: {
                            smartContractAddress: config.get('blockchain.validatorAddress'),
                            blockNumber: result.blockNumber,
                            tx: result.transactionHash,
                            owner: owner,
                            capacity: capacity
                        }
                    }, { upsert: true })
                }
                if (result.event === 'Propose') {
                    const block = result.blockNumber
                    const lastCheckpoint = block - (block % parseInt(config.get('blockchain.epoch')))
                    const currentEpoch = parseInt(lastCheckpoint / config.get('blockchain.epoch')) + 1
                    await db.Status.findOneAndUpdate({ epoch: currentEpoch, candidate: candidate }, {
                        epoch: currentEpoch,
                        candidate: candidate,
                        status: 'PROPOSED',
                        epochCreatedAt: createdAt
                    }, { upsert: true })
                    // Tweet new candidate
                    if (tweetedMN !== candidate) {
                        tweetedMN = candidate
                        await TwitterHelper.tweetNewMN(
                            voter,
                            candidate,
                            (new BigNumber(capacity)).div(1e18).toString(10),
                            result.transactionHash)
                    }
                }

                // get balance
                let candidateCap = 0
                if (candidate) {
                    candidateCap = await validator.methods.getCandidateCap(candidate).call()
                }
                await db.Transaction.findOneAndUpdate({
                    tx: result.transactionHash
                }, {
                    $set: {
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        tx: result.transactionHash,
                        event: result.event,
                        voter: voter,
                        owner: owner,
                        candidate: candidate,
                        capacity: capacity,
                        blockNumber: result.blockNumber,
                        createdAt: createdAt,
                        currentCandidateCap: new BigNumber(candidateCap)
                    }
                }, {
                    upsert: true
                })
                if (result.event === 'Vote' || result.event === 'Unvote') {
                    await updateVoterCap(candidate, voter)
                    if (result.event === 'Unvote') {
                        // store withdraw for notification
                        await db.WithdrawNoti.findOneAndUpdate({
                            voter: voter,
                            blockNumber: result.blockNumber,
                            candidate: candidate
                        }, {
                            $set: {
                                voter: voter,
                                blockNumber: result.blockNumber,
                                amount: (new BigNumber(capacity)).div(1e18).toString(10),
                                withdrawBlockNumber: result.blockNumber + 86400 // 86400 blocks later
                            }
                        }, { upsert: true })
                    }
                }
                if (result.event === 'Resign' || result.event === 'Propose') {
                    await updateVoterCap(candidate, owner)
                    // fire notification
                    const voters = await db.Voter.find({
                        candidate: candidate,
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        capacityNumber: { $gt: 0 }
                    })
                    if (voters && voters.length > 0) {
                        const candidateInfor = await db.Candidate.findOne({
                            smartContractAddress: config.get('blockchain.validatorAddress'),
                            candidate: candidate.toLowerCase()
                        })
                        const candidateName = candidateInfor ? candidateInfor.name || null : null
                        await Promise.all(voters.map(async (v) => {
                            await fireNotification(v.voter, candidate,
                                candidateName, result.event, result.blockNumber)
                        }))
                    }
                }
                if (candidate !== '') {
                    await updateCandidateInfo(candidate)
                }
            })

            return Promise.all(map)
        }).catch(e => {
            logger.error('watchValidator %s', e)
            cpValidator = blockNumber
            web3 = new Web3Ws()
            validator = new Validator(web3)
        })
    } catch (e) {
        logger.error('watchValidator2 %s', e)
        cpValidator = blockNumber
    }
}

async function updateCandidateInfo (candidate) {
    try {
        let capacity = await validator.methods.getCandidateCap(candidate).call()
        let owner = (await validator.methods.getCandidateOwner(candidate).call() || '').toLowerCase()
        let status = await validator.methods.isCandidate(candidate).call()
        let result
        logger.debug('Update candidate %s capacity %s %s', candidate, String(capacity), status)
        if (candidate !== '0x0000000000000000000000000000000000000000') {
            // check current status
            const candateInDB = await db.Candidate.findOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate
            }) || {}

            status = (status)
                ? ((candateInDB.status === 'RESIGNED') ? 'PROPOSED' : (candateInDB.status || 'PROPOSED'))
                : 'RESIGNED'
            result = await db.Candidate.findOneAndUpdate({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate
            }, {
                $set: {
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: candidate,
                    capacity: String(capacity),
                    capacityNumber: (new BigNumber(capacity)).div(1e18).toString(10),
                    status: status,
                    owner: owner
                },
                $setOnInsert: {
                    nodeId: candidate.replace('0x', '')
                }
            }, { upsert: true })
        } else {
            result = await db.Candidate.deleteOne({
                smartContractAddress: validator.address,
                candidate: candidate
            })
        }

        return result
    } catch (e) {
        logger.error('updateCandidateInfo %s', e)
    }
}

async function updateVoterCap (candidate, voter) {
    try {
        let capacity = await validator.methods.getVoterCap(candidate, voter).call()
        logger.debug('Update voter %s for candidate %s capacity %s', voter, candidate, String(capacity))
        return await db.Voter.findOneAndUpdate({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: candidate,
            voter: voter
        }, {
            $set: {
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate,
                voter: voter,
                capacity: String(capacity),
                capacityNumber: (new BigNumber(capacity)).div(1e18).toString(10)
            }
        }, { upsert: true })
    } catch (e) {
        logger.error('updateVoterCap %s', e)
    }
}

// Get current candates
async function getCurrentCandidates () {
    try {
        let candidates = await validator.methods.getCandidates().call()
        let candidatesInDb = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress')
        }).lean().exec()
        candidatesInDb = candidatesInDb.map(c => c.candidate)
        candidates = _.uniqBy(_.concat(candidates, candidatesInDb), (it) => {
            return it.toLowerCase()
        })

        let map = candidates.map(async (candidate) => {
            candidate = (candidate || '').toLowerCase()
            let voters = await validator.methods.getVoters(candidate).call()
            let m = voters.map(v => {
                v = (v || '').toLowerCase()
                return updateVoterCap(candidate, v)
            })

            await Promise.all(m)
            return updateCandidateInfo(candidate)
        })
        return Promise.all(map).catch(e => logger.info('getCurrentCandidates %s', e))
    } catch (e) {
        logger.info('getCurrentCandidates2 %s', e)
    }
}

async function updateSignerPenAndStatus () {
    try {
        const latestBlockNumber = await web3.eth.getBlockNumber()
        const latestCheckpoint = latestBlockNumber - (latestBlockNumber % parseInt(config.get('blockchain.epoch')))
        const currentEpoch = (parseInt(latestCheckpoint / config.get('blockchain.epoch')) + 1).toString()
        const blk = await web3.eth.getBlock(latestCheckpoint)
        const signers = []
        const penalties = []
        // get candidate list
        const candidates = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: {
                $ne: 'RESIGNED'
            }
        })
        // loop and get status
        await Promise.all(candidates.map(async (c) => {
            const data = {
                'jsonrpc': '2.0',
                'method': 'eth_getCandidateStatus',
                'params': [c.candidate.toLowerCase(), 'latest'],
                'id': config.get('blockchain.networkId')
            }
            const response = await axios.post(config.get('blockchain.rpc'), data)

            if (response.data) {
                const result = (response.data.result || {}).status
                switch (result) {
                case 'MASTERNODE':
                    signers.push(c.candidate)
                    await db.Candidate.findOneAndUpdate({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        candidate: c.candidate.toLowerCase()
                    }, {
                        $set: {
                            status: 'MASTERNODE'
                        }
                    }, { upsert: true })
                    await db.Status.findOneAndUpdate({ epoch: currentEpoch, candidate: c.candidate }, {
                        epoch: currentEpoch,
                        candidate: c.candidate,
                        status: 'MASTERNODE',
                        epochCreatedAt: moment.unix(blk.timestamp).utc()
                    }, { upsert: true })
                    break
                case 'SLASHED':
                    logger.info('Update candidate %s slashed at blockNumber %s', c.candidate, String(blk.number))
                    // fireNotification
                    if (result.toLowerCase() !== c.status.toLowerCase()) {
                        // get all voters who have capacity > 0
                        const voters = await db.Voter.find({
                            candidate: c.candidate,
                            smartContractAddress: config.get('blockchain.validatorAddress'),
                            capacityNumber: { $gt: 0 }
                        })
                        if (voters && voters.length > 0) {
                            await Promise.all(voters.map(async (v) => {
                                await fireNotification(v.voter, c.candidate, c.name, 'Slash', latestBlockNumber)
                            }))
                        }
                    }

                    db.Candidate.findOneAndUpdate({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        candidate: c.candidate.toLowerCase()
                    }, {
                        $set: {
                            status: 'SLASHED'
                        }
                    }, { upsert: true }).then(() => true)
                        .catch(error => console.log(error))

                    db.Status.findOneAndUpdate({ epoch: currentEpoch, candidate: c.candidate }, {
                        epoch: currentEpoch,
                        candidate: c.candidate,
                        status: 'SLASHED',
                        epochCreatedAt: moment.unix(blk.timestamp).utc()
                    }, { upsert: true }).then(() => true)
                        .catch(error => console.log(error))
                    penalties.push(c.candidate)
                    break
                case 'PROPOSED':
                    await db.Candidate.findOneAndUpdate({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        candidate: c.candidate.toLowerCase()
                    }, {
                        $set: {
                            status: 'PROPOSED'
                        }
                    }, { upsert: true })
                    await db.Status.findOneAndUpdate({ epoch: currentEpoch, candidate: c.candidate }, {
                        epoch: currentEpoch,
                        candidate: c.candidate,
                        status: 'PROPOSED',
                        epochCreatedAt: moment.unix(blk.timestamp).utc()
                    }, { upsert: true })
                    break
                default:
                    break
                }
            }
        }))
        await db.Signer.findOneAndUpdate({ blockNumber: blk.number }, {
            networkId: config.get('blockchain.networkId'),
            blockNumber: blk.number,
            signers: signers
        }, { upsert: true })

        await db.Penalty.update({ epoch: currentEpoch }, {
            networkId: config.get('blockchain.networkId'),
            blockNumber: blk.number,
            epoch: currentEpoch,
            penalties: penalties
        }, { upsert: true })
    } catch (e) {
        logger.error('updateSignerAndPen %s', e)
        web3 = new Web3Ws()
        validator = new Validator(web3)
        await sleep(10000)
        return updateSignerPenAndStatus()
    }
}

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
async function watchNewBlock (n) {
    try {
        let blockNumber = await web3.eth.getBlockNumber()
        n = n || blockNumber
        if (blockNumber > n) {
            n = n + 1
            blockNumber = n
            logger.info('Watch new block every 1 second blkNumber %s', n)
            let blk = await web3.eth.getBlock(blockNumber)
            if (n % config.get('blockchain.epoch') === 10) {
                await updateSignerPenAndStatus()
                // update rank history
                {
                    const candidates = await db.Candidate.find({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        status: { $nin: ['RESIGNED', 'PROPOSED'] }
                    }).sort({ capacityNumber: -1 })

                    await Promise.all(candidates.map(async (c, i) => {
                        // update rank hisroty
                        const latestBlockNumber = await web3.eth.getBlockNumber()
                        const latestCheckpoint = latestBlockNumber - (
                            latestBlockNumber % parseInt(config.get('blockchain.epoch')))
                        const latestEpoch = (parseInt(
                            latestCheckpoint / config.get('blockchain.epoch'))).toString()
                        const block = await web3.eth.getBlock(latestCheckpoint)

                        db.Rank.findOneAndUpdate({ candidate: c.candidate, epoch: latestEpoch }, {
                            epoch: latestEpoch,
                            candidate: c.candidate,
                            rank: i + 1,
                            epochCreatedAt: moment.unix(block.timestamp).utc()
                        }, { upsert: true }).then(() => { return true })
                            .catch(e => logger.error('update rank history %s', e))
                    }))
                }
            }

            // update capacity every 150 blocks
            if (n % 150 === 0) {
                getCurrentCandidates()
            }

            // update rank after 50 blocks
            if (n % 50 === 0) {
                // get candidate's cap
                const candidates = await db.Candidate.find({
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    status: { $nin: ['RESIGNED', 'PROPOSED'] }
                }).sort({ capacityNumber: -1 })

                // get top 150 before updating
                const oldTop150 = await db.Candidate.find({
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    status: { $nin: ['RESIGNED', 'PROPOSED'] },
                    rank: { $ne: null }
                })
                // check changing in top 150 to fire notification
                const outOfTop = diff(oldTop150.map(c => c.candidate), candidates.map(c => c.candidate))

                // fire notification
                if (outOfTop.length > 0) {
                    Promise.all(outOfTop.map(async (candidate) => {
                        const candidateInfor = candidates.find(c => c.candidate === candidate)
                        // get all voters who have capacity > 0
                        const voters = await db.Voter.find({
                            candidate: candidate,
                            smartContractAddress: config.get('blockchain.validatorAddress'),
                            capacityNumber: { $gt: 0 }
                        })
                        if (voters && voters.length > 0) {
                            await Promise.all(voters.map(async (v) => {
                                await fireNotification(v.voter, candidate, candidateInfor.name, 'Outtop', n)
                            }))
                        }
                    })).then(() => true).catch(e => console.log(e))
                }

                await db.Candidate.updateMany({
                    smartContractAddress: config.get('blockchain.validatorAddress')
                }, {
                    rank: ''
                })
                // update rank
                await Promise.all(candidates.map(async (c, i) => {
                    await db.Candidate.findOneAndUpdate({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        candidate: c.candidate
                    }, {
                        $set: {
                            rank: i + 1
                        }
                    }, { upsert: true })
                }))
            }

            // check withdrawal status after 10 blocks
            if (n % 10 === 0) {
                // get list of unvote
                const withdrawBlockNumbers = await db.WithdrawNoti.find({
                    withdrawBlockNumber: { $lte: n }
                })
                // check with current block number
                if (withdrawBlockNumbers.length > 0) {
                    await Promise.all(withdrawBlockNumbers.map(async (w) => {
                        fireNotification(w.voter, '', '', 'Withdraw', n, w.amount)
                        await db.WithdrawNoti.deleteOne({
                            _id: w._id
                        })
                    }))
                }
            }
            await updateLatestSignedBlock(blk)
            await watchValidator()
        }
    } catch (e) {
        logger.error('watchNewBlock %s', e)
        web3 = new Web3Ws()
        validator = new Validator(web3)
    }
    await sleep(1000)
    return watchNewBlock(n)
}

async function fireNotification (voter, candidate, name, event, blockNumber, amount = '') {
    try {
        const isRead = false
        await db.Notification.findOneAndUpdate({
            voter: voter,
            candidate: candidate,
            blockNumber: blockNumber
        }, {
            voter: voter,
            candidate: candidate,
            candidateName: name || 'Anonymous',
            event: event,
            isRead: isRead,
            amount: amount
        }, { upsert: true })
        return true
    } catch (error) {
        logger.error('fire notification error %s', error)
    }
}

function diff (a, b) {
    return a.filter((i) => {
        return b.indexOf(i) < 0
    })
}

async function updateLatestSignedBlock (blk) {
    try {
        for (let hash of ((blk || {}).transactions || [])) {
            let tx = await web3Rpc.eth.getTransaction(hash)
            if ((tx || {}).to === config.get('blockchain.blockSignerAddress')) {
                let signer = tx.from
                let buff = Buffer.from((tx.input || '').substring(2), 'hex')
                let sbuff = buff.slice(buff.length - 32, buff.length)
                let bN = ((await web3Rpc.eth.getBlock('0x' + sbuff.toString('hex'))) || {}).number
                if (!bN) {
                    logger.debug('Bypass signer %s sign %s', signer, '0x' + sbuff.toString('hex'))
                    continue
                }
                logger.debug('Sign block %s by signer %s', bN, signer)
                await db.Candidate.findOneAndUpdate({
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: signer.toLowerCase()
                }, {
                    $set: {
                        latestSignedBlock: bN
                    }
                }, { upsert: false })
            }
        }
    } catch (e) {
        logger.error('updateLatestSignedBlock %s', e)
    }
}

async function getPastEvent () {
    let blockNumber = await web3.eth.getBlockNumber()
    let lastBlockTx = await db.Transaction.findOne().sort({ blockNumber: -1 })
    let lb = (lastBlockTx && lastBlockTx.blockNumber) ? lastBlockTx.blockNumber : 0

    logger.debug('Get all past event from block', lb, 'to block', blockNumber)
    validator.getPastEvents('allEvents', { fromBlock: lb, toBlock: blockNumber }, async function (error, events) {
        if (error) {
            logger.error(error)
        } else {
            let map = events.map(async function (event) {
                if (event.event === 'Withdraw') {
                    let owner = (event.returnValues._owner || '').toLowerCase()
                    let blockNumber = event.blockNumber
                    let capacity = event.returnValues._cap
                    await db.Withdraw.findOneAndUpdate({ tx: event.transactionHash }, {
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        blockNumber: blockNumber,
                        tx: event.transactionHash,
                        owner: owner,
                        capacity: capacity
                    }, { upsert: true })
                }
                let candidate = (event.returnValues._candidate || '').toLowerCase()
                let voter = (event.returnValues._voter || '').toLowerCase()
                let owner = (event.returnValues._owner || '').toLowerCase()
                if (!voter && (event.event === 'Resign' || event.event === 'Withdraw' || event.event === 'Propose')) {
                    voter = owner
                }
                let capacity = event.returnValues._cap
                let blk = await web3.eth.getBlock(event.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()
                await db.Transaction.findOneAndUpdate({ tx: event.transactionHash }, {
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    tx: event.transactionHash,
                    blockNumber: event.blockNumber,
                    event: event.event,
                    voter: voter,
                    owner: owner,
                    candidate: candidate,
                    capacity: capacity,
                    createdAt: createdAt
                }, { upsert: true })
            })
            return Promise.all(map)
        }
    })
}

getCurrentCandidates().then(() => {
    return updateSignerPenAndStatus()
}).then(() => {
    return getPastEvent().then(() => {
        watchNewBlock()
    })
}).catch(e => {
    logger.error('Start error %s', e)
})
