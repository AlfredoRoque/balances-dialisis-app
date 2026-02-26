import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "../../shared/models/User";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class UserService {

  private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/users`;
  }

  guardar(data: User) {
    return this.http.post<any>(`${this.API}/save`, data);
  }

  updatePassword(actualEncryptedPassword: string, newEncryptedPassword: string, userId: number) {
    return this.http.get(`${this.API}/${userId}/update-password`, {
      params: {
        actualPassword: actualEncryptedPassword,
        newPassword: newEncryptedPassword
      }
    });
  }
}
