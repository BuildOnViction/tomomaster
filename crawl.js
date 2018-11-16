'use strict'

const validator = require('./models/blockchain/validator')
const blockSigner = require('./models/blockchain/blockSigner')
const web3 = require('./models/blockchain/web3')
const config = require('config')
const db = require('./models/mongodb')
const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

process.setMaxListeners(100)

async function watchValidator () {
    try {
        const blockNumber = await web3.eth.getBlockNumber()
        console.info('TomoValidator %s - Listen events from block number %s ...',
            config.get('blockchain.validatorAddress'), blockNumber)

        validator.events.allEvents({
            fromBlock: blockNumber,
            toBlock: 'latest'
        }, async function (error, result) {
            if (error) {
                console.error(error, result)
                return false
            } else {
                console.log('Event %s in block %s', result.event, result.blockNumber)
                if (result.event === 'Withdraw') {
                    let owner = (result.returnValues._owner || '').toLowerCase()
                    let blockNumber = result.blockNumber
                    let capacity = result.returnValues._cap
                    let wd = new db.Withdraw({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        blockNumber: blockNumber,
                        tx: result.transactionHash,
                        owner: owner,
                        capacity: capacity
                    })
                    wd.save()
                    return true
                } else {
                    let candidate = (result.returnValues._candidate || '').toLowerCase()
                    let voter = (result.returnValues._voter || '').toLowerCase()
                    let owner = (result.returnValues._owner || '').toLowerCase()
                    let capacity = result.returnValues._cap
                    let blk = await web3.eth.getBlock(result.blockNumber)
                    let createdAt = new Date(blk.timestamp * 1000)
                    let tx = new db.Transaction({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        tx: result.transactionHash,
                        event: result.event,
                        voter: voter,
                        owner: owner,
                        candidate: candidate,
                        capacity: capacity,
                        createdAt: createdAt
                    })
                    tx.save()
                    if (result.event === 'Vote' || result.event === 'Unvote') {
                        await updateVoterCap(candidate, voter)
                    }
                    if (result.event === 'Resign' || result.event === 'Propose') {
                        await updateVoterCap(candidate, owner)
                    }
                    await updateCandidateInfo(candidate)
                }
            }
        })
    } catch (e) {
        console.error(e)
        emitter.emit('error', e)
    }
}

async function updateCandidateInfo (candidate) {
    try {
        let capacity = await validator.methods.getCandidateCap(candidate).call()
        let owner = (await validator.methods.getCandidateOwner(candidate).call() || '').toLowerCase()
        let status = await validator.methods.isCandidate(candidate).call()
        let result
        console.info('Update candidate %s capacity %s', candidate, String(capacity))
        if (candidate !== '0x0000000000000000000000000000000000000000') {
            result = await db.Candidate.updateOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate
            }, {
                $set: {
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: candidate,
                    capacity: String(capacity),
                    status: (status) ? 'PROPOSED' : 'RESIGNED',
                    owner: owner
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
        console.error(e)
    }
}

async function updateVoterCap (candidate, voter) {
    try {
        let capacity = await validator.methods.getVoterCap(candidate, voter).call()
        console.log('Update voter %s for candidate %s capacity %s', voter, candidate, String(capacity))
        return await db.Voter.updateOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: candidate,
            voter: voter
        }, {
            $set: {
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate,
                voter: voter,
                capacity: String(capacity)
            }
        }, { upsert: true })
    } catch (e) {
        console.error(e)
    }
}

// Get current candates
async function getCurrentCandidates () {
    try {
        let candidates = await validator.methods.getCandidates().call()

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
        return Promise.all(map).catch(e => console.error(e))
    } catch (e) {
        console.error(e)
    }
}

async function updateSigners (blk) {
    try {
        if (!blk) {
            let latestBlockNumber = await web3.eth.getBlockNumber()
            let lastCheckpoint = latestBlockNumber - (latestBlockNumber % parseInt(config.get('blockchain.epoch')))
            if (lastCheckpoint > 0) {
                blk = await web3.eth.getBlock(lastCheckpoint)
            } else {
                return false
            }
        }
        let buff = Buffer.from(blk.extraData.substring(2), 'hex')
        let sbuff = buff.slice(32, buff.length - 65)
        let signers = []
        if (sbuff.length > 0) {
            for (let i = 1; i <= sbuff.length / 20; i++) {
                let address = sbuff.slice((i - 1) * 20, i * 20)
                signers.push('0x' + address.toString('hex'))
            }
            await db.Signer.create({
                networkId: config.get('blockchain.networkId'),
                blockNumber: blk.number,
                signers: signers
            })
        }
        return signers
    } catch (e) {
        console.error(e)
    }
}

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
async function watchNewBlock () {
    while (true) {
        try {
            let blk = await web3.eth.getBlock('latest')
            console.log('update signer for block %s and sleep 1 second', blk.number)
            await updateSigners(blk)
        } catch (e) {
            emitter.emit('error', e)
        }
        await sleep(1000)
    }
}

async function updateLatestSignedBlock () {
    try {
        let blockNumber = await web3.eth.getBlockNumber()
        console.info('BlockSigner %s - Listen events from block number %s ...',
            config.get('blockchain.blockSignerAddress'), blockNumber)
        blockSigner.events.allEvents({
            fromBlock: blockNumber,
            toBlock: 'latest'
        }, async function (error, result) {
            if (error) {
                console.error(error, result)
                return false
            } else {
                let signer = result.returnValues._signer
                let bN = String(result.returnValues._blockNumber)
                console.log('%s sign block %s with tx %s', signer, result.blockNumber, result.transactionHash)

                await db.Candidate.updateOne({
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: signer.toLowerCase()
                }, {
                    $set: {
                        latestSignedBlock: bN
                    }
                }, { upsert: false })
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

async function getPastEvent () {
    let blockNumber = await web3.eth.getBlockNumber()
    console.log('Get all past event from block 0 to block', blockNumber)
    validator.getPastEvents('allEvents', { fromBlock: 0, toBlock: blockNumber }, async function (error, events) {
        if (error) {
            console.error(error)
        } else {
            events.forEach(async function (event) {
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
                    return true
                } else {
                    let candidate = (event.returnValues._candidate || '').toLowerCase()
                    let voter = (event.returnValues._voter || '').toLowerCase()
                    let owner = (event.returnValues._owner || '').toLowerCase()
                    let capacity = event.returnValues._cap
                    let blk = await web3.eth.getBlock(event.blockNumber)
                    let createdAt = new Date(blk.timestamp * 1000)
                    await db.Transaction.findOneAndUpdate({ tx: event.transactionHash }, {
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        tx: event.transactionHash,
                        event: event.event,
                        voter: voter,
                        owner: owner,
                        candidate: candidate,
                        capacity: capacity,
                        createdAt: createdAt
                    }, { upsert: true })

                    if (event.event === 'Vote' || event.event === 'Unvote') {
                        await updateVoterCap(candidate, voter)
                    }
                    if (event.event === 'Resign' || event.event === 'Propose') {
                        await updateVoterCap(candidate, owner)
                    }
                    q.create('voteHistory', { candidate, blockNumber })
                        .priority('high').removeOnComplete(true).save()
                    await updateCandidateInfo(candidate)
                }
            })
        }
    })
}

updateSigners(false).then(() => {
    return getCurrentCandidates().then(() => {
        watchNewBlock()
        watchValidator()
        updateLatestSignedBlock()
    })
}).catch(e => {
    console.log('getCurrentCandidates', e)
    process.exit(1)
})

getPastEvent()

emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})
