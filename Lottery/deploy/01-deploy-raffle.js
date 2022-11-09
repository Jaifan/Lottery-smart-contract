const { network, ethers } = require("hardhat");
const {networkConfig,developmentChains,VERIFICATION_BLOCK_CONFIRMATIONS} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")
const FUND_AMOUNT = ethers.utils.parseEther("1");

module.exports = async function({getNamedAccounts, deployments}){
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    let VRFCoordinatorV2Address,subcribeId

    if(chainId == 31337){
        const VRFCoordinatorV2Mock  = await ethers.getContract("VRFCoordinatorV2Mock");
        VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address
        const tranactionResponse = await VRFCoordinatorV2Mock.createSubscription();
        const tranactionReceipt = await tranactionResponse.wait();
        subcribeId = tranactionReceipt.events[0].args.subId;
        await VRFCoordinatorV2Mock.fundSubscription(subcribeId,FUND_AMOUNT);

    } else{
        VRFCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subcribeId = networkConfig[chainId]["subscriptionId"];
    }

    const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;
    log("------------------------------------------------------------------------------");
    
    const arguments = [
        VRFCoordinatorV2Address,
        networkConfig[chainId]["raffleEntranceFee"],
        networkConfig[chainId]["gasLane"],
        subcribeId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["keepersUpdateInterval"]
    ]
    
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: waitConfirmations,
    })

    if(developmentChains.includes(network.name)){
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Mock.addConsumer(subcribeId,raffle.address)
    }

    if(!developmentChains.includes(network.name)){ //EthScanAPI
        log("Verifying....");
        await verify(raffle.address, arguments);
    }
    const networkName = network.name == "hardhat" ? "localhost" : network.name;
    log("Enter Raffle with Command:")
    log(`yarn hardhat run script/enterRaffle.js --netwrok ${networkName}`);
    log("------------------------------------------------------------------------------");
}

module.exports.tags = ["all", 'raffle'];