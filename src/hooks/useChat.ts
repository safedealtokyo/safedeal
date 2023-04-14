/* eslint-disable consistent-return */
import * as PushAPI from "@pushprotocol/restapi";
import { useAddress, useSigner } from "@thirdweb-dev/react";
import { useState } from "react";

const useChat = () => {
  const address = useAddress();
  const signer = useSigner();
  const [pgpDecryptedPvtKey, setPgpDecryptedPvtKey] = useState();

  // Fetch user and create if user is null
  const fetchUser = async () => {
    if (address && signer) {
      let user = await PushAPI.user.get({
        account: `eip155:${address}`,
        // @ts-ignore
        env: "staging",
      });
      // ユーザーが作成されているけど公開鍵が登録されていない場合は再度権限が必要
      if (!user || !user.encryptedPrivateKey) {
        user = await PushAPI.user.create({
          account: address,
          // @ts-ignore
          env: "staging",
        });
      }
      return user;
    }
    return null;
  };

  /**
   * 署名が必要なため、一度作成したらStateで管理
   * @returns
   */
  const fetchPgpDecryptedPvtKey = async () => {
    if (pgpDecryptedPvtKey) {
      return pgpDecryptedPvtKey;
    }
    const user = await fetchUser();
    if (user) {
      const tempPgpDecryptedPvtKey = await PushAPI.chat.decryptPGPKey({
        encryptedPGPPrivateKey: user.encryptedPrivateKey,
        signer: signer as PushAPI.SignerType,
        // @ts-ignore
        env: "staging",
      });
      setPgpDecryptedPvtKey(tempPgpDecryptedPvtKey);
      return tempPgpDecryptedPvtKey;
    }
    console.log("failed fetch user");
  };

  const sendChatMessage = async (message: string, targetAddress: string) => {
    // need to decrypt the encryptedPvtKey to pass in the api using helper function
    const tempPgpDecryptedPvtKey = await fetchPgpDecryptedPvtKey();

    // actual api
    const response = await PushAPI.chat.send({
      messageContent: message,
      messageType: "Text", // can be "Text" | "Image" | "File" | "GIF"
      receiverAddress: targetAddress!,
      signer: signer as PushAPI.SignerType,
      pgpPrivateKey: tempPgpDecryptedPvtKey,
      // @ts-ignore
      env: "staging",
    });
    console.log("response", response);
  };

  const fetchListOfUserChatRequest = async (targetAddress: string) => {
    const user = await fetchUser();
    console.log(user);

    const tempPgpDecryptedPvtKey = await fetchPgpDecryptedPvtKey();
    // actual api
    const chatRequests = await PushAPI.chat.requests({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: tempPgpDecryptedPvtKey,
      // @ts-ignore
      env: "staging",
    });
    console.log(chatRequests);
    return chatRequests;
  };

  const fetchListOfUserChats = async (targetAddress: string) => {
    const user = await fetchUser();
    console.log(user);

    const tempPgpDecryptedPvtKey = await fetchPgpDecryptedPvtKey();
    // actual api
    const chatHistoryLatest = await PushAPI.chat.chats({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: tempPgpDecryptedPvtKey,
      // @ts-ignore
      env: "staging",
    });
    console.log(chatHistoryLatest);
  };

  const fetchChatConversationOfTwo = async (
    targetAddress: string,
    kind: "latest" | "history"
  ) => {
    const user = await fetchUser();
    console.log(user);

    const tempPgpDecryptedPvtKey = await fetchPgpDecryptedPvtKey();

    // conversation hash are also called link inside chat messages
    const conversationHash = await PushAPI.chat.conversationHash({
      account: `eip155:${address}`,
      conversationId: `eip155:${targetAddress}`, // receiver's address or chatId of a group
      // @ts-ignore
      env: "staging",
    });
    console.log(conversationHash);
    if (!conversationHash.threadHash) {
      console.log("No conversation history");
      return;
    }

    // actual api
    if (kind === "latest") {
      const chatHistoryLatest = await PushAPI.chat.latest({
        threadhash: conversationHash.threadHash,
        account: `eip155:${address}`,
        toDecrypt: true,
        pgpPrivateKey: tempPgpDecryptedPvtKey,
        // @ts-ignore
        env: "staging",
      });
      console.log(chatHistoryLatest);
      return chatHistoryLatest;
    }
    if (kind === "history") {
      // actual api
      const chatHistory = await PushAPI.chat.history({
        threadhash: conversationHash.threadHash,
        account: `eip155:${address}`,
        limit: 3,
        toDecrypt: true,
        pgpPrivateKey: tempPgpDecryptedPvtKey,
        // @ts-ignore
        env: "staging",
      });
      console.log(chatHistory);
      return chatHistory;
    }
  };

  const approveRequest = async (targetAddress: string) => {
    const response = await PushAPI.chat.approve({
      status: "Approved",
      account: address,
      senderAddress: targetAddress,
      // @ts-ignore
      env: "staging",
    });
    console.log(response);
  };

  return {
    sendChatMessage,
    approveRequest,
    fetchListOfUserChats,
    fetchChatConversationOfTwo,
    fetchListOfUserChatRequest,
  };
};

export default useChat;