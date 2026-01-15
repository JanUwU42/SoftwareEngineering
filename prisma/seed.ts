import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// 1. Umgebungsvariablen laden (wichtig für DATABASE_URL)
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('❌ DATABASE_URL nicht in .env gefunden!');
}

// 2. Adapter Setup (genau wie in deiner App)
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Ein 1x1 Pixel graues JPEG Bild als Base64
const dummyImageBase64 =
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function main() {
    console.log('🌱 Starte Database Seeding...');

    // 3. Datenbank bereinigen
    await prisma.session.deleteMany();
    await prisma.materialBedarf.deleteMany();
    await prisma.bild.deleteMany();
    await prisma.schritt.deleteMany();
    await prisma.material.deleteMany();
    await prisma.adresse.deleteMany();
    await prisma.projekt.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Alte Daten gelöscht.');

    // 4. Mitarbeiter anlegen
    const passwordHash = await bcrypt.hash('geheim123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@smartbuilders.de',
            passwordHash,
            role: Role.ADMIN
        }
    });
    console.log(`👤 Mitarbeiter erstellt: ${admin.email} (Passwort: geheim123)`);

    // 5. Materialien anlegen
    const fliesen = await prisma.material.create({ data: { name: 'Wandfliesen Weiß 30x60', einheit: 'm²' } });
    const kleber = await prisma.material.create({ data: { name: 'Flexkleber', einheit: 'Sack' } });
    const rohre = await prisma.material.create({ data: { name: 'Kupferrohr 15mm', einheit: 'm' } });

    // 6. Projekt anlegen
    const projekt = await prisma.projekt.create({
        data: {
            auftragsnummer: '2025-SB-001',
            kundenname: 'Max Mustermann',
            projektbezeichnung: 'Badsanierung Gästebad',
            projektbeschreibung: 'Komplettsanierung inkl. neuer Leitungen und moderner Fliesenoptik.',
            geplanterStart: new Date('2025-11-01'),
            geplantesEnde: new Date('2025-11-30'),

            adresse: {
                create: {
                    strasse: 'Musterstraße',
                    hausnummer: '12',
                    plz: '48149',
                    ort: 'Münster'
                }
            },

            schritte: {
                create: [
                    {
                        titel: 'Demontage & Entkernung',
                        beschreibung: 'Alte Sanitärobjekte entfernt und Bauschutt entsorgt.',
                        startDatum: new Date('2025-11-01'),
                        endDatum: new Date('2025-11-03'),
                        status: 'fertig',
                        fortschritt: 100,
                        reihenfolge: 1
                    },
                    {
                        titel: 'Rohinstallation Sanitär',
                        beschreibung: 'Verlegen der neuen Wasserleitungen.',
                        startDatum: new Date('2025-11-04'),
                        endDatum: new Date('2025-11-10'),
                        status: 'in_arbeit',
                        fortschritt: 60,
                        reihenfolge: 2,

                        materialien: {
                            create: [
                                { materialId: rohre.id, menge: 12.5, bemerkung: 'Hauptstrang' }
                            ]
                        },

                        // BILD HOCHLADEN
                        bilder: {
                            create: {
                                daten: Buffer.from(dummyImageBase64, 'base64'),
                                mimeType: 'image/jpeg',
                                beschreibung: 'Stand der Rohinstallation',
                                hochgeladenVon: 'Meister Eder'
                            }
                        }
                    },
                    {
                        titel: 'Fliesenarbeiten',
                        startDatum: new Date('2025-11-15'),
                        endDatum: new Date('2025-11-20'),
                        status: 'offen',
                        fortschritt: 0,
                        reihenfolge: 3,
                        materialien: {
                            create: [
                                { materialId: fliesen.id, menge: 20 },
                                { materialId: kleber.id, menge: 4 }
                            ]
                        }
                    }
                ]
            }
        }
    });

    console.log(`🏗️  Projekt erstellt: ${projekt.auftragsnummer} (Kunde: ${projekt.kundenname})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
