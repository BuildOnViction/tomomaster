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
        return db.Candidate.find().select(['candidate', 'name', 'nodeId'])
            .then(candidates => {
                candidates.forEach(c => {
                    console.log('id:', c.candidate,
                        'name:', c.name || 'null',
                        'nodeId:', c.nodeId || 'null')
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
    .action(async (id, options) => {
        let set = _.pick(options, ['name', 'nodeId'])
        let u = await db.Candidate.update({
            candidate: id
        }, {
            $set: set
        })
        console.log(u)
        process.exit()
    })

commander.parse(process.argv)
