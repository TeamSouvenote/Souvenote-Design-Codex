
// Shared primitives for the Souvenote UI.

type OrnamentDividerProps = {
  className?: string;
};

function OrnamentDivider({ className = "" }: OrnamentDividerProps) {
  return (
    <div className={`souv-orn ${className}`}>
      <span className="r" /><span className="d" /><span className="r" />
    </div>
  );
}

export { OrnamentDivider };
