"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LocShareRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/share?tab=local");
  }, [router]);

  return null;
}
