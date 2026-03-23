export default function MainPageProfileSt() {
  return (
    <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
      <h2 className="text-xl">Steam</h2>
      <button className="bg-bg-card text-text-main rounded-xl p-2 w-full hover:bg-bg-main transition-all duration-300 hover:border-bg-header border-bg-main border-2 cursor-pointer">
        Iniciar sesion con Steam
      </button>
    </div>
  );
}
