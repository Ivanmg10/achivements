export default function MainPageHot({ theme }: { theme: string }) {
  return (
    <section
      className={`col-start-4 col-end-6 row-start-2 row-end-4 main-content main-header-${theme}`}
    >
      <p>MainPageHot</p>
    </section>
  );
}
