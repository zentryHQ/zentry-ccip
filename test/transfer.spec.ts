import { expect } from "chai";
import hre from "hardhat";
import { id, AbiCoder } from "ethers";
import {
  getEvm2EvmMessage,
  routeMessage,
} from "@chainlink/local/scripts/CCIPLocalSimulatorFork";
import {
  BurnMintERC677Helper,
  IRouterClient,
  IRouterClient__factory,
} from "../typechain-types";

describe("ZENT transfer", function () {
  it("should transfer ZENT token from Sepolia to Saigon", async function () {
    const [alice, bob] = await hre.ethers.getSigners();

    const sepoliaZentAddress = "0x980EE5c8Cb99ae65F844120a9c385b6124B982Ac";
    const roninSaigonZentAddress = "0xB7E3288bce43E807DEC3b7667351F45B1b677503";
    const roninSaigonChainSelector = "13116810400804392105";
    const sepoliaRouterAddress = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
    const roninSaigonRouterAddress =
      "0x0aCAe4e51D3DA12Dd3F45A66e8b660f740e6b820";

    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL,
          },
        },
      ],
    });

    // Estimate gas fees dynamically - Useful in a forked environment
    const feeData = await hre.ethers.provider.getFeeData();
    const sourceOverrides = {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
    console.log(sourceOverrides);

    const sepoliaRouter = IRouterClient__factory.connect(
      sepoliaRouterAddress,
      alice
    ) as IRouterClient;

    const zentFactory = await hre.ethers.getContractFactory(
      "BurnMintERC677Helper"
    );
    const sepoliaZent = zentFactory.attach("") as BurnMintERC677Helper;

    await sepoliaZent.connect(alice).drip(alice.address, sourceOverrides);
    const amountToSend = 100n;

    await sepoliaZent
      .connect(alice)
      .approve(sepoliaRouterAddress, amountToSend);

    const tokenAmounts = [
      {
        token: sepoliaZentAddress,
        amount: amountToSend,
      },
    ];

    const gasLimit = 0;

    const functionSelector = id("CCIP EVMExtraArgsV1").slice(0, 10);
    const defaultAbiCoder = AbiCoder.defaultAbiCoder();
    const extraArgs = defaultAbiCoder.encode(["uint256"], [gasLimit]);
    const encodedExtraArgs = `${functionSelector}${extraArgs.slice(2)}`;

    const message = {
      receiver: defaultAbiCoder.encode(["address"], [bob.address]),
      data: defaultAbiCoder.encode(["string"], [""]), // no data
      tokenAmounts: tokenAmounts,
      feeToken: "0x0000000000000000000000000000000000000000",
      extraArgs: encodedExtraArgs,
    };

    const aliceBalanceBefore = await sepoliaZent.balanceOf(alice.address);

    const tx = await sepoliaRouter
      .connect(alice)
      .ccipSend(roninSaigonChainSelector, message, sourceOverrides);

    const receipt = await tx.wait();
    if (!receipt) throw Error("Transaction not included in the block");

    const evm2EvmMessage = getEvm2EvmMessage(receipt);

    if (!evm2EvmMessage) throw Error("EVM2EVM message not found");

    expect(await sepoliaZent.balanceOf(alice.address)).to.deep.equal(
      aliceBalanceBefore - amountToSend
    );

    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RONIN_SAIGON_RPC_URL,
          },
        },
      ],
    });

    await routeMessage(roninSaigonRouterAddress, evm2EvmMessage);

    const destinationBnM = zentFactory.attach(
      roninSaigonZentAddress
    ) as BurnMintERC677Helper;

    expect(await destinationBnM.balanceOf(bob.address)).to.deep.equal(
      amountToSend
    );
  });
});
