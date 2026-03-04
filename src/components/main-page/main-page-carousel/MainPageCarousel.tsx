import { User } from "next-auth";
import { signOut } from "next-auth/react";

type MainPageCarouselProps = {
  theme: string;
  user: User | null;
};

export default function MainPageCarousel({
  theme,
  user,
}: MainPageCarouselProps) {
  return (
    <section
      className={`col-start-1 col-end-6 row-start-1 row-end-2 main-content main-header-${theme}`}
    >
      <p>Hola {user?.name}</p>
      <button onClick={() => signOut()}>Log out</button>
    </section>
  );
}
