import { redirect } from "next/navigation";

// The Welcome modal now opens over the signed-in Home page. This route stays
// so existing links and the post-sign-up returnTo default keep working.
export default function WelcomePage() {
  redirect("/home?welcome=1");
}
