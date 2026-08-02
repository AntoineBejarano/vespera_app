import { Suspense } from "react";
import SettingsClient from "./SettingsClient";
import { PageSpinner } from "@/components/Spinner";

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading settings" />}>
      <SettingsClient />
    </Suspense>
  );
}
