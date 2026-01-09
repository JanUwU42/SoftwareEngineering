declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: string; email: string; role: string } | null;
			projekt: { id: string; auftragsnummer: string; kundenname: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
