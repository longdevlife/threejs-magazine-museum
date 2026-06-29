const atlas = {
  player: 'player',
} as const;

const image = {
  opportunityAiSkill: 'opportunity-ai-skill',
  opportunityLoyalCustomer: 'opportunity-loyal-customer',
  opportunityNiche: 'opportunity-niche',
  opportunityOrder: 'opportunity-order',
  opportunityReview: 'opportunity-review',
  spaceman: 'spaceman',
  tuxemon: 'tuxemon',
} as const;

const scene = {
  boot: 'boot',
  main: 'main',
  menu: 'menu',
} as const;

const tilemap = {
  tuxemon: 'tuxemon',
} as const;

export const key = {
  atlas,
  image,
  scene,
  tilemap,
} as const;
