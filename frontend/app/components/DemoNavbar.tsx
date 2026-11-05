"use client";

import { Navbar } from "./Navbar";
import { demoUser } from "./DemoUser";
import { useAuth } from "./AuthProvider";
import type { NavbarProps } from "./Navbar";

type DemoNavbarProps = Pick<NavbarProps, "followUserOnScroll" | "navVariant" | "alwaysSignedIn"> & {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  variant?: string;
};

function DemoNavbar(props: DemoNavbarProps) {
  const auth = useAuth();

  return (
    <Navbar
      loggedIn={auth.status === "authenticated"}
      user={demoUser}
      credits={{ images: 0, songs: 0 }}
      cardBank={0}
      {...props}
    />
  );
}

export { DemoNavbar };
