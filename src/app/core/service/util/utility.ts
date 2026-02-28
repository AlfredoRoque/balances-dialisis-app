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

    getToday(): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    getHostUrl(): string {
        return 'https://gestor-balance-dialisis-production.up.railway.app';
    }
}