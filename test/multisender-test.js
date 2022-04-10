const {expect} = require("chai");
const {ethers} = require("hardhat");
const {parseUnits} = require("ethers/lib/utils");
const provider = ethers.provider;

const resetHardhat = async () =>{
    await ethers.provider.send('hardhat_reset');
}

describe("Test send ETH", async () => {
    before(async () => {
        this.wallet = await ethers.getSigners();
        this.MultiSender = await ethers.getContractFactory('MultiSender');
    });

    beforeEach(async () => {
        await resetHardhat()
        this.multiSender = await this.MultiSender.deploy();
        this.recipients = [];
        this.values = [];
        for (let i = 1; i < this.wallet.length; i++) {
            this.recipients.push(this.wallet[i].address);
            this.values.push(parseUnits('1', '18'));
        }
    });

    it("Send successfully", async () => {
        let length = this.recipients.length.toString();
        let balanceBefore = await Promise.all([
            provider.getBalance(this.wallet[0].address),
            provider.getBalance(this.wallet[1].address),
            provider.getBalance(this.wallet[Number(length) - 1].address),
        ]);
        let tx = await this.multiSender.sendETH(this.recipients, this.values, {value: parseUnits(length, '18')});
        tx = await tx.wait();
        let balanceAfter = await Promise.all([
            provider.getBalance(this.wallet[0].address),
            provider.getBalance(this.wallet[1].address),
            provider.getBalance(this.wallet[Number(length) - 1].address),
        ]);
        let fee = tx.gasUsed.mul(tx.effectiveGasPrice);
        expect(balanceBefore[0].sub(fee).sub(balanceAfter[0]).sub(parseUnits(length, '18')).toString()).to.equal('0');
        expect(balanceBefore[1].add(parseUnits('1', '18')).toString()).to.equal(balanceAfter[1].toString());
        expect(balanceBefore[2].add(parseUnits('1', '18')).toString()).to.equal(balanceAfter[2].toString());
    });

    it("Send failed with different length", async () => {
        this.recipients.pop();
        let length = this.recipients.length.toString();
        await expect(this.multiSender.sendETH(this.recipients, this.values, {value: parseUnits(length, '18')}))
            .to.be.revertedWith('MultiSender: _recipients and _values not equal');
    });

    it("Send failed with not enough ether", async () => {
        await expect(this.multiSender.sendETH(this.recipients, this.values, {value: parseUnits('10', '18')}))
            .to.be.revertedWith('MultiSender: Failed to send Ether');
    });

    it("Send ether back", async () => {
        let length = this.recipients.length.toString();
        let balanceBefore = await Promise.all([
            provider.getBalance(this.wallet[0].address),
        ]);
        let tx = await this.multiSender.sendETH(this.recipients, this.values, {value: parseUnits('20', '18')});
        tx = await tx.wait();
        let balanceAfter = await Promise.all([
            provider.getBalance(this.wallet[0].address),
        ]);
        let fee = tx.gasUsed.mul(tx.effectiveGasPrice);
        expect(balanceBefore[0].sub(fee).sub(balanceAfter[0]).toString()).to.equal(parseUnits(length, '18'));
    });

    //TODO: unit test with recipient is contract
});

describe("Test send ERC20", async () => {
    before(async () => {
        this.wallet = await ethers.getSigners();
        this.MultiSender = await ethers.getContractFactory('MultiSender');
        this.ERC20 = await ethers.getContractFactory('MockERC20');
    });

    beforeEach(async () => {
        await resetHardhat();
        this.multiSender = await this.MultiSender.deploy();
        this.mockERC20 = await this.ERC20.deploy();
        await this.mockERC20.mint(this.wallet[0].address, parseUnits('1000000', '18'));
        this.recipients = [];
        this.values = [];
        for (let i = 1; i < this.wallet.length; i++) {
            this.recipients.push(this.wallet[i].address);
            this.values.push(parseUnits('10', '18'));
        }
    });

    it("Send erc20 successfully", async () => {
        let length = this.recipients.length.toString();
        let balanceBefore = await Promise.all([
            this.mockERC20.balanceOf(this.wallet[0].address),
            this.mockERC20.balanceOf(this.wallet[1].address),
            this.mockERC20.balanceOf(this.wallet[Number(length) - 1].address),
        ]);
        await this.mockERC20.approve(this.multiSender.address, ethers.constants.MaxUint256);
        await this.multiSender.sendERC20(this.mockERC20.address, this.recipients, this.values);
        let balanceAfter = await Promise.all([
            this.mockERC20.balanceOf(this.wallet[0].address),
            this.mockERC20.balanceOf(this.wallet[1].address),
            this.mockERC20.balanceOf(this.wallet[Number(length) - 1].address),
        ]);
        expect(balanceBefore[0].sub(parseUnits(length, '19')).toString()).to.equal(balanceAfter[0].toString());
        expect(balanceAfter[1].toString()).to.equal(parseUnits('1', '19'));
        expect(balanceAfter[1].toString()).to.equal(parseUnits('1', '19'));
    });

    it("Send erc20 failed with approve not enough", async () => {
        await this.mockERC20.approve(this.multiSender.address, parseUnits('100','18'));
        await expect(this.multiSender.sendERC20(this.mockERC20.address, this.recipients, this.values))
            .to.be.revertedWith('ERC20: insufficient allowance');
    });

    it("Send erc20 failed with different length", async () => {
        this.recipients.pop();
        await this.mockERC20.approve(this.multiSender.address, ethers.constants.MaxUint256);
        await expect(this.multiSender.sendETH(this.recipients, this.values))
            .to.be.revertedWith('MultiSender: _recipients and _values not equal');
    });
});

describe("Test send ERC721", async () => {
    before(async () => {
        this.wallet = await ethers.getSigners();
        this.MultiSender = await ethers.getContractFactory('MultiSender');
        this.ERC721 = await ethers.getContractFactory('MockERC721');
    });

    beforeEach(async () => {
        await resetHardhat();
        this.multiSender = await this.MultiSender.deploy();
        this.mockERC721 = await this.ERC721.deploy();
        this.recipients = [];
        this.values = [];
        for (let i = 1; i < this.wallet.length; i++) {
            this.recipients.push(this.wallet[i].address);
            await this.mockERC721.safeMint(this.wallet[0].address, i);
            this.values.push(i);
        }
    });

    it("Send ERC721 successfully", async () => {
        let length = this.recipients.length.toString();
        let balanceBefore = await Promise.all([
            this.mockERC721.balanceOf(this.wallet[0].address),
            this.mockERC721.balanceOf(this.wallet[1].address),
            this.mockERC721.balanceOf(this.wallet[Number(length) - 1].address),
            this.mockERC721.ownerOf(1),
        ]);
        await this.mockERC721.setApprovalForAll(this.multiSender.address, true);
        await this.multiSender.sendERC721(this.mockERC721.address, this.recipients, this.values);
        let balanceAfter = await Promise.all([
            this.mockERC721.balanceOf(this.wallet[0].address),
            this.mockERC721.balanceOf(this.wallet[1].address),
            this.mockERC721.balanceOf(this.wallet[Number(length) - 1].address),
            this.mockERC721.ownerOf(1),
        ]);

        expect(balanceAfter[0]).to.equal('0');
        expect(balanceAfter[1]).to.equal('1');
        expect(balanceAfter[2]).to.equal('1');
        expect(balanceBefore[3]).to.equal(this.wallet[0].address);
        expect(balanceAfter[3]).to.equal(this.wallet[1].address);
    });

    it("Send erc721 failed without approval", async () => {
        await expect(this.multiSender.sendERC721(this.mockERC721.address, this.recipients, this.values))
            .to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
    });

    it("Send erc721 failed with different length", async () => {
        this.values.pop();
        await this.mockERC721.setApprovalForAll(this.multiSender.address, true);
        await expect(this.multiSender.sendERC721(this.mockERC721.address, this.recipients, this.values))
            .to.be.revertedWith('MultiSender: _recipients and _ids not equal');
    });
});

describe("Test send ERC1155", async () => {
    before(async () => {
        this.wallet = await ethers.getSigners();
        this.MultiSender = await ethers.getContractFactory('MultiSender');
        this.ERC1155 = await ethers.getContractFactory('MockERC1155');
    });

    beforeEach(async () => {
        await resetHardhat();
        this.multiSender = await this.MultiSender.deploy();
        this.mockERC1155 = await this.ERC1155.deploy();
        this.recipients = [];
        this.ids = [1,2,3,4,5]
        let startAmount = [
            parseUnits('1000000','18'),
            parseUnits('1000000','18'),
            parseUnits('1000000','18'),
            parseUnits('1000000','18'),
            parseUnits('1000000','18'),
        ];
        await this.mockERC1155.mintBatch(this.wallet[0].address, this.ids, startAmount,0x0);
        this.values = [];
        this.tokenIds = []
        for (let i = 1; i < this.wallet.length; i++) {
            this.recipients.push(this.wallet[i].address);
            this.tokenIds.push(i % 5 +1);
            this.values.push(parseUnits('100', '18'));
        }
    });

    it("Send ERC1155 successfully", async () => {
        await this.mockERC1155.setApprovalForAll(this.multiSender.address, true);
        await this.multiSender.sendERC1155(this.mockERC1155.address, this.recipients, this.tokenIds, this.values);
        let balance = await this.mockERC1155.balanceOf(this.wallet[1].address, 2);
        expect(balance.toString()).to.equal(parseUnits('100', '18'));
    });
});