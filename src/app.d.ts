import type { Role } from '@prisma/client';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: string; email: string; role: Role } | null;
			projekt: { id: string; auftragsnummer: string; kundenname: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
