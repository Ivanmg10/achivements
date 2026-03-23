import { useTheme } from "@/context/ThemeContext";

export default function UserTheme() {
  const { setTheme } = useTheme();

  return (
    <article className="p-5 flex flex-col gap-5 items-center justify-center bg-bg-card rounded-3xl p-5 ">
      <h1 className="text-2xl w-full">Background Color</h1>
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          onClick={() => setTheme("red")}
          className="button-red py-5 px-4 rounded"
        ></button>
        <button
          onClick={() => setTheme("blue")}
          className="button-blue text-white font-bold py-5 px-4 rounded"
        ></button>
        <button
          onClick={() => setTheme("yellow")}
          className="button-yellow  font-bold py-5 px-4 rounded"
        ></button>
        <button
          onClick={() => setTheme("green")}
          className="button-green  font-bold py-5 px-4 rounded"
        ></button>
        <button
          onClick={() => setTheme("purple")}
          className="button-purple font-bold py-5 px-4 rounded"
        ></button>
        <button
          onClick={() => setTheme("brown")}
          className="button-brown font-bold py-5 px-4 rounded"
        ></button>
        <button
          onClick={() => setTheme("dark")}
          className="button-dark font-bold py-5 px-4 rounded"
        ></button>
      </div>

      <button className="bg-bg-main text-white p-2 rounded-3xl w-full">
        <p>Guardar cambios</p>
      </button>
    </article>
  );
}
