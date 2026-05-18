import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
console.log("HRE KEYS:", Object.keys(hre));

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying WillSys with the account:", deployer.address);

  const WillSys = await hre.ethers.getContractFactory("WillSys");
  const willSys = await WillSys.deploy();

  await willSys.waitForDeployment();

  console.log("WillSys deployed to:", await willSys.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
