const TomoValidator = artifacts.require('./TomoValidator');
const TomoRandomize = artifacts.require('./TomoRandomize');
const BlockSigner = artifacts.require('./BlockSigner');

const config = require('config');
minVoterCap = minCandidateCap = maxValidatorNumber = candidateWithdrawDelay = voterWithdrawDelay = epochNumber = blockTimeSecret = blockTimeOpening = 0;
if (config.has('truffle')){
    minCandidateCap = config.get('truffle.minCandidateCap');
    minVoterCap = config.get('truffle.minVoterCap');
    maxValidatorNumber = config.get('truffle.maxValidatorNumber');
    candidateWithdrawDelay = config.get('truffle.candidateWithdrawDelay');
    voterWithdrawDelay = config.get('truffle.voterWithdrawDelay');
    epochNumber = config.get('truffle.epochNumber');
}

module.exports = function(deployer) {

    let candidates = [
        '0xf99805B536609cC03AcBB2604dFaC11E9E54a448',
        '0x31b249fE6F267aa2396Eb2DC36E9c79351d97Ec5',
        '0xfC5571921c6d3672e13B58EA23DEA534f2b35fA0'
    ]
    let caps = [
        '50000000000000000000000',
        '50000000000000000000000',
        '50000000000000000000000'
    ]
    let firstOwner = '0x487d62d33467c4842c5e54Eb370837E4E88BBA0F'
    return deployer.deploy(TomoValidator, candidates, caps, firstOwner, minCandidateCap, minVoterCap, maxValidatorNumber, candidateWithdrawDelay, voterWithdrawDelay).then((tv) => {
        return  deployer.deploy(TomoRandomize)
    }). then(() => {
        return deployer.deploy(BlockSigner, epochNumber);
    })
};
