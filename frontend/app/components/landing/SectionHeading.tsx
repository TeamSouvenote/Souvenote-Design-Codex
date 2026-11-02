type SectionHeadingProps = {
  id: string;
  lead: string;
  accent: string;
  sub?: string;
  align?: "center" | "start";
};

export function SectionHeading({ id, lead, accent, sub, align = "center" }: SectionHeadingProps) {
  return (
    <div className={`l-head l-head-${align}`}>
      <h2 id={id} className="l-h2">
        {lead} <span className="l-script">{accent}</span>
      </h2>
      {sub && <p className="l-sub">{sub}</p>}
    </div>
  );
}
