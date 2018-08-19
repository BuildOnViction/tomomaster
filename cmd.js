'use strict'

const commander = require('commander')
const db = require('./models/mongodb')

commander
    .version('0.1.0')
    .description('Candidate Management Commands')

commander
    .command('list')
    .alias('l')
    .description('List candidates')
    .action(() => {
        return db.Candidate.find().select(['candidate', 'name'])
            .then(candidates => {
                candidates.forEach(c => {
                    console.log('id:', c.candidate, 'name:', c.name || 'null')
                })
                process.exit()
            })
    })

commander
    .command('update <id> <name>')
    .alias('u')
    .description('Update candidate information')
    .action(async (id, name) => {
        await db.Candidate.update({
            candidate: id
        }, {
            $set: {
                name: name
            }
        })
        process.exit()
    })

commander.parse(process.argv)
