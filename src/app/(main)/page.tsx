import MainPage from "@/components/main-page/MainPage";
// import MainSidePanel from "@/components/main-side-panel/MainSidePanel";

export default function Home() {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-bg-main text-text-main">
      {/* <MainSidePanel /> */}
      <MainPage />
    </div>
  );
}
