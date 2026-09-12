import { Navigate } from "react-router";
import { USER_PROFILE_PATH } from "@/lib/org-paths";

export function ProfilePage() {
  return <Navigate to={USER_PROFILE_PATH} replace />;
}
