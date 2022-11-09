require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1
    },
    goerli : {
      chainId: 5,
      blockConfirmations:6,
      url: "https://eth-goerli.g.alchemy.com/v2/foCjgi5f7XnLe0aHf2mv4qDtI4lJZxzz",
      accounts: ["fea88c2bd88239da66ab2c0a614b9443566e0b4cca3ece8bd09728d088f01750"]
    }

  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
        goerli: "PQ6NXSZ86JS5SAQGDZ6EV54MWERMX8JSSR",
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
},
contractSizer: {
  runOnCompile: false,
  only: ["Raffle"],
},
  solidity: "0.8.17",
  namedAccounts: {
    deployer: {
      default:0,
    },
    player:{
      default:1,
    },
  },
};
