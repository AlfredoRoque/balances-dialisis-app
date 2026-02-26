import { Medicine } from "./Medicine";

export interface MedicineDetail {
  patientId: number;
  date: Date | string | null;
  medicine: Medicine;
  dose: string;
  frequency: string;
}