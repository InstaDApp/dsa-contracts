pragma solidity ^0.7.0;

contract Variables {
    // Auth Module(Address of Auth => bool).
    mapping (address => bool) internal _auth;
    // enable beta mode to access all the beta features.
    bool internal _beta;
}