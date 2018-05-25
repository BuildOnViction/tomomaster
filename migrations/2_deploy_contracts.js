var TomoValidator = artifacts.require('./TomoValidator');

module.exports = function(deployer) {
    return deployer.deploy(TomoValidator, [ ], [ ]);
};
