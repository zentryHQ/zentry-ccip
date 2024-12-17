import hre from "hardhat";
import { Chains } from "../../config";
import { networks } from "../../config";

describe("CCIP", function () {
  it("should deploy and configure ZENT token bridge on CCIP", async function () {
    /*
    Steps:
    1. fork mainnet
    2. deploy token pool on mainnet
    2. impersonate Chainlink TokenAdminRegistry to call proposeAdministrator()
    3. accept admin role for ZENT token on mainnet
    4. link and config token pool on ZENT on mainnet
    5. fork ronin
    6. deploy ZENT on Ronin (rZENT)
    6. deploy token pool for rZENT on Ronin
    7. claim admin role of rZENT token
    8. accept admin role of rZENT token
    9. link and config token pool for rZENT on Ronin
    */
    const mainnetConfig = networks[Chains.mainnet];
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
  });
});
