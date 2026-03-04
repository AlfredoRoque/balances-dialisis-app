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

    getUserIdFromToken(token: string | null | undefined): number | null {
        if (!token) {
            return null;
        }
        try {
            const decoded = this.decodeToken(token);
            const candidate = Number(decoded?.userId ?? decoded?.id ?? decoded?.sub);
            return Number.isFinite(candidate) ? candidate : null;
        } catch {
            return null;
        }
    }

    getUserRoleFromToken(token: string | null | undefined): 'ADMIN' | 'PATIENT' | null {
        if (!token) {
            return null;
        }
        try {
            const decoded = this.decodeToken(token);
            const role = decoded?.rol ?? decoded?.role ?? null;
            return role === 'ADMIN' || role === 'PATIENT' ? role : null;
        } catch {
            return null;
        }
    }
}