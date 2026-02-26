import { FluidBalanceReport } from "./FluidBalanceReport";

export interface CalculatedFluidBalance {
  fluidBalances: FluidBalanceReport[];
  partialBalance: number;
  totalBalance: number;
  totalIngested: number;
  totalUrine: number;
  finalBalance: number;
}