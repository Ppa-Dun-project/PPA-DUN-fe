import type { Player } from "../../types/player";

export const mockPlayers: Player[] = [
  { id: "p1", name: "Aaron Judge", team: "NYY", positions: ["OF"], valueScore: 98.2 },
  { id: "p2", name: "Mookie Betts", team: "LAD", positions: ["2B", "OF"], valueScore: 95.4 },
  { id: "p3", name: "Shohei Ohtani", team: "LAD", positions: ["DH"], valueScore: 94.7 },
  { id: "p4", name: "Gerrit Cole", team: "NYY", positions: ["P"], valueScore: 92.1 },
  { id: "p5", name: "Ronald Acuña Jr.", team: "ATL", positions: ["OF"], valueScore: 93.3 },
  { id: "p6", name: "Juan Soto", team: "NYY", positions: ["OF"], valueScore: 91.9 },
  { id: "p7", name: "Corey Seager", team: "TEX", positions: ["SS"], valueScore: 90.4 },
  { id: "p8", name: "José Ramírez", team: "CLE", positions: ["3B"], valueScore: 89.8 },
  { id: "p9", name: "Freddie Freeman", team: "LAD", positions: ["1B"], valueScore: 88.9 },
  { id: "p10", name: "Spencer Strider", team: "ATL", positions: ["P"], valueScore: 88.1 },
  { id: "p11", name: "Ozzie Albies", team: "ATL", positions: ["2B"], valueScore: 84.3 },
  { id: "p12", name: "Adley Rutschman", team: "BAL", positions: ["C"], valueScore: 83.7 },
  { id: "p13", name: "Fernando Tatis Jr.", team: "SD", positions: ["OF"], valueScore: 87.2 },
  { id: "p14", name: "Bryce Harper", team: "PHI", positions: ["1B"], valueScore: 86.6 },
  { id: "p15", name: "Trea Turner", team: "PHI", positions: ["SS"], valueScore: 85.9 },
];

export const positionsForFilter = ["ALL", "C", "1B", "2B", "3B", "SS", "OF", "P", "DH"] as const;
export type PositionFilter = typeof positionsForFilter[number];