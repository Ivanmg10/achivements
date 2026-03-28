import "./Spinner.css";

export default function Spinner({ size = 45 }: { size?: number }) {
  return <span className="loader" style={{ fontSize: size }}></span>;
}
