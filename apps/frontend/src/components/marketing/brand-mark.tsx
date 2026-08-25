import { Activity } from "lucide-react";
import { Link } from "react-router";

export function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <Activity className="size-5 text-primary" />
      <span className="font-heading text-sm font-medium">Orvex Monitor</span>
    </Link>
  );
}
