import { DetailPlan } from "./DetailPlan";

export interface Plan {
  id: number;
  priceId: string;
  price: number;
  name: string;
  description: string;
  details: DetailPlan[];
}