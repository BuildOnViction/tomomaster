pragma solidity ^0.4.21;

import "./libs/SafeMath.sol";

contract TomoRandomize {
    using SafeMath for uint256;
    uint256 public constant epochNumber = 990;
    uint256 public constant blockTimeSecret = 900;
    uint256 public constant blockTimeOpening = 950;

    mapping (address=>bytes32[]) randomSecret;
    mapping (address=>bytes32[]) randomOpening;

    function setSecret(bytes32[] _secret) public {
        require(_secret.length == epochNumber);

        uint256 _blockNum = block.number;
        uint256 _epoch = _blockNum.sub(_blockNum.div(epochNumber).mul(epochNumber));

        require(_epoch <= blockTimeSecret);

        randomSecret[msg.sender] = _secret;
    }

    function setOpening(bytes32[] _opening) public {
        require(_opening.length == epochNumber);

        uint256 _blockNum = block.number;
        uint256 _epoch = _blockNum.sub(_blockNum.div(epochNumber).mul(epochNumber));

        require(_epoch > blockTimeSecret && _epoch <= blockTimeOpening);

        randomOpening[msg.sender] = _opening;

    }

    function getSecret(address _validator) public view returns(bytes32[]) {
        uint256 _blockNum = block.number;
        uint256 _epoch = _blockNum.sub(_blockNum.div(epochNumber).mul(epochNumber));

        require(_epoch > blockTimeSecret);

        return randomSecret[_validator];
    }

    function getOpening(address _validator) public view returns(bytes32[]) {
        uint256 _blockNum = block.number;
        uint256 _epoch = _blockNum.sub(_blockNum.div(epochNumber).mul(epochNumber));

        require(_epoch > blockTimeOpening);

        return randomOpening[_validator];
    }
}
