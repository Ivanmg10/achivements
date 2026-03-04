export default function MainPageProfile({ theme }: { theme: string }) {
  return (
    <section
      className={`col-start-1 col-end-6 row-start-4 row-end-6 main-content main-header-${theme}`}
    >
      <p>MainPageProfile</p>
    </section>
  );
}
