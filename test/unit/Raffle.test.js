const {assert,expect} = require("chai")
const {network,deployments ,ethers} = require("hardhat")
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

    describe("checkUpkeep",function(){
        it("Return False if contract balance is Zero", async()=>{
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x")
            assert(!upkeepNeeded)
        })
        it("Return false if contract isn't open",async()=>{
            await raffle.enterRaffle({value: enterceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
            await raffle.performUpkeep([])
            const raffleState = await raffle.getRaffleState()
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x")
            assert.equal(raffleState.toString()=="1",!upkeepNeeded)
        })
        it("Return true when Time is passed",async()=>{
            await raffle.enterRaffle({value: enterceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x")
            assert(upkeepNeeded)
        })
    })

    describe("performUpkeep",function(){
        it("can only if CheckUpKeep is ture",async()=>{
            await raffle.enterRaffle({value: enterceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
            const tx = await raffle.performUpkeep("0x")
            assert(tx)
        })
        it("Revert when checkUpKeep is false",async()=>{
            await expect(raffle.performUpkeep("0x")).to.be.revertedWith("Raffle__UpKeepNotNeeded")
        })
        it("Emit a requestId & raffle state update",async()=>{
            await raffle.enterRaffle({value: enterceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
            const txRes = await raffle.performUpkeep("0x")
            const txRep = await txRes.wait(1)
            const raffleState = await raffle.getRaffleState()
            const requestId = txRep.events[1].args.requestId
            assert(raffleState.toString()=="1")
            assert(requestId.toNumber()>0)
        })
    })

    describe("fulfillRandomWords",function(){
        beforeEach(async()=>{
            await raffle.enterRaffle({value: enterceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method: "evm_mine",params: []})
        })
        it("can only be called after performupkeep", async () => {
            await expect(
                vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address) // reverts if not fulfilled
            ).to.be.revertedWith("nonexistent request")
            await expect(
                vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address) // reverts if not fulfilled
            ).to.be.revertedWith("nonexistent request")
        })
        it("Pick a winner and make the player list zero",async()=>{
            const NumberOfPlayer = 4;
            for(let i = 1;i<NumberOfPlayer;i++){
                
            }
        })
        
    })
})