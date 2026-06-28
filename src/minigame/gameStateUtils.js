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

export const applyPhaseOneGate = (player) => {
  if (!player) return player;

  const orders = Number(player.progress?.phase_1?.order) || 0;

  if (orders < 3) {
    return {
      ...player,
      capital: 0,
      isBankrupt: true,
      eliminatedReason: "Không đạt tối thiểu 3 đơn hàng ở Phase 1",
      phaseOneQualified: false,
    };
  }

  if (orders >= 5 && !player.phaseOneBonusApplied) {
    return {
      ...player,
      score: (player.score || 0) + 50,
      capital: (player.capital || 0) + 1_000_000,
      isBankrupt: Boolean(player.isBankrupt),
      phaseOneQualified: true,
      phaseOneBonusApplied: true,
    };
  }

  return {
    ...player,
    isBankrupt: Boolean(player.isBankrupt),
    phaseOneQualified: false,
  };
};
