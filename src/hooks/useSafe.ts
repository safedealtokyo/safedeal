/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable consistent-return */
import SafeApiKit from "@safe-global/api-kit";
import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@safe-global/protocol-kit";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";
import { useAddress, useSigner } from "@thirdweb-dev/react";
import axios from "axios";
import { ethers, BigNumber } from "ethers";
import { useState } from "react";

const useSafe = () => {
  const address = useAddress();
  const signer = useSigner();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Base hooks
  const fetchSafeService = () => {
    try {
      setIsLoading(true);
      if (signer) {
        const ethAdapterOwner1 = new EthersAdapter({
          ethers,
          signerOrProvider: signer,
        });
        const txServiceUrl = "https://safe-transaction-goerli.safe.global";
        const safeService = new SafeApiKit({
          txServiceUrl,
          ethAdapter: ethAdapterOwner1,
        });
        return safeService;
      }
    } finally {
      setIsLoading(false);
    }
  };
  // const fetchSafe = async () => {
  //   const safeService = fetchSafeService();
  //   if (address && safeService) {
  //     const safe = await safeService.getSafesByOwner(address);
  //     return safe.safes[0];
  //   }
  // };
  const fetchSafeSDK = async (safeAddress: string) => {
    if (signer) {
      const ethAdapterOwner1 = new EthersAdapter({
        ethers,
        signerOrProvider: signer,
      });
      // const safeAddress = await fetchSafe();
      const safeSdk = await Safe.create({
        ethAdapter: ethAdapterOwner1,
        safeAddress: safeAddress!,
      });
      return safeSdk;
    }
  };

  // Create safe multisig contract for deposit.
  const deploySafe = async (
    dealId: string,
    workerAddress: string,
    depositEthAmount: string
  ) => {
    try {
      setIsLoading(true);
      if (signer) {
        const ethAdapterOwner1 = new EthersAdapter({
          ethers,
          signerOrProvider: signer,
        });

        //   Initialize the Protcol Kit
        const safeFactory = await SafeFactory.create({
          ethAdapter: ethAdapterOwner1,
        });

        // Set Owners
        const safeAccountConfig: SafeAccountConfig = {
          owners: [
            address as string,
            workerAddress,
            process.env.NEXT_PUBLIC_OWNER_ADDRESS!, // Owner Address
          ],
          threshold: 2,
        };
        const safeSdkOwner1 = await safeFactory.deploySafe({
          safeAccountConfig,
        });

        const safeAddress = safeSdkOwner1.getAddress();
        console.log("Your Safe has been deployed:");
        console.log(`https://goerli.etherscan.io/address/${safeAddress}`);
        console.log(`https://app.safe.global/gor:${safeAddress}`);
        const result = await axios.put("/api/deal/update", {
          safeAddress,
          dealId,
        });
        await sendEthToSafe(safeAddress, depositEthAmount);
      } else {
        alert("Wallet not connected");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const proposeTransaction = async (safeAddress: string) => {
    try {
      setIsLoading(true);
      // Any address can be used. In this example you will use vitalik.eth
      // TODO 取得するコントラクトアカウントの指定
      const safeSdk = await fetchSafeSDK(safeAddress);
      // Any address can be used. In this example you will use vitalik.eth
      const destination = address;
      const amount = ethers.utils
        .parseUnits(
          String(
            ethers.utils.formatEther((await safeSdk?.getBalance()) as BigNumber)
          ),
          "ether"
        )
        .toString();
      const safeService = fetchSafeService();
      const safeTransactionData: SafeTransactionDataPartial = {
        to: destination!,
        data: "0x",
        value: amount,
      };

      if (signer && address && safeService && safeSdk) {
        // Create a Safe transaction with the provided parameters
        const safeTransaction = await safeSdk.createTransaction({
          safeTransactionData,
        });

        // Deterministic hash based on transaction parameters
        const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);

        // Sign transaction to verify that the transaction is coming from owner 1
        const senderSignature = await safeSdk.signTransactionHash(safeTxHash);
        // const safeAddress = await fetchSafe();
        await safeService.proposeTransaction({
          safeAddress: safeAddress!,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: address,
          senderSignature: senderSignature.data,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // fetch pending transaction hash
  const fetchPendingTransactionHash = async (safeAddress: string) => {
    const safeService = fetchSafeService();
    // const safeAddress = await fetchSafe();
    if (safeService && signer && safeAddress) {
      const pendingTransactions = await safeService.getPendingTransactions(
        safeAddress
      );
      // Assumes that the first pending transaction is the transaction you want to confirm
      const transaction = pendingTransactions.results[0];
      if (transaction) {
        const { safeTxHash } = transaction;
        return safeTxHash;
      }
    }
  };

  // Confirm proposed transaction
  const confirmTransaction = async (safeAddress: string) => {
    try {
      setIsLoading(true);
      const safeService = fetchSafeService();
      // const safeAddress = await fetchSafe();
      const safeTxHash = await fetchPendingTransactionHash(safeAddress);
      if (safeService && signer && safeTxHash && safeAddress) {
        const ethAdapterOwner = new EthersAdapter({
          ethers,
          signerOrProvider: signer,
        });

        const safeSdkOwner = await Safe.create({
          ethAdapter: ethAdapterOwner,
          safeAddress,
        });

        const signature = await safeSdkOwner.signTransactionHash(safeTxHash);
        await safeService.confirmTransaction(safeTxHash, signature.data);
        await executeTransaction(safeAddress);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Execute transaction for already confirmed 2 owners
  const executeTransaction = async (safeAddress: string) => {
    const safeService = fetchSafeService();
    const safeSdk = await fetchSafeSDK(safeAddress);
    const safeTxHash = await fetchPendingTransactionHash(safeAddress);
    if (safeService && safeSdk && safeTxHash) {
      const safeTransaction = await safeService.getTransaction(safeTxHash);
      const executeTxResponse = await safeSdk.executeTransaction(
        safeTransaction
      );
      const receipt = await executeTxResponse.transactionResponse?.wait();

      if (receipt) {
        console.log(
          `https://goerli.etherscan.io/tx/${receipt.transactionHash}`
        );
      } else {
        console.log("failed");
      }
    }
  };

  // Deposit ether to safe address.
  const sendEthToSafe = async (
    safeAddress: string,
    depositEthAmount: string
  ) => {
    try {
      setIsLoading(true);
      if (signer) {
        const safeAmount = ethers.utils
          .parseUnits(depositEthAmount, "ether")
          .toHexString();

        const transactionParameters = {
          to: safeAddress,
          value: safeAmount,
        };

        const tx = await signer.sendTransaction(transactionParameters);

        console.log("Fundraising.");
        console.log(
          `Deposit Transaction: https://goerli.etherscan.io/tx/${tx.hash}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    deploySafe,
    proposeTransaction,
    confirmTransaction,
    executeTransaction,
    // rejectTransaction,
    fetchPendingTransactionHash,
  };
};

export default useSafe;
