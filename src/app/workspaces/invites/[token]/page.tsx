import { getAppUser } from "@/lib/session";
import { AppNav } from "@/components/AppNav";
import { redirect } from "next/navigation";
import { AcceptInviteClient } from "./AcceptInviteClient";

type Props = { params: Promise<{ token: string }> };

export default async function AcceptInvitePage({ params }: Props) {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  const { token } = await params;

  return (
    <>
      <AppNav email={user.email} />
      <AcceptInviteClient token={token} />
    </>
  );
}
