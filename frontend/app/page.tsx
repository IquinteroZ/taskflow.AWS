import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function RootPage() {
  const token = cookies().get("taskflow_token");
  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/auth/login");
  }
}
