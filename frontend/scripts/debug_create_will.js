import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  console.log("Debugging with deployer address:", signer.address);

  const artifactPath = "./artifacts/contracts/WillSys.sol/WillSys.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  console.log("Deploying WillSys...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Deployed at:", address);

  const formattedHash = ethers.zeroPadValue("0x1234", 32);
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
    oracleAddress: ethers.ZeroAddress,
    witnesses: [],
    requiredWitnesses: 0n,
    disputeWindow: 1209600n
  };

  console.log("Calling createWill...");
  try {
    const nonce = await signer.getNonce();
    console.log("Using Nonce:", nonce);
    const tx = await contract.createWill(
      "Simple Will",
      [formattedHash],
      contractAssets,
      contractTrigger,
      { nonce }
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
