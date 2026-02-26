export interface FluidBalanceReport {
  date: Date | string | null;
  drained: number;
  infused: number;
  patientId: number;
  descriptionFluid: string;
  ultrafiltration: number;
}