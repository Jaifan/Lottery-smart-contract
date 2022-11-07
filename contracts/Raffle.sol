
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";


/*errors*/
error Raffle__NotEnoughEthToEnterRaffle();
error Raffle_TransferFailed();
error RaffleNotOpen();
error Raffle__UpKeepNotNeeded(uint256 balance, uint256 numberOfPlayers, uint256 raffleState );

/**
 * @title A Raffle Smart Contract
 * @author Jafran Bin Zakaria 
 */

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /* Eum variable */
    enum RaffleState{
        OPEN,PROCESSING
    } // uint256 0= Open, 1=Processing

    /*State Variable*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash; 
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3; 
    uint32 private constant NUM_WORDS = 1;
    
    /* Raffle variable */
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /* Events */
    event RaffleEnter(address indexed players);
    event RquestRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(address vrfCoordinatorV2, uint256 entranceFee, bytes32 keyHash, uint64 subscriptionId, uint32 callbackGasLimit, uint256 interval ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2); //contract
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }
    /**
     * @dev This function call chainlink Automation or keepers
     * This will run off-chain
     * Always trigger by upkeepers after fixed time interval
     */
    function checkUpkeep(bytes memory /* checkData */) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool intervalValid = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayer = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && intervalValid && hasBalance && hasPlayer);
        return(upkeepNeeded, "0x0");
    }

    function enterRaffle() public payable {
        if(msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthToEnterRaffle();
        }
        if(s_raffleState != RaffleState.OPEN){
            revert RaffleNotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded,) = checkUpkeep("");
        if(!upkeepNeeded) {
            revert Raffle__UpKeepNotNeeded(address(this).balance,s_players.length, uint256(s_raffleState) );
        }
        s_raffleState = RaffleState.PROCESSING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RquestRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256 /*requestId*/, uint256[] memory randomWords) internal override{
        uint256 indexOFWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOFWinner];
        s_recentWinner = recentWinner;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        s_players = new address payable[](0);
        s_raffleState = RaffleState.OPEN;
        if(!success) { revert Raffle_TransferFailed();}
        emit WinnerPicked(recentWinner);
    }
     
    /* View / Pure functions */
    function getEntranceFee() public view returns(uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns(address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns(address){
        return s_recentWinner;
    }
    function getRaffleState() public view returns(RaffleState){
        return s_raffleState;
    }
    function getNumWords() public pure returns(uint256){
        return NUM_WORDS;
    }
    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
    function getRequestconfirmation() public pure returns(uint256) {
        return REQUEST_CONFIRMATIONS;
    }

}