"use client";

import Link from "next/link";
import { useAuth } from "../AuthProvider";

// Ways back from the not-found page. Signed-in customers go to /home and also
// get Create a Card and Saved Cards & Songs; everyone else goes to `/`.
export function NotFoundActions() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  return (
    <div className="nf-actions">
      <Link className="l-btn l-btn-primary" href={signedIn ? "/home" : "/"}>Go to Home</Link>
      <nav aria-label="Other pages">
        <ul className="nf-links">
          {signedIn && <li><Link href="/create">Create a Card</Link></li>}
          {signedIn && <li><Link href="/create/my-cards-and-songs">Saved Cards &amp; Songs</Link></li>}
          <li><Link href="/faq">FAQ</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </nav>
    </div>
  );
}
