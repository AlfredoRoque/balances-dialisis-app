import { VitalSign } from "./VitalSign";

export interface VitalSignDetail {
  patientId: number;
  date: Date | string | null;
  vitalSign: VitalSign;
  value: string;
}