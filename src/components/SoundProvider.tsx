"use client";

import { bind } from "cuelume";
import { useEffect } from "react";

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bind();
  }, []);

  return <>{children}</>;
}
