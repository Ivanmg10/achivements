import MainPage from "@/components/main-page/MainPage";
import MainSidePanel from "@/components/main-side-panel/MainSidePanel";

export default function Home() {
  return (
    <div className="flex-1 min-h-0 bg-bg-main text-text-main grid grid-cols-[300px_1fr]">
      <MainSidePanel />
      <MainPage />
    </div>
  );
}
