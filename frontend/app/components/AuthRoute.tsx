import { AuthApp } from "./Auth";
import { brandFontVariables } from "../lib/brandFonts";

/** Next.js page `searchParams` prop (a Promise in Next 15). */
export type AuthSearchParams = Promise<Record<string, string | string[] | undefined>>;

type AuthRouteProps = {
  initialState: React.ComponentProps<typeof AuthApp>["initialState"];
  /** Pass for routes that read the query string (sign up, log in, reset). */
  searchParams?: AuthSearchParams;
};

// Route shell for every auth screen (sign up, log in, welcome, forgot, reset,
// verify, recover) on the berry & ivory design system. `AuthApp` renders the
// header, the <main id="main"> landmark and the footer.
//
// Query parameters are read here on the server and passed down, so the whole
// screen (headings and forms) is in the first HTML response for crawlers,
// AI answer engines and link previews, instead of appearing only after
// JavaScript runs.
export async function AuthRoute({ initialState, searchParams }: AuthRouteProps) {
  const raw = searchParams ? await searchParams : {};
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") params[key] = first;
  }

  return (
    <div className={`souv-route-page souv-auth ${brandFontVariables}`}>
      <a className="auth-skip" href="#main">Skip to content</a>
      <div className="auth-backdrop" aria-hidden="true" />
      <AuthApp initialState={initialState} params={params} />
    </div>
  );
}
