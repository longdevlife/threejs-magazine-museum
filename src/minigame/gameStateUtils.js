export const VALID_GAME_STATUSES = new Set([
  "waiting",
  "phase_1",
  "situation_1",
  "phase_2",
  "situation_2",
  "phase_3",
  "finished",
]);

export const isValidGameStatus = (status) => VALID_GAME_STATUSES.has(status);

export const normalizeGameState = (gameState) => {
  if (!gameState || !isValidGameStatus(gameState.status)) {
    return { status: "waiting" };
  }
  return gameState;
};

export const applyPlayerDelta = (player, delta) => {
  if (!player) return player;

  const nextScore = Math.max(0, (player.score || 0) + (delta.score || 0));
  const nextCapital = Math.max(0, (player.capital || 0) + (delta.capital || 0));

  return {
    ...player,
    score: nextScore,
    capital: nextCapital,
    isBankrupt: Boolean(player.isBankrupt) || nextCapital <= 0,
  };
};
