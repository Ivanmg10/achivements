import Link from "next/link";

export default function MainPageProfileSt() {
  return (
    <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
      <h2 className="text-xl p-1">Steam</h2>
      <Link
        href="/user"
        className="w-full text-left bg-bg-card p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500"
      >
        Iniciar sesion con Steam
      </Link>
    </div>
  );
}
