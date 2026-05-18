import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying modular contracts with the account:", deployer.address);

  // Deploy WillTypeManager
  const WillTypeManager = await hre.ethers.getContractFactory("WillTypeManager");
  const willType = await WillTypeManager.deploy();
  await willType.waitForDeployment();
  console.log("WillTypeManager deployed to:", await willType.getAddress());

  // Deploy AssetManager
  const AssetManager = await hre.ethers.getContractFactory("AssetManager");
  const assetManager = await AssetManager.deploy();
  await assetManager.waitForDeployment();
  console.log("AssetManager deployed to:", await assetManager.getAddress());

  // Deploy BeneficiaryManager
  const BeneficiaryManager = await hre.ethers.getContractFactory("BeneficiaryManager");
  const beneficiaryManager = await BeneficiaryManager.deploy();
  await beneficiaryManager.waitForDeployment();
  console.log("BeneficiaryManager deployed to:", await beneficiaryManager.getAddress());

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("WillTypeManager:   ", await willType.getAddress());
  console.log("AssetManager:      ", await assetManager.getAddress());
  console.log("BeneficiaryManager:", await beneficiaryManager.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
