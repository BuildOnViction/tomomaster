const TomoValidator = artifacts.require('./TomoValidator');
const TomoRandomize = artifacts.require('./TomoRandomize');
const BlockSigner = artifacts.require('./BlockSigner');

const minCandidateCap = process.env.MIN_CANDIDATE_CAP;
const maxValidatorNumber = process.env.MAX_VALIDATOR_NUMBER;
const candidateWithdrawDelay = process.env.CANDIDATE_WITHDRAW_DELAY;
const epochNumber = process.env.EPOCH_NUMBER;
const blockTimeSecret = process.env.BLOCK_TIME_SECRET;
const blockTimeOpening = process.env.BLOCK_TIME_OPENING;


module.exports = function(deployer) {

    return deployer.deploy(TomoValidator, [], [], minCandidateCap, maxValidatorNumber, candidateWithdrawDelay).then(() => {
        return  deployer.deploy(TomoRandomize, epochNumber, blockTimeSecret, blockTimeOpening)
    }). then(() => {
        return deployer.deploy(BlockSigner);
    }
)};