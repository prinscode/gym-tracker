# GBA Workout Tracker

Een complete, mobile-first workout-tracker voor het plannen, uitvoeren en analyseren van krachttraining. De applicatie draait volledig in de browser, werkt zonder backend en bewaart alle gegevens lokaal in IndexedDB.

## Belangrijkste features

- Trainingsprogramma’s met meerdere dagen, rep-ranges, RPE, rusttijd en drag-and-dropvolgorde
- 22 vooringestelde oefeningen plus eigen oefeningen, bewerken en veilig archiveren
- Onafhankelijke workout-snapshots: wijzigingen aan een programma beïnvloeden een lopende workout niet
- Grote setinputs voor gewicht, reps en RPE, settypen, dupliceren, undo bij verwijderen en oefeningen overslaan
- Slim voorinvullen vanuit de vorige workout of vorige set
- Directe IndexedDB-persistentie, geserialiseerde autosave en herstel na refresh of browsersluiting
- Timestamp-gebaseerde rusttimer die correct blijft lopen in achtergrondtabs
- Volumeberekening, Epley estimated 1RM en vijf typen persoonlijke records
- Doorzoekbare, filterbare en achteraf bewerkbare geschiedenis met herberekening van statistieken
- Responsieve Chart.js-grafieken voor 1RM, gewicht, volume, werksets en gemiddelde RPE
- Licht, donker en systeemthema; kilogram/poundweergave met kilogram als interne bron
- Transactionele JSON-import en -export met Zod-validatie
- Toegankelijke modals, toetsenbordfocus, screenreaderlabels, aria-livefeedback en reduced motion
- Realistische demo-data met een driedaags full-bodyprogramma en acht historische workouts

## Screenshots

> Voeg portfolioscreenshots toe in `docs/screenshots/`.

- Dashboard — `docs/screenshots/dashboard.png`
- Actieve workout — `docs/screenshots/active-workout.png`
- Progressie — `docs/screenshots/progress.png`
- Mobiele weergave — `docs/screenshots/mobile.png`

## Technische stack

Vue 3, TypeScript, Vite, Composition API, `<script setup>`, Vue Router, Pinia, Dexie, Zod, Chart.js, vue-chartjs, date-fns, Lucide Icons, Vitest, Vue Test Utils, Playwright, ESLint en Prettier.

## Architectuur

De code is feature-based georganiseerd:

```text
src/
├── components/       # Alleen generieke basis- en layoutcomponenten
├── composables/      # Kleine UI-/browsercomposables
├── db/               # Dexie-schema, initialisatie en seeddata
├── features/         # Feature-specifieke componenten
├── repositories/     # Persistente data-accesslaag
├── services/         # Pure en asynchrone businesslogica
├── stores/           # Pinia-orkestratie en schermstate
├── types/            # Strikt domeinmodel en branded IDs
├── utils/            # Pure berekeningen en formatters
└── views/            # Lazy-loaded routeviews
```

Vue-componenten benaderen Dexie nooit rechtstreeks. Repositories bevatten opslagqueries, services voeren businessregels uit en stores coördineren state en acties. Dit houdt de UI testbaar en maakt een latere remote repository of synchronisatielaag mogelijk.

## Datamodel

- `Exercise`: oefeningsmetadata, spiergroepen, materiaal en archiveerstatus
- `Program`: programma-informatie en verwijzingen naar trainingsdagen
- `WorkoutTemplate`: geordende template-oefeningen met standaardsets, reps, RPE en rust
- `Workout`: actieve of voltooide, zelfstandig gekopieerde workout-instance
- `WorkoutExercise` en `WorkoutSet`: snapshots en geregistreerde setdata
- `PersonalRecord`: recordtype, nieuwe/vorige waarde en bronset
- `UserSettings`: thema, eenheid, timer- en volumegedrag
- `ExportPayload`: versieerbare volledige database-export

IDs zijn in TypeScript branded waar domeinverwisseling risico geeft. Externe importdata blijft `unknown` tot Zod het volledige geneste model heeft gevalideerd.

## Installatie

Vereist Node.js 22 of nieuwer.

```bash
npm install
npx playwright install chromium
npm run dev
```

Vite toont vervolgens de lokale ontwikkel-URL. De database wordt bij de eerste start automatisch gevuld met demo-data. In development kan die data via Instellingen opnieuw worden geladen.

## Scripts

| Script              | Doel                                      |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite developmentserver                    |
| `npm run build`     | Typecheck plus productiebuild             |
| `npm run preview`   | Productiebundel lokaal bekijken           |
| `npm run typecheck` | Strikte Vue/TypeScript-controle           |
| `npm run lint`      | ESLint zonder toegestane waarschuwingen   |
| `npm run format`    | Prettier toepassen                        |
| `npm run test`      | Alle unit- en componenttests              |
| `npm run test:unit` | Vitest eenmalig uitvoeren                 |
| `npm run test:e2e`  | Playwright op desktop en mobiel uitvoeren |

## Teststrategie

Unit-tests controleren volumeberekening, estimated 1RM, recorddetectie, kg/lb-conversie, workoutduur, importvalidatie, statistiekaggregatie en timerberekening. Componenttests dekken setinvoer, voltooien en toevoegen, de bevestigingsmodal, actieve-workoutherstel, inline validatie en een lege geschiedenisstate.

Playwright voert twee end-to-endreizen uit op desktop en een mobiele viewport:

1. Demo openen, workout starten, sets invullen, refreshen, herstellen, afronden en het nieuwe record/datapunt controleren.
2. Exporteren, alle lokale data wissen en dezelfde data transactioneel terug importeren.

## Offline opslag

Dexie beheert een versieerbaar IndexedDB-schema met aparte tabellen voor oefeningen, programma’s, templates, workouts, records en instellingen. Kritieke workoutacties worden meteen opgeslagen. Gewone invoer wordt 450 ms gedebounced en via één Promise-queue geserialiseerd, waardoor twee writes niet gelijktijdig dezelfde workout overschrijven.

Een actieve workout heeft `status: "active"` en wordt bij dashboard- of workoutroute-initialisatie teruggelezen. De herstelkaart toont naam, verstreken tijd en voltooide sets. Rusttijd gebruikt een persistente eindtimestamp in plaats van lokale secondeticks.

## Import en export

Export levert één leesbaar JSON-bestand met `schemaVersion: 1`. Import valideert elk genest veld met Zod voordat een write start. De gebruiker kiest samenvoegen of vervangen. De bestaande export wordt eerst in het geheugen gelezen en alle wijzigingen vinden binnen één Dexie-transactie plaats; bij een fout rolt IndexedDB de volledige import terug.

## Technical decisions

### Waarom IndexedDB?

Workoutdata is gestructureerd, groeit door de tijd en bevat geneste snapshots. IndexedDB heeft hiervoor veel meer capaciteit en betere transacties/indexen dan `localStorage`, terwijl de eerste versie volledig offline en zonder account kan werken. Dexie biedt een getypeerde, compacte laag over de browser-API.

### Waarom repositories tussen Vue en Dexie?

Componenten kennen alleen stores en services. Opslagdetails zitten achter repositories, zodat databasequeries niet door de UI verspreid raken. Voor een backend kan een tweede implementatie dezelfde contracten leveren en kan een synchronisatieservice lokale en remote wijzigingen combineren.

### Waarom gewicht intern in kilogram?

Alle gewichten blijven in één canonieke eenheid. Pound is uitsluitend een invoer-/presentatieconversie met `1 kg = 2.2046226218 lb`. Wisselen van instelling herschrijft daarom geen historische records en introduceert geen cumulatieve afrondingsfouten.

### Hoe worden actieve workouts hersteld?

Bij starten wordt eerst een volledige template-snapshot gemaakt en direct opgeslagen. Elke setactie actualiseert die instance. De route mag vrij worden verlaten; het dashboard zoekt naar `status: active` en biedt hervatten of bevestigd verwijderen. Programmawijzigingen raken het snapshot niet.

### Hoe worden persoonlijke records berekend?

Voltooide niet-warm-upsets worden per oefening vergeleken met alle eerdere workouts. De service controleert zwaarste gewicht, reps op hetzelfde gewicht, Epley 1RM (alleen 1–12 reps), setvolume en oefeningsvolume per workout. Records van een opnieuw opgeslagen workout worden vervangen. Bij historische edits worden alle records chronologisch opnieuw opgebouwd, zodat latere records ook correct blijven.

### Hoe kan later een backend worden gekoppeld?

Branded IDs, ISO-timestamps, schemaVersion en de repositorygrens vormen al stabiele synchronisatie-eenheden. Een volgende versie kan remote repositories, authenticatie, een outbox en conflictresolutie toevoegen zonder componenten of pure statistiekservices te herschrijven.

## Bekende beperkingen

- Data synchroniseert nog niet tussen browsers of apparaten.
- Er is nog geen account-, cloudbackup- of gedeeld coachprofiel.
- Bodyweightrecords registreren alleen extern toegevoegd gewicht; lichaamsgewicht zelf wordt niet meegerekend.
- Browsernotificaties en geluid voor de rusttimer zijn nog niet ingeschakeld.
- Templates ondersteunen herordening met HTML drag-and-drop en toetsenbordpijlen, maar geen touch-drag library.

## Mogelijke uitbreidingen

Een optionele API/synchronisatielaag, PWA-installatie, trainingskalender, RIR, supersets, plate calculator, coachdeling, herstelmetingen, Apple Health/Google Health Connect, CSV-export en programmeerbare progressieregels.
