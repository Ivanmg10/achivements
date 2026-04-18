import { render, screen } from "@testing-library/react";
import GameInfoAchivement from "./GameInfoAchivement";

const mockAchievement = {
  ID: 1,
  Title: "First Blood",
  Description: "Kill an enemy",
  BadgeName: "badge123",
  Points: 10,
  TrueRatio: 15,
  NumAwarded: 500,
  NumAwardedHardcore: 100,
  DateEarned: "2024-01-15 10:00:00",
  DateEarnedHardcore: null,
  Author: "Author1",
  AuthorULID: "ulid",
  DateModified: "2023-01-01",
  DateCreated: "2022-01-01",
  DisplayOrder: 1,
  MemAddr: "0x0000",
  Type: null,
};

test("renders achievement with earned date", () => {
  const { container } = render(
    <table>
      <tbody>
        <GameInfoAchivement achievement={mockAchievement} />
      </tbody>
    </table>,
  );
  expect(screen.getByText("First Blood")).toBeInTheDocument();
  expect(screen.getByText("Kill an enemy")).toBeInTheDocument();
  expect(screen.getByText("10 pts")).toBeInTheDocument();
});

test("renders achievement without earned date shows dash", () => {
  render(
    <table>
      <tbody>
        <GameInfoAchivement achievement={{ ...mockAchievement, DateEarned: null }} />
      </tbody>
    </table>,
  );
  expect(screen.getByText("-")).toBeInTheDocument();
});

test("renders nothing when no achievement", () => {
  const { container } = render(
    <table>
      <tbody>
        <GameInfoAchivement />
      </tbody>
    </table>,
  );
  expect(container.querySelector("tr")).toBeNull();
});
