"use client";

import { Navbar } from "./Navbar";
import { demoUser } from "./DemoUser";
import type { NavbarProps } from "./Navbar";

type DemoNavbarProps = Pick<NavbarProps, "followUserOnScroll" | "navVariant" | "alwaysSignedIn">;

function DemoNavbar(props: DemoNavbarProps) {
  return (
    <Navbar
      user={demoUser}
      credits={{ images: 0, songs: 0 }}
      cardBank={0}
      {...props}
    />
  );
}

export { DemoNavbar };
