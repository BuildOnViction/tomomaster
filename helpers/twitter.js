const Twitter = require('twitter')
const config = require('config')

// const truncate = (fullStr, strLen) => {
//     if (fullStr.length <= strLen) return fullStr

//     const separator = '...'

//     let sepLen = separator.length
//     let charsToShow = strLen - sepLen
//     let frontChars = Math.ceil(charsToShow / 2)
//     let backChars = Math.floor(charsToShow / 2)

//     return fullStr.substr(0, frontChars) +
//            separator +
//            fullStr.substr(fullStr.length - backChars)
// }

const twitter = new Twitter({
    consumer_key: config.get('twitter.consumer_key'),
    consumer_secret: config.get('twitter.consumer_secret'),
    access_token_key: config.get('twitter.access_token_key'),
    access_token_secret: config.get('twitter.access_token_secret')
})

const TwitterHelper = {
    tweetNewMN: async (owner, candidate, amount, txHash) => {
        // amount = new BigNumber(amount)
        // amount = amount.dividedBy(10 ** 18).toNumber()
        const msg = owner.substr(0, 8) + ' has proposed a new candidate ' + candidate.substr(0, 8) +
            '\nCapacity: ' + amount + ' $TOMO' +
            '\nTomoMaster:  https://master.tomochain.com/candidate/' + candidate +
            '\nTransaction: https://scan.tomochain.com/txs/' + txHash

        twitter.post('statuses/update', { status: msg },
            function (error, tweet, response) {
                console.log('tweet error', error)
                // console.log('tweet', tweet)
                // console.log('response', response.body)
            }
        )
    }
}

module.exports = TwitterHelper
