const hre = require("hardhat");

async function main() {
  console.log("Compiling and running the DigitalWill smart contract locally...");
  
  // Deploy the contract
  const DigitalWill = await hre.ethers.getContractFactory("DigitalWill");
  const inactivityPeriod = 365 * 24 * 60 * 60; // 1 year
  const willType = 7; // PourOver Will (Enum index 7)
  
  const will = await DigitalWill.deploy(inactivityPeriod, willType);
  await will.waitForDeployment();

  console.log("\n==============================");
  console.log("✅ DigitalWill Successfully Deployed!");
  console.log("==============================");
  console.log(`📌 Contract Address: ${await will.getAddress()}`);
  console.log(`👤 Owner Address:    ${await will.owner()}`);
  console.log(`⏱️  Inactivity (sec): ${await will.inactivityPeriod()}`);
  
  // Enum values: 0=Simple, 1=TestamentaryTrust, ..., 7=PourOver, etc
  const deployedWillType = await will.currentWillType();
  const willTypeNames = ["Simple", "TestamentaryTrust", "Joint", "Mutual", "Living", "Holographic", "Oral", "PourOver", "Privileged", "Unprivileged"];
  console.log(`📄 Will Type Saved:  ${willTypeNames[deployedWillType]} (${deployedWillType})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
