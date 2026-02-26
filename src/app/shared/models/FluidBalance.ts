export interface FluidBalance {
  date: Date | string | null;
  drained: number;
  infused: number;
  patientId: number;
  descriptionFluid: string;
}