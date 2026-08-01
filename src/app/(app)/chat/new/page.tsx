import { redirect } from "next/navigation";

export default function LegacyNewCharacterPage() {
  redirect("/personas/new");
}
