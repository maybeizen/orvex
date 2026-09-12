import { Navigate } from "react-router";
import { USER_SETTINGS_PATH } from "@/lib/org-paths";

export function ProfilePage() {
  return <Navigate to={USER_SETTINGS_PATH} replace />;
}
