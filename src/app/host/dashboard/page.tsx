import { redirect } from "next/navigation";

export default async function HostDashboardRedirect() {
  redirect("/host/requests");
}
