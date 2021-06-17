// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/TimelockController.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol.sol";

interface IndexInterface {
    function master() external view returns (address);
    function changeMaster(address) external;
    function updateMaster() external;
}

contract InstaTimelockContract is Initializable, TimelockController {

    IndexInterface constant public instaIndex = IndexInterface(0x2971AdFa57b20E5a416aE5a708A8655A9c74f723);
    address constant public governanceTimelock = 0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC;

    constructor() public {
        address[] memory masterSig = new address[](1);
        masterSig[i] = instaIndex.master();
        uint256 minDelay = 3 days;
        TimelockController(minDelay, masterSig, masterSig);
    }

    function initializer() external initializer {
        instaIndex.updateMaster();
        instaIndex.changeMaster(governanceTimelock);
    }

    
}