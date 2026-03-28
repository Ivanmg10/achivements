import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function NoMainHeader() {
  return (
    <header className="w-[95%] m-2">
      <Link href="/" className="text-2xl">
        <IconChevronLeft className="w-10 h-10 mt-5 mb-5" />
      </Link>
    </header>
  );
}
