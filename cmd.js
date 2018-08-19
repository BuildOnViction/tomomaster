'use strict'

const commander = require('commander')
const db = require('./models/mongodb')
const _ = require('lodash')

commander
    .version('0.1.0')
    .description('Candidate Management Commands')

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
                        'hardwhere:', c.hardware || 'null', '\n',
                        'dc-name:', (c.dataCenter || {}).name || 'null', '\n',
                        'dc-location:', (c.dataCenter || {}).location || 'null'
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
    .option('-hw, --hardware <hardware>', 'Harware Information')
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
        let u = await db.Candidate.update({
            candidate: id
        }, {
            $set: set
        })
        console.log(u)
        process.exit()
    })

commander.parse(process.argv)
