import {
  Button,
  Avatar,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  HStack
} from "@chakra-ui/react";
import { useDisconnect } from "@thirdweb-dev/react";
import { useRouter } from "next/router";

type Props = {
  address:string
}

export default function WEB3LogoutButton({ address }: Props) {
  const router = useRouter();
  const disconnect = useDisconnect();
  const image = "";
  console.log(address);
  const truncatedAddress = `${address?.slice(0, 3)}...${address?.slice(-3)}`;
  const handleLogout = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.log(error);
      window.alert("error");
    }
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        bg="white"
        display={{ base: "none", md: "inline-flex" }}
        fontSize="sm"
        fontWeight={600}
      >
        <HStack>
          <Avatar size="sm" src={image} />
          <Text>{truncatedAddress}</Text>
        </HStack>
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={() => router.push("/mypage")}
          _hover={{
            bg: "primary"
          }}
        >
          Mypage
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onClick={handleLogout}
          _hover={{
            bg: "pink.300"
          }}
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
