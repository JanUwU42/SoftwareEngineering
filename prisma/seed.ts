import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL nicht in .env gefunden!');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dummyImageBase64 =
	'/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function main() {
	console.log('🌱 Starte Database Seeding...');

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

	const passwordHash = await bcrypt.hash('geheim123', 10);

	await prisma.user.create({
		data: {
			email: 'admin@smartbuilders.de',
			passwordHash,
			role: 'ADMIN',
			vorname: 'Chef',
			nachname: 'Chefson'
		}
	});

	const handwerker = await prisma.user.create({
		data: {
			email: 'bob@smartbuilders.de',
			passwordHash,
			role: 'HANDWERKER',
			vorname: 'Bob',
			nachname: 'Baumeister'
		}
	});

	console.log('👤 Mitarbeiter erstellt: Admin & Bob (Passwort: geheim123)');

	const fliesen = await prisma.material.create({
		data: { name: 'Wandfliesen Weiß 30x60', einheit: 'm²', bestand: 100 }
	});

	const kleber = await prisma.material.create({
		data: { name: 'Flexkleber', einheit: 'Sack', bestand: 5 }
	});

	const rohre = await prisma.material.create({
		data: { name: 'Kupferrohr 15mm', einheit: 'm', bestand: 0 }
	});

	const schrauben = await prisma.material.create({
		data: { name: 'Spax Schrauben 4x40', einheit: 'Paket', bestand: 50 }
	});

	console.log('📦 Materialien mit Beständen angelegt.');

	const projekt = await prisma.projekt.create({
		data: {
			auftragsnummer: '2025-SB-TEST',
			kundenname: 'Testkunde GmbH',
			projektbezeichnung: 'Sanierung Testobjekt',
			projektbeschreibung: 'Projekt zum Testen der Anwendung.',
			geplanterStart: new Date('2025-11-01'),
			geplantesEnde: new Date('2025-11-30'),
			mitarbeiter: { connect: { id: handwerker.id } },
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
					{
						titel: 'Vorbereitung',
						beschreibung: 'Dieser Schritt ist fertig.',
						startDatum: new Date('2025-11-01'),
						endDatum: new Date('2025-11-02'),
						status: 'fertig',
						fortschritt: 100,
						reihenfolge: 1,
						materialien: {
							create: [{ materialId: schrauben.id, menge: 2 }]
						}
					},
					{
						titel: 'Installation',
						beschreibung: 'Aktueller Arbeitsschritt.',
						startDatum: new Date('2025-11-03'),
						endDatum: new Date('2025-11-10'),
						status: 'in_arbeit',
						fortschritt: 50,
						reihenfolge: 2,
						materialien: {
							create: [
								{ materialId: fliesen.id, menge: 20 },
								{ materialId: kleber.id, menge: 10 }
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
					{
						titel: 'Rohrverlegung',
						startDatum: new Date('2025-11-15'),
						endDatum: new Date('2025-11-20'),
						status: 'offen',
						fortschritt: 0,
						reihenfolge: 3,
						materialien: {
							create: [{ materialId: rohre.id, menge: 15 }]
						}
					}
				]
			}
		}
	});

	console.log(`🏗️  Test-Projekt erstellt: ${projekt.auftragsnummer}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
