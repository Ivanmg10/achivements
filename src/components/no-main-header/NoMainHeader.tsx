'use client'

import { IconChevronLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function NoMainHeader() {
  const router = useRouter()
  const { T } = useLanguage()

  return (
    <header className="w-[95%] m-2">
      <button onClick={() => router.back()} className="text-2xl cursor-pointer" aria-label={T.header.goBack}>
        <IconChevronLeft className="w-10 h-10 mt-5 mb-5" aria-hidden="true" />
      </button>
    </header>
  );
}
