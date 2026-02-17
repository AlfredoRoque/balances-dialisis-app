export interface PatientRequest {
  name: string;
  age: number;
  userId: number;
  bagTypeId: number;
  status: any; // El backend asignará el estado inicial adecuado, por lo que puede ser null o un string dependiendo de la implementación
}