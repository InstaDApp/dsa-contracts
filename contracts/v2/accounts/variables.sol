pragma solidity ^0.7.0;

contract Variables {
    // M1: Auth Module(Address of Auth => bool).
    mapping (address => bool) internal _auth;
    // M2: Reentrancy Guard variable
    uint256 internal _status;
}