const { expect } = require('chai');
const { ethers } = require("hardhat");

// Start test block
describe('TokenHardHat', function () {
  before(async function () {
    this.TokenHardHat = await ethers.getContractFactory('TokenHardHat');
  });

  beforeEach(async function () {
    // deploy the contract
    this.TokenHardHat = await this.TokenHardHat.deploy();
    await this.TokenHardHat.deployed();

    // Get the contractOwner and collector address
    const signers = await ethers.getSigners();
    this.contractOwner = signers[0].address;
    this.collector = signers[1].address;

    // Get the collector contract for signing transaction with collector key
    this.collectorContract = this.TokenHardHat.connect(signers[1]);

    // Mint an initial set of NFTs from this collection
    this.initialMintCount = 3;
    this.initialMint = [];
    for (let i = 1; i <= this.initialMintCount; i++) { // tokenId to start at 1
        await this.TokenHardHat.mintCollectionNFT(this.contractOwner, i);
        this.initialMint.push(i.toString());
    }
  });

  // Test cases
  it('Creates a token collection with a name', async function () {
    expect(await this.TokenHardHat.name()).to.exist;
    // expect(await this.TokenHardHat.name()).to.equal('TokenHardHat');
  });

  it('Creates a token collection with a symbol', async function () {
    expect(await this.TokenHardHat.symbol()).to.exist;
    // expect(await this.TokenHardHat.symbol()).to.equal('NONFUN');
  });

  it('Mints initial set of NFTs from collection to contractOwner', async function () {
    for (let i = 0; i < this.initialMint.length; i++) {
        expect(await this.TokenHardHat.ownerOf(this.initialMint[i])).to.equal(this.contractOwner);
    }
  });

  it('Is able to query the NFT balances of an address', async function () {
    expect(await this.TokenHardHat.balanceOf(this.contractOwner)).to.equal(this.initialMint.length);
  });

  it('Is able to mint new NFTs to the collection to collector', async function () {
    let tokenId = (this.initialMint.length+1).toString();
    await this.TokenHardHat.mintCollectionNFT(this.collector,tokenId);
    expect(await this.TokenHardHat.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a transfer event for newly minted NFTs', async function () {
    let tokenId = (this.initialMint.length+1).toString();
    await expect(this.TokenHardHat.mintCollectionNFT(this.contractOwner, tokenId))
    .to.emit(this.TokenHardHat, "Transfer")
    .withArgs("0x0000000000000000000000000000000000000000", this.contractOwner, tokenId); //NFTs are minted from zero address
  });

  it('Is able to transfer NFTs to another wallet when called by owner', async function () {
    let tokenId = this.initialMint[0].toString();
    await this.TokenHardHat["safeTransferFrom(address,address,uint256)"](this.contractOwner, this.collector, tokenId);
    expect(await this.TokenHardHat.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a Transfer event when transferring a NFT', async function () {
    let tokenId = this.initialMint[0].toString();
    await expect(this.TokenHardHat["safeTransferFrom(address,address,uint256)"](this.contractOwner, this.collector, tokenId))
    .to.emit(this.TokenHardHat, "Transfer")
    .withArgs(this.contractOwner, this.collector, tokenId);
  });

  it('Approves an operator wallet to spend owner NFT', async function () {
    let tokenId = this.initialMint[0].toString();
    await this.TokenHardHat.approve(this.collector, tokenId);
    expect(await this.TokenHardHat.getApproved(tokenId)).to.equal(this.collector);
  });

  it('Emits an Approval event when an operator is approved to spend a NFT', async function() {
    let tokenId = this.initialMint[0].toString();
    await expect(this.TokenHardHat.approve(this.collector, tokenId))
    .to.emit(this.TokenHardHat, "Approval")
    .withArgs(this.contractOwner, this.collector, tokenId);
  });

  it('Allows operator to transfer NFT on behalf of owner', async function () {
    let tokenId = this.initialMint[0].toString();
    await this.TokenHardHat.approve(this.collector, tokenId);
    // Using the collector contract which has the collector's key
    await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.contractOwner, this.collector, tokenId);
    expect(await this.TokenHardHat.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Approves an operator to spend all of an owner\'s NFTs', async function () {
    await this.TokenHardHat.setApprovalForAll(this.collector, true);
    expect(await this.TokenHardHat.isApprovedForAll(this.contractOwner, this.collector)).to.equal(true);
  });

  it('Emits an ApprovalForAll event when an operator is approved to spend all NFTs', async function() {
    let isApproved = true
    await expect(this.TokenHardHat.setApprovalForAll(this.collector, isApproved))
    .to.emit(this.TokenHardHat, "ApprovalForAll")
    .withArgs(this.contractOwner, this.collector, isApproved);
  });

  it('Removes an operator from spending all of owner\'s NFTs', async function() {
    // Approve all NFTs first
    await this.TokenHardHat.setApprovalForAll(this.collector, true);
    // Remove approval privileges
    await this.TokenHardHat.setApprovalForAll(this.collector, false);
    expect(await this.TokenHardHat.isApprovedForAll(this.contractOwner, this.collector)).to.equal(false);
  });

  it('Allows operator to transfer all NFTs on behalf of owner', async function() {
    await this.TokenHardHat.setApprovalForAll(this.collector, true);
    for (let i = 0; i < this.initialMint.length; i++) {
        await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.contractOwner, this.collector, this.initialMint[i]);
    }
    expect(await this.TokenHardHat.balanceOf(this.collector)).to.equal(this.initialMint.length.toString());
  });

  it('Only allows contractOwner to mint NFTs', async function () {
    await expect (this.collectorContract.mintCollectionNFT(this.collector, "100")).to.be.reverted;
  });

});