import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class Utility {

    constructor() { }

    decodeToken(token: string): any {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = atob(base64);
        return JSON.parse(decodedPayload);
    }

}