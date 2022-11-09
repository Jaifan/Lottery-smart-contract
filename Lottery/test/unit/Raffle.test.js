const {assert,expect} = require("chai")
const {network,deployments ,ethers} = require("hardhat")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const {developmentChains,networkConfig} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ? describe.skip
: describe("Raffle Hardhat Unit Test...!",function (){
    let deployer,vrfCoordinatorV2Mock,raffle, raffleContract,enterceFee,interval
    beforeEach(async ()=>{
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["all"])
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        raffleContract = await ethers.getContract("Raffle")
        raffle = raffleContract.connect(deployer)
        enterceFee = await raffle.getEntranceFee()
        interval = await raffle.getInterval()
    })
    describe("constractor",function (){
        it("Initialized the raffle correctly", async ()=>{
            const raffleState = await raffle.getRaffleState()
            assert.equal(raffleState.toString(),"0")
            assert.equal(interval.toString(),networkConfig[network.config.chainId]["keepersUpdateInterval"])
        })
    })
    
    describe("enterRaffle",function(){
        it("doesn't allow enterence when Raffle is processing",async()=>{
            await raffle.enterRaffle({value: enterceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
            await raffle.performUpkeep([])
            await expect(raffle.enterRaffle({value:enterceFee})).to.be.revertedWith("RaffleNotOpen")
        })
        it("doesn't allow below enter fee pay",async()=>{
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughEthToEnterRaffle")
        })
        it("Registe player after enter raffle",async()=>{
            await raffle.enterRaffle({value: enterceFee})
            const player = await raffle.getPlayer(0)
            assert.equal(player, deployer.address)
        })
        it("Emit after enter raffle execute",async()=>{
            await expect(raffle.enterRaffle({value: enterceFee})).to.emit(raffle,"RaffleEnter")
        })
    })
})