/* eslint-disable react/jsx-curly-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable no-else-return */
import {
  Button,
  Container,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useAddress, useSigner } from "@thirdweb-dev/react";
import { useState } from "react";

import { Huddle } from "@/components/Huddle";
import useChat from "@/hooks/useChat";

export default function Home() {
  const address = useAddress();

  // const receiverAddress = "0x27D4C8C7C8925c0718FF9f46Daaf7a27f2d8A282";
  const [typemessage, setTypemessage] = useState<string>();

  const [targetAddress, setTargetAddress] = useState<string>();
  const [approveAddress, setApproveAddress] = useState<string>();
  const {
    fetchListOfUserChatRequest,
    fetchChatConversationOfTwo,
    sendChatMessage,
    approveRequest,
  } = useChat();

  return (
    <Container mt="60px">
      <Text>
        Address:
        {address}
      </Text>

      <VStack>
        <Text>Send Chat</Text>
        <Input
          type="text"
          placeholder="Target Address"
          onChange={(e) => setTargetAddress(e.target.value)}
        />
        <Input
          placeholder="messaeg to send..."
          onChange={(e) => setTypemessage(e.target.value)}
        />
        <HStack>
          <Button
            onClick={async () => {
              const requests = await fetchListOfUserChatRequest(targetAddress!);
              if (requests.length > 0) {
                setApproveAddress(requests[0].wallets.replace("eip155:", ""));
              }
            }}
          >
            Fetch Request
          </Button>
          <Button
            onClick={() => fetchChatConversationOfTwo(targetAddress!, "latest")}
          >
            Fetch Conversation (latest)
          </Button>
          <Button
            onClick={() =>
              fetchChatConversationOfTwo(targetAddress!, "history")
            }
          >
            Fetch Conversation (history)
          </Button>
          <Button onClick={() => sendChatMessage(typemessage!, targetAddress!)}>
            Send
          </Button>
        </HStack>
      </VStack>
      <VStack>
        <Text>Approve Request</Text>
        <Input
          placeholder="approve request address"
          // onChange={(e) => setApproveAddress(e.target.value)}
          value={approveAddress}
        />
        <Button onClick={() => approveRequest(approveAddress!)}>Approve</Button>
      </VStack>
      <VStack mt="50px">
        <Text fontSize="2xl" fontWeight="bold">
          Huddle
        </Text>
        <Huddle />
      </VStack>
    </Container>
  );
}