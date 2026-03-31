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
            const roleSource = decoded?.rol ?? decoded?.role ?? decoded?.roles ?? decoded?.authorities ?? null;
            return this.resolveRole(roleSource);
        } catch {
            return null;
        }
    }

    private resolveRole(roleValue: unknown): 'ADMIN' | 'PATIENT' | null {
        const normalize = (value: string): 'ADMIN' | 'PATIENT' | null => {
            const upper = value.trim().toUpperCase();
            if (upper.includes('ADMIN')) {
                return 'ADMIN';
            }
            if (upper.includes('PATIENT') || upper.includes('PACIENTE')) {
                return 'PATIENT';
            }
            return null;
        };

        if (typeof roleValue === 'string') {
            return normalize(roleValue);
        }

        if (Array.isArray(roleValue)) {
            for (const candidate of roleValue) {
                if (typeof candidate === 'string') {
                    const match = normalize(candidate);
                    if (match) {
                        return match;
                    }
                }
            }
        }

        return null;
    }

    public isFreePlan(currentPlan: string | null | undefined): boolean {
        return (currentPlan ?? '').toUpperCase() === 'FREE';
    }
}