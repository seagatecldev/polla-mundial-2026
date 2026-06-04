// Lógica de puntos — debe coincidir EXACTAMENTE con la función SQL public.compute_points
//   3 = marcador exacto
//   1 = ganador correcto (o empate correcto)
//   0 = fallo

export type ScoringType = "exact" | "correct_winner" | "correct_draw" | "wrong";

export type ScoringResult = {
  points: number;
  type: ScoringType;
};

export function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): ScoringResult {
  if (predHome === realHome && predAway === realAway) {
    return { points: 3, type: "exact" };
  }

  const predWinner = Math.sign(predHome - predAway); // -1, 0, 1
  const realWinner = Math.sign(realHome - realAway);

  if (predWinner === realWinner) {
    return {
      points: 1,
      type: predWinner === 0 ? "correct_draw" : "correct_winner",
    };
  }

  return { points: 0, type: "wrong" };
}
