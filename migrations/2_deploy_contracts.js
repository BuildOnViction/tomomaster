const config = require('config');

const TomoValidator = artifacts.require('./TomoValidator');
const TomoRandomize = artifacts.require('./TomoRandomize');
const BlockSigner = artifacts.require('./BlockSigner');

const minCandidateCap = config.get('truffle.minCandidateCap');
const maxValidatorNumber = config.get('truffle.maxValidatorNumber');
const candidateWithdrawDelay = config.get('truffle.candidateWithdrawDelay');
const epochNumber = config.get('truffle.epochNumber');
const blockTimeSecret = config.get('truffle.blockTimeSecret');
const blockTimeOpening = config.get('truffle.blockTimeOpening');


module.exports = function(deployer) {

    return deployer.deploy(TomoValidator, [], [], minCandidateCap, maxValidatorNumber, candidateWithdrawDelay).then(() => {
        return  deployer.deploy(TomoRandomize, epochNumber, blockTimeSecret, blockTimeOpening)
    }). then(() => {
        return deployer.deploy(BlockSigner);
    }
)};