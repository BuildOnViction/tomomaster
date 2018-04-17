var TomoValidator = artifacts.require('./TomoValidator');
var config = require('config');

module.exports = function(deployer) {
    return deployer.deploy(TomoValidator, [
        '0x89cdd0e4226204ad1a093cf898b6f4b1835b2004',
        '0xfd7c1fc5ee3a3eb515f07692cef434ee5f694e8c'
    ], [
        '0',
        '0'
    ]);
};
