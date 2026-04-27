'use client'

import { IconChevronLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function NoMainHeader() {
  const router = useRouter()

  return (
    <header className="w-[95%] m-2">
      <button onClick={() => router.back()} className="text-2xl cursor-pointer">
        <IconChevronLeft className="w-10 h-10 mt-5 mb-5" />
      </button>
    </header>
  );
}
