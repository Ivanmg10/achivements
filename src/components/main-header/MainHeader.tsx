import Link from "next/link";

export default function MainHeader() {
  return (
    <header className="main-header">
      <nav className="px-3 py-6">
        <ul className="flex gap-7 justify-center">
          <li className="text-2xl">
            <Link href="/">Main</Link>
          </li>
          <li className="text-2xl">
            <Link href="/home">Home</Link>
          </li>
          <li className="text-2xl">
            <Link href="/apitest">ApiTest</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
