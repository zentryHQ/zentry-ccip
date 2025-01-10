import hre from "hardhat";
import { Chains } from "../../config";
import { networks } from "../../config";
import { BurnMintERC677 } from "../../typechain-types";

describe("CCIP", function () {
  it("should deploy and configure ZENT token bridge on CCIP", async function () {
    /*
     * Ethereum Mainnet:
     * 1. Fork Ethereum Mainnet
     * 2. Deploy CCIP TokenPool contract
     * 3. Impersonate Chainlink TokenAdminRegistry to propose administrator
     * 4. Accept admin role for ZENT token
     * 5. Link and configure TokenPool for ZENT
     *
     * Ronin Network:
     * 6. Fork Ronin Mainnet
     * 7. Deploy BurnMintERC776 contract
     * 8. Deploy TokenPool for ZENT
     * 9. Claim and accept admin role for ZENT token
     * 10. Link and configure TokenPool for ZENT
     *
     */
    const mainnetConfig = networks[Chains.mainnet];
    const roninConfig = networks[Chains.ronin];
    const [signer] = await hre.ethers.getSigners();

    const zentTokenAddress = "0xdbb7a34bf10169d6d2d0d02a6cbb436cf4381bfa";
    // Check if network is defined in config
    if (!mainnetConfig) {
      throw new Error(`Network ${Chains.mainnet} not found in config`);
    }

    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MAINNET_RPC_URL,
          },
        },
      ],
    });

    // run task to deploy token pool on mainnet
    const mainnetPoolAddress = await hre.run("deployTokenPool", {
      tokenaddress: zentTokenAddress,
      pooltype: "lockRelease",
      acceptliquidity: true,
      router: mainnetConfig.router,
      rmnproxy: mainnetConfig.rmnProxy,
    });

    console.log("Mainnet Pool Address", mainnetPoolAddress);

    const chainlinkOwnerAddress = "0x44835bBBA9D40DEDa9b64858095EcFB2693c9449";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [chainlinkOwnerAddress],
    });
    const chainlinkOwner = await hre.ethers.getSigner(chainlinkOwnerAddress);

    const { TokenAdminRegistry__factory } = await import(
      "../../typechain-types"
    );
    let tokenAdminRegistry = TokenAdminRegistry__factory.connect(
      mainnetConfig.tokenAdminRegistry,
      chainlinkOwner
    );

    await signer.sendTransaction({
      to: chainlinkOwnerAddress,
      value: hre.ethers.parseEther("1"),
    });

    let tx = await tokenAdminRegistry.proposeAdministrator(
      zentTokenAddress,
      signer.address
    );
    await tx.wait();
    console.log("Chainlink owner propose singer as ZENT token admin", tx.hash);

    // accept admin role
    tokenAdminRegistry = TokenAdminRegistry__factory.connect(
      mainnetConfig.tokenAdminRegistry,
      signer
    );
    tx = await tokenAdminRegistry.acceptAdminRole(zentTokenAddress);
    await tx.wait();
    console.log("Signer accept admin role tx", tx.hash);

    // check if signer is the admin of ZENT token
    const isAdmin = await tokenAdminRegistry.isAdministrator(
      zentTokenAddress,
      signer.address
    );
    console.log("Signer is the admin of ZENT token", isAdmin);

    // set CCIP token pool for ZENT mainnet
    tx = await tokenAdminRegistry.setPool(zentTokenAddress, mainnetPoolAddress);
    await tx.wait();
    console.log("Set CCIP token pool in mainnet", tx.hash);

    // fork ronin
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RONIN_ARCHIVE_RPC_URL,
          },
        },
      ],
    });

    // deploy ZENT as BurnMintERC677 on Ronin
    const { BurnMintERC677__factory } = await import("../../typechain-types");
    const TokenFactory = new BurnMintERC677__factory(signer);

    // Deploy the token contract with name, symbol, decimals, and maximum supply
    const rZENT = (await TokenFactory.deploy(
      "Zentry",
      "rZENT",
      18,
      0
    )) as BurnMintERC677;
    const rZENTAddress = await rZENT.getAddress();

    console.log("Deployed rZENT on Ronin", rZENTAddress);

    // run task to deploy token pool on ronin
    const roninPoolAddress = await hre.run("deployTokenPool", {
      tokenaddress: rZENTAddress,
      pooltype: "burnMint",
      acceptliquidity: true,
      router: roninConfig?.router,
      rmnproxy: roninConfig?.rmnProxy,
    });

    console.log("Ronin Pool Address", roninPoolAddress);
  });
});
