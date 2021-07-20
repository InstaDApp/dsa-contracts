// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { TimelockController } from "@openzeppelin/contracts/access/TimelockController.sol";

interface IndexInterface {
    function master() external view returns (address);
    function changeMaster(address) external;
    function updateMaster() external;
}

contract InstaChiefTimelockContract is TimelockController {

    constructor (address[] memory chiefMultiSig) public TimelockController(2 days, chiefMultiSig, chiefMultiSig) {
        require(chiefMultiSig.length == 1, "chiefMultiSig length != 1");
    }
}