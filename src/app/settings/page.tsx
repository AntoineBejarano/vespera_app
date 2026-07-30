import { auth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import SettingsClient from "./SettingsClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <AppNav email={session.user.email} />
      <SettingsClient />
    </>
  );
}
