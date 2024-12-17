import hre from "hardhat";

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

    const zentTokenAddress = "0xdbb7a34bf10169d6d2d0d02a6cbb436cf4381bfa";

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
  });
});
