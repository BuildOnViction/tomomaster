var TomoValidator = artifacts.require('./TomoValidator');
var BlockSigner = artifacts.require('./BlockSigner');

module.exports = function(deployer) {
    deployer.deploy(BlockSigner)
    return deployer.deploy(TomoValidator, [ ], [ ])
};
