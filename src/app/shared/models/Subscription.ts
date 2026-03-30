import { Plan } from "./Plan";

export interface Subscription {
  userId: number;
  priceId: string;
  endPeriodDate: Date;
  startPeriodDate: Date;
  status: string;
  plan: Plan;
}