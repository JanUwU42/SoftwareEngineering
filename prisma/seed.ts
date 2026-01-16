import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// 1. Umgebungsvariablen laden
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('❌ DATABASE_URL nicht in .env gefunden!');
}

// 2. Adapter Setup
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Dummy Bild (1x1 Pixel)
const dummyImageBase64 =
	'/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function main() {
	console.log('🌱 Starte Database Seeding...');

	// 3. Datenbank bereinigen (Reihenfolge wegen Foreign Keys wichtig!)
	await prisma.auditLog.deleteMany();
	await prisma.handwerkerUpdate.deleteMany();
	await prisma.notiz.deleteMany();
	await prisma.session.deleteMany();
	await prisma.materialBedarf.deleteMany();
	await prisma.bild.deleteMany();
	await prisma.schritt.deleteMany();
	await prisma.material.deleteMany();
	await prisma.adresse.deleteMany();
	await prisma.projekt.deleteMany();
	await prisma.passwordResetToken.deleteMany();
	await prisma.user.deleteMany();

	console.log('🧹 Alte Daten gelöscht.');

	// 4. Mitarbeiter anlegen
	const passwordHash = await bcrypt.hash('geheim123', 10);

	// ADMIN
	await prisma.user.create({
		data: {
			email: 'admin@smartbuilders.de',
			passwordHash,
			role: 'ADMIN',
			vorname: 'Chef',
			nachname: 'Chefson'
		}
	});

	// HANDWERKER (Zum Testen der Sichtbarkeit)
	const handwerker = await prisma.user.create({
		data: {
			email: 'bob@smartbuilders.de',
			passwordHash,
			role: 'HANDWERKER',
			vorname: 'Bob',
			nachname: 'Baumeister'
		}
	});

	console.log(`👤 Mitarbeiter erstellt: Admin & Bob (Passwort: geheim123)`);

	// 5. Materialien anlegen (Mit Lagerbestand für Tests)

	// Fall A: Genug da (Bestand 100)
	const fliesen = await prisma.material.create({
		data: { name: 'Wandfliesen Weiß 30x60', einheit: 'm²', bestand: 100 }
	});

	// Fall B: Zu wenig da (Bestand 5, wir werden 10 brauchen)
	const kleber = await prisma.material.create({
		data: { name: 'Flexkleber', einheit: 'Sack', bestand: 5 }
	});

	// Fall C: Gar nichts da (Bestand 0)
	const rohre = await prisma.material.create({
		data: { name: 'Kupferrohr 15mm', einheit: 'm', bestand: 0 }
	});

	// Fall D: Verbrauchsmaterial (Bestand 50)
	const schrauben = await prisma.material.create({
		data: { name: 'Spax Schrauben 4x40', einheit: 'Paket', bestand: 50 }
	});

	console.log('📦 Materialien mit Beständen angelegt.');

	// 6. Projekt anlegen
	const projekt = await prisma.projekt.create({
		data: {
			auftragsnummer: '2025-SB-TEST',
			kundenname: 'Testkunde GmbH',
			projektbezeichnung: 'Sanierung Testobjekt',
			projektbeschreibung: 'Projekt zum Testen der Lagerlogik.',
			geplanterStart: new Date('2025-11-01'),
			geplantesEnde: new Date('2025-11-30'),

			// Handwerker zuweisen
			mitarbeiter: {
				connect: { id: handwerker.id }
			},

			adresse: {
				create: {
					strasse: 'Lagerstraße',
					hausnummer: '1',
					plz: '12345',
					ort: 'Münster'
				}
			},

			schritte: {
				create: [
					// SCHRITT 1: FERTIG
					// Material hier sollte bereits vom Lager abgezogen sein (logisch betrachtet).
					// Da wir seeden, simulieren wir den Zustand "Nach Abbuchung".
					{
						titel: 'Vorbereitung',
						beschreibung: 'Dieser Schritt ist fertig. Material wurde verbraucht.',
						startDatum: new Date('2025-11-01'),
						endDatum: new Date('2025-11-02'),
						status: 'fertig',
						fortschritt: 100,
						reihenfolge: 1,
						materialien: {
							create: [
								// Wir tun so, als wären hier 2 Pakete verbraucht worden.
								// Der Bestand von 'schrauben' oben (50) ist der aktuelle Restbestand.
								{ materialId: schrauben.id, menge: 2, bemerkung: 'Bereits verbraucht' }
							]
						}
					},

					// SCHRITT 2: IN ARBEIT (Reservierung aktiv)
					// Hier testen wir die Mischkalkulation
					{
						titel: 'Installation',
						beschreibung: 'Hier wird Material reserviert.',
						startDatum: new Date('2025-11-03'),
						endDatum: new Date('2025-11-10'),
						status: 'in_arbeit',
						fortschritt: 50,
						reihenfolge: 2,

						materialien: {
							create: [
								// TEST 1: Genug da (Bestand 100, Bedarf 20) -> Sollte GRÜN sein
								{ materialId: fliesen.id, menge: 20 },

								// TEST 2: Zu wenig da (Bestand 5, Bedarf 10) -> Sollte ROT sein (Nachbestellen: 5)
								{ materialId: kleber.id, menge: 10, bemerkung: 'Achtung: Lager reicht nicht!' }
							]
						},
						bilder: {
							create: {
								daten: Buffer.from(dummyImageBase64, 'base64'),
								mimeType: 'image/jpeg',
								beschreibung: 'Baustelle aktuell',
								hochgeladenVon: 'Bob',
								freigegeben: true
							}
						}
					},

					// SCHRITT 3: OFFEN (Reservierung aktiv)
					// Hier testen wir "Gar nichts da"
					{
						titel: 'Rohrverlegung',
						startDatum: new Date('2025-11-15'),
						endDatum: new Date('2025-11-20'),
						status: 'offen',
						fortschritt: 0,
						reihenfolge: 3,
						materialien: {
							create: [
								// TEST 3: Nichts da (Bestand 0, Bedarf 15) -> Sollte ROT sein (Nachbestellen: 15)
								{ materialId: rohre.id, menge: 15, bemerkung: 'Muss bestellt werden' }
							]
						}
					}
				]
			}
		}
	});

	console.log(`🏗️  Test-Projekt erstellt: ${projekt.auftragsnummer}`);
	console.log(`👉 Starte jetzt die App und prüfe die Materialkarte im Projekt!`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
