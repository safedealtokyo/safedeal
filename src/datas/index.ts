import { NavItem } from "@/types/NavItem";

const NAV_ITEMS: NavItem[] = [
  {
    label: "Deals",
    href: "/deal"
  },
  {
    label: "MyPage",
    href: "#",
    children: [
      {
        label: "Profile",
        href: "#",
        subLabel: "Software development"
      }
    ]
  }
];
export default NAV_ITEMS;
