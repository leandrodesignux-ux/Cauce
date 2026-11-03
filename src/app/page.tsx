import { Suspense } from "react";
import { VistaCauce } from "@/components/cauce/VistaCauce";

export default function Home() {
  return (
    <Suspense>
      <VistaCauce />
    </Suspense>
  );
}
