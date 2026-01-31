import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class UserService {

  private API = 'http://localhost:8080/user';

  constructor(private http: HttpClient) {}

  guardar(data: { username: string; password: string , address: string}) {
    return this.http.post<any>(`${this.API}/save`, data);
  }
}
