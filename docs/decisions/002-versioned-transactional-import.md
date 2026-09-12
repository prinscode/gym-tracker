# ADR-002: versieerbare, transactionele import en export

- Status: geaccepteerd
- Datum: 2026-09-12

## Context

Local-first opslag maakt een betrouwbaar overdrachts- en herstelmechanisme noodzakelijk. Een gedeeltelijke import kan relaties tussen workouts, sets, programma’s en records beschadigen. Toekomstige schemawijzigingen mogen bestaande exports niet onleesbaar maken.

## Besluit

Export produceert één leesbaar JSON-document met een expliciete `schemaVersion`, exporttijd en alle domeincollecties. Import behandelt het bestand als `unknown` en valideert het volledige geneste document met Zod voordat een write begint.

De gebruiker kiest tussen samenvoegen en vervangen. Beide paden draaien in één Dexie-transactie. Bij vervangen wordt de bestaande data pas binnen diezelfde transactie gewist. Iedere fout rolt de volledige wijziging terug.

## Gevolgen

Voordelen:

- corrupte of onverwachte invoer bereikt de database niet;
- mislukte imports laten de vorige toestand intact;
- exports zijn inspecteerbaar en overdraagbaar zonder propriëtair formaat;
- een versieveld maakt expliciete migraties mogelijk.

Nadelen:

- een volledige export kan bij grote datasets geheugen kosten;
- iedere nieuwe exportversie vereist compatibiliteitsbeleid en tests;
- samenvoegen kan semantische conflicten opleveren zodra data op meerdere apparaten wordt gewijzigd.

## Vangrails

- Onbekende schema-versies worden geweigerd, niet automatisch geïnterpreteerd.
- Validatie en databasewrites blijven afzonderlijke stappen.
- Unit-tests dekken geldige exports, corrupte geneste waarden, onbekende versies en transactioneel herstel.
- Een volgende schema-versie krijgt een expliciete migratiefunctie en fixture van de vorige versie.
