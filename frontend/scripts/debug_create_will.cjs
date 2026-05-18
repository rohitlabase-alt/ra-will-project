const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Debugging with deployer address:", deployer.address);

  // Load the WillSys contract artifact from WillSys.sol
  const WillSys = await hre.ethers.getContractFactory("contracts/WillSys.sol:WillSys");
  console.log("Deploying WillSys...");
  const willSys = await WillSys.deploy();
  await willSys.waitForDeployment();
  const address = await willSys.getAddress();
  console.log("Deployed at:", address);

  // Format arguments exactly like the frontend
  const formattedHash = hre.ethers.zeroPadValue("0x1234", 32);
  const contractAssets = [
    {
      name: "Ethereum (ETH)",
      contractAddress: "0x71C344A86C722CB8C6339185672054D132D53E12",
      amountOrId: 0n,
      assetType: 0
    }
  ];

  const contractTrigger = {
    inactivityPeriod: 31536000n,
    oracleAddress: hre.ethers.ZeroAddress,
    witnesses: [],
    requiredWitnesses: 0n,
    disputeWindow: 1209600n
  };

  console.log("Calling createWill...");
  try {
    const tx = await willSys.createWill(
      "Simple Will",
      [formattedHash],
      contractAssets,
      contractTrigger
    );
    console.log("Waiting for transaction...");
    const receipt = await tx.wait();
    console.log("Success! Receipt status:", receipt.status);
  } catch (error) {
    console.error("Revert Error Details:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
