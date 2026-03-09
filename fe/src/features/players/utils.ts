import type { Player, PlayerSort, PositionFilter } from "../../types/player";

export function filterPlayers(players: Player[], query: string, position: PositionFilter): Player[] {
  const q = query.trim().toLowerCase();

  return players.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q);

    const matchesPos =
      position === "ALL" ? true : p.positions.includes(position);

    return matchesQuery && matchesPos;
  });
}

export function sortPlayers(players: Player[], sort: PlayerSort): Player[] {
  const copy = [...players];

  switch (sort) {
    case "value_desc":
      return copy.sort((a, b) => b.valueScore - a.valueScore);
    case "value_asc":
      return copy.sort((a, b) => a.valueScore - b.valueScore);
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return copy;
  }
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total,
    totalPages,
    page: safePage,
  };
}
