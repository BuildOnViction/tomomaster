'use strict'

const commander = require('commander')
const db = require('./models/mongodb')
const _ = require('lodash')
const cmdValidator = require('./commands/validator')
const { updatePenalty } = require('./commands/penalty')
const { updateStatus } = require('./commands/status')
const { watchValidator } = require('./commands/recrawl')
const web3Rpc = require('./models/blockchain/web3rpc').Web3RpcInternal()

commander
    .version('0.1.0')
    .description('Candidate Management Commands')

commander
    .command('validator blockNumber')
    .alias('v')
    .description('Re-crawl tx vote/unvote/resign/propose/withdraw')
    .action(async (blockNumber) => {
        return cmdValidator.run(parseInt(blockNumber))
    })

commander
    .command('list')
    .alias('l')
    .description('List candidates')
    .action(() => {
        return db.Candidate.find()
            .then(candidates => {
                candidates.forEach(c => {
                    console.log('ID:', c.candidate, '\n',
                        'name:', c.name || 'null', '\n',
                        'nodeId:', c.nodeId || 'null', '\n',
                        'hardware:', c.hardware || 'null', '\n',
                        'dc-name:', (c.dataCenter || {}).name || 'null', '\n',
                        'dc-location:', (c.dataCenter || {}).location || 'null', '\n',
                        'github:', (c.socials || {}).github || 'null', '\n',
                        'linkedin:', (c.socials || {}).linkedin || 'null', '\n',
                        'email:', (c.socials || {}).email || 'null', '\n'
                    )
                    console.log('===')
                })
                process.exit()
            })
    })

commander
    .command('update <id>')
    .alias('u')
    .description('Update candidate information')
    .option('-n, --name <name>', 'Name of Candidate')
    .option('-i, --nodeId <nodeId>', 'nodeId of Candidate')
    .option('-dcn, --dc-name <dcName>', 'Name of Datacenter')
    .option('-dcl, --dc-location <dcLocation>', 'Location of Datacenter')
    .option('-h, --hardware <hardware>', 'Harware Information')
    .option('-g, --scGithub <github>', 'Github Information')
    .option('-l, --scLinkedin <linkedin>', 'Linkedin Information')
    .option('-e, --scEmail <email>', 'Email Information')
    .option('-t, --scTelegram <telegram>', 'Telegram')
    .option('-w, --scWebsite <website>', 'Website')
    .action(async (id, options) => {
        let set = _.pick(options, ['nodeId', 'hardware'])
        if (typeof options.name === 'string') {
            set['name'] = options.name
        }
        if (options.dcName) {
            set['dataCenter.name'] = options.dcName
        }
        if (options.dcLocation) {
            set['dataCenter.location'] = options.dcLocation
        }
        if (options.scGithub) {
            set['socials.github'] = options.scGithub
        }
        if (options.scLinkedin) {
            set['socials.linkedin'] = options.scLinkedin
        }
        if (options.scEmail) {
            set['socials.email'] = options.scEmail
        }
        if (options.scTelegram) {
            set['socials.telegram'] = options.scTelegram
        }
        if (options.scWebsite) {
            set['socials.website'] = options.scWebsite
        }
        let u = await db.Candidate.updateOne({
            candidate: id
        }, {
            $set: set
        })
        console.log(u)
        process.exit()
    })

commander
    .command('update-penalty')
    .alias('up')
    .description('Update penalty table')
    .action(async () => {
        let latestBlockNumber = await web3Rpc.eth.getBlockNumber()
        const num1To = parseInt(latestBlockNumber / 3) - 1
        const num2From = latestBlockNumber + 1
        const num2To = parseInt(latestBlockNumber / 3) * 2
        const num3From = (parseInt(latestBlockNumber / 3) * 2) + 1
        await Promise.all([
            updatePenalty(0, num1To),
            updatePenalty(num2From, num2To),
            updatePenalty(num3From, latestBlockNumber)
        ])
        process.exit()
    })

commander
    .command('update-status')
    .alias('up')
    .description('Update status table')
    .description('WARNING')
    .description('From epoch should exist in the status table first')
    .option('-f, --fromEpoch <fromEpoch>', 'To epoch')
    .option('-t, --toEpoch <toEpoch>', 'To epoch')
    .action(async (input) => {
        const fromEpoch = input.fromEpoch || null
        const toEpoch = input.toEpoch || null
        await updateStatus(fromEpoch, toEpoch)
        process.exit()
    })

commander
    .command('update-transaction')
    .description('Update transaction table')
    .description('WARNING')
    .description('From block should exist in the status table first')
    .option('-f, --fromBlock <fromBlock>', 'From block')
    .option('-t, --toBlock <toBlock>', 'To block')
    .action(async (input) => {
        const fromBlock = input.fromBlock || null
        const toBlock = input.toBlock || null
        await watchValidator(fromBlock, toBlock)
        process.exit()
    })

commander.parse(process.argv)
