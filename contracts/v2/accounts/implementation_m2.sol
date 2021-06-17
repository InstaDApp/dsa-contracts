pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { Variables } from "./variables.sol";

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";


/**
 * @title InstaAccountV2.
 * @dev DeFi Smart Account Wallet.
 * @notice Flashloan Module
 */

interface ConnectorsInterface {
    function isConnectors(string[] calldata connectorNames) external view returns (bool, address[] memory);
}

interface FlashloanInterface {
    function initiateFlashLoan(	
        address token,	
        uint256 amount,
        uint256 route,
        bytes calldata data	
    ) external;
}


contract Constants is Variables {
    // InstaIndex Address.
    address public immutable instaIndex;
    // Connectors Address.
    ConnectorsInterface public immutable connectors;
    // Instapool Address.
    address public immutable flashloan;

    uint256 internal constant _NOT_ENTERED = 1;
    uint256 internal constant _ENTERED = 2;

    constructor(address _instaIndex, address _connectors, address _flashloan) {
        connectors = ConnectorsInterface(_connectors);
        instaIndex = _instaIndex;
        flashloan = _flashloan;
    }
}

contract InstaImplementationM2 is Constants {

    constructor(address _instaIndex, address _connectors, address _flashloan) Constants(_instaIndex, _connectors, _flashloan) {}

    function decodeEvent(bytes memory response) internal pure returns (string memory _eventCode, bytes memory _eventParams) {
        if (response.length > 0) {
            (_eventCode, _eventParams) = abi.decode(response, (string, bytes));
        }
    }

    event LogCast(
        address indexed origin,
        address indexed sender,
        uint256 value,
        string[] targetsNames,
        address[] targets,
        string[] eventNames,
        bytes[] eventParams
    );

    event LogFlashCast(
        address indexed origin,
        address tokens,
        uint256 amount,
        uint256 route
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

    function _cast(
        string[] calldata _targetNames,
        bytes[] calldata _datas,
        address _origin,
        uint _length
    )
    internal 
    {   
        require(_status == _ENTERED, "2: cast-not-entered");
        string[] memory eventNames = new string[](_length);
        bytes[] memory eventParams = new bytes[](_length);

        (bool isOk, address[] memory _targets) = connectors.isConnectors(_targetNames);

        require(isOk, "2: not-connector");

        for (uint i = 0; i < _length; i++) {
            bytes memory response = spell(_targets[i], _datas[i]);
            (eventNames[i], eventParams[i]) = decodeEvent(response);
        }

        emit LogCast(
            _origin,
            msg.sender,
            msg.value,
            _targetNames,
            _targets,
            eventNames,
            eventParams
        );

        _status = _NOT_ENTERED;
    }

    /**
     * @dev Callback function for flashloan
     * @param sender msg.sender of the cast().
     * @param _token flashloan token address.
     * @param _amount flashloan amount.
     * @param _targetNames Array of Connector address.
     * @param _datas Array of Calldata.
    */
    function flashCallback(
        address sender,
        address _token,
        uint256 _amount,
        string[] calldata _targetNames,
        bytes[] calldata _datas,
        address _origin
    ) external payable {      
        uint256 _length = _targetNames.length;
        require(_auth[sender] || sender == address(this), "2: not-an-owner");
        require(msg.sender == flashloan, "2: not-flashloan-contract");
        require(_length != 0, "2: length-invalid");
        require(_length == _datas.length , "2: array-length-invalid");

        _cast(_targetNames, _datas, _origin, _length);

        if (_token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            uint256 ethBalance = address(this).balance;
            uint256 transferAmt = ethBalance > _amount ? _amount : ethBalance;
            payable(flashloan).transfer(transferAmt);
        } else {
            uint256 tokenBalance = IERC20(_token).balanceOf(address(this));
            uint256 transferAmt = tokenBalance > _amount ? _amount : tokenBalance;
            SafeERC20.safeTransfer(IERC20(_token), flashloan, transferAmt);
        }
    }

    /**
     * @dev This function is similar cast() on M1 with flashloan access.
     * @param _targetNames Array of Connector names.
     * @param _datas Array of Calldata.
     * @param _origin
     * @param _token Flashloan address.
     * @param _amount Flashloan amount.
    */
    function cast(
        string[] calldata _targetNames,
        bytes[] calldata _datas,
        address _token,
        uint256 _amount,
        uint route, // 0 for dydx route
        address _origin
    ) external {
        require(_status != _ENTERED, "2: cast-entered");
        _status = _ENTERED;

        require(_auth[msg.sender] || msg.sender == address(this), "2: permission-denied");
        if (_amount == 0) {
            uint256 _length = _targetNames.length;
            require(_length != 0, "2: length-invalid");
            require(_length == _datas.length , "2: array-length-invalid");
            _cast(_targetNames, _datas, _origin, _length);
        } else {
            bytes memory data = abi.encodeWithSelector(
                this.flashCallback.selector,
                msg.sender,
                _token,
                _amount,
                _targetNames,
                _datas,
                flashloan
            );

            FlashloanInterface(flashloan).initiateFlashLoan(_token, _amount, route, data);

            emit LogFlashCast(_origin, _token, _amount, route);
        }
        require(_status == _NOT_ENTERED, "2: cast-still-entered");
    }

}