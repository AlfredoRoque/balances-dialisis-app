import { BagType } from "../BagType";

export interface PatientResponse {
  id: string;
  name: string;
  age: number;
  userId: number;
  bagType: BagType;
  status: 'Estable' | 'Requiere atención' | 'Nuevo ingreso';
}