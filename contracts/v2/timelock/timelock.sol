// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import {TimelockController} from "@openzeppelin/contracts/access/TimelockController.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

interface IndexInterface {
    function master() external view returns (address);
    function changeMaster(address) external;
    function updateMaster() external;
}

contract InstaTimelockContract is Initializable, TimelockController {

    IndexInterface constant public instaIndex = IndexInterface(0x2971AdFa57b20E5a416aE5a708A8655A9c74f723);
    address constant public governanceTimelock = 0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC;

    constructor (address[] memory masterSig) public TimelockController(10 days, masterSig, masterSig){
    }

    function initialize() external initializer {
        instaIndex.updateMaster();
        instaIndex.changeMaster(governanceTimelock);
    }
}