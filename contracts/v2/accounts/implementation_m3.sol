pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { Variables } from "./variables.sol";

/**
 * @title InstaAccountV2.
 * @dev DeFi Smart Account Wallet.
 */

interface ConnectorsInterface {
    function isConnectors(string memory connectorName) external view returns (bool, address, uint);
}

contract Constants is Variables {
    // InstaIndex Address.
    address internal immutable instaIndex;
    // Connectors Address.
    ConnectorsInterface public immutable connectors;

    constructor(address _instaIndex, address _connectors) {
        connectors = ConnectorsInterface(_connectors);
        instaIndex = _instaIndex;
    }
}

contract InstaImplementationM1 is Constants {

    constructor(address _instaIndex, address _connectors) Constants(_instaIndex, _connectors) {}

    function decodeEvent(bytes memory response) internal pure returns (string memory _eventCode, bytes memory _eventParams) {
        if (response.length > 0) {
            (_eventCode, _eventParams) = abi.decode(response, (string, bytes));
        }
    }

    event LogCastAutomation(
        address indexed origin,
        address indexed sender,
        uint256 value,
        string targetsName,
        address target,
        string eventName,
        bytes eventParam
    );

    receive() external payable {}

     /**
     * @dev Delegate the calls to Connector.
     * @param _target Connector address
     * @param _data CallData of function.
    */
    function spell(address _target, bytes memory _data) internal returns (bytes memory response) {
        require(_target != address(0), "target-invalid");
        assembly {
            let succeeded := delegatecall(gas(), _target, add(_data, 0x20), mload(_data), 0, 0)
            let size := returndatasize()
            
            response := mload(0x40)
            mstore(0x40, add(response, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            mstore(response, size)
            returndatacopy(add(response, 0x20), 0, size)

            switch iszero(succeeded)
                case 1 {
                    // throw if delegatecall failed
                    returndatacopy(0x00, 0x00, size)
                    revert(0x00, size)
                }
        }
    }

    /**
     * @dev This is the main function, Where all the different functions are called
     * from Smart Account.
     * @param _targetName Array of Connector names.
     * @param _data Array of Calldata.
     * @param _tokenForGas Token to pay gas in.
    */
    function castAutomation(
        string memory _targetName,
        bytes memory _data,
        address _tokenForGas,
        address _origin
    )
    external
    payable 
    {
        // TODO: store initial gas

        require(_automation[msg.sender][_targetName], "3: array-length-invalid");
        
        string memory eventName;
        bytes memory eventParam;

        (bool isOk, address _target, uint baseGas) = connectors.isConnectors(_targetName);

        require(isOk, "1: not-connector");

        bytes memory response = spell(_target, _data);
        (eventName, eventParam) = decodeEvent(response);

        emit LogCastAutomation(
            _origin,
            msg.sender,
            msg.value,
            _targetName,
            _target,
            eventName,
            eventParam
        );

        // TODO: store final gas
        // TODO: pay the gas difference in desired token using Chainlink's price (with some base gas?)
    }
}