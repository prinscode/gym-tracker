# ADR-001: local-first opslag met IndexedDB

- Status: geaccepteerd
- Datum: 2026-09-12

## Context

Een workout moet tijdens een training blijven werken wanneer de verbinding wegvalt. De data is gestructureerd, groeit door de tijd en meerdere wijzigingen moeten atomair kunnen worden opgeslagen. Een account of backend is voor de eerste productversie geen vereiste.

## Besluit

IndexedDB is de primaire bron op het apparaat. Dexie levert het schema, indexen en transacties. UI-componenten kennen de database niet rechtstreeks: views gebruiken Pinia-stores, stores orkestreren services en alleen repositories voeren persistente queries uit.

Een actieve workout wordt als zelfstandig snapshot opgeslagen. Kritieke acties worden direct geschreven; frequente veldwijzigingen gaan door één geserialiseerde autosavequeue. Herstel gebruikt de persistente workoutstatus en timestamps, niet tijdelijke componentstate.

## Gevolgen

Voordelen:

- de kernflow werkt offline en zonder account;
- transacties beschermen samenhangende wijzigingen;
- opslagdetails blijven vervangbaar achter repositorycontracten;
- de gebruiker houdt de eerste kopie van zijn data lokaal.

Nadelen:

- data synchroniseert niet automatisch tussen apparaten;
- browseropslag kan door de gebruiker of het besturingssysteem worden gewist;
- conflictresolutie wordt pas relevant wanneer remote synchronisatie wordt toegevoegd.

## Vangrails

- Iedere schemawijziging krijgt een expliciete Dexie-versie en migratie.
- Componenten importeren nooit de database-instantie.
- Een toekomstige backend gebruikt een outbox en expliciete conflictstrategie; lokale writes worden niet stilzwijgend last-write-wins overschreven.
- Import/export blijft beschikbaar als gebruikerscontrole en herstelpad.
