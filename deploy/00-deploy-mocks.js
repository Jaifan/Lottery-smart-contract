const { network } = require("hardhat");

const BASE_FEE = "250000000000000000";
const GAS_PRICE_LINK = 1e9;

module.exports = async function({getNamedAccounts, deployments}){
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    if(chainId == 31337){
        log("Local netwrok detected. Deploying mocks.....");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE,GAS_PRICE_LINK]
        });

        log("Mocks Deployed.!");
        log("Please run `yarn hardhat console --network localhost` to interact with deployed smart contract.")
        log("------------------------------------------------------------------------------");
        log("------------------------------------------------------------------------------");

    }
}
module.exports.tags = ["all","mocks"]