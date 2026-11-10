import { permanentRedirect } from "next/navigation";

// Old address for Saved Cards & Songs: one canonical page. Permanent (308), since
// the move is for good (audit E11).
export default function MyCardsAlias() {
  permanentRedirect("/create/my-cards-and-songs");
}
