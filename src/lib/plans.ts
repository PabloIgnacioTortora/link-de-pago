export type Plan = 'free' | 'pro';

export const PLAN_LIMITS = {
  free: {
    maxActiveLinks: 2,
    customBranding: false,
    qrCode: false,
    stats: false,
    emailNotifications: false,
  },
  pro: {
    maxActiveLinks: Infinity,
    customBranding: true,
    qrCode: true,
    stats: true,
    emailNotifications: true,
  },
} as const;

export const PRO_PRICE_ARS = 15000;

export function canUseFeature(plan: Plan | undefined, feature: keyof typeof PLAN_LIMITS.free): boolean {
  return PLAN_LIMITS[plan ?? 'free'][feature] as boolean;
}

export function isPro(plan: Plan | undefined): boolean {
  return plan === 'pro';
}
