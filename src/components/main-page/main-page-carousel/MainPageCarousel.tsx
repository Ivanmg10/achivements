export default function MainPageCarousel({ theme }: { theme: string }) {
  return (
    <section
      className={`col-start-1 col-end-6 row-start-1 row-end-2 main-content main-header-${theme}`}
    >
      <p>MainPageCarousel</p>
    </section>
  );
}
