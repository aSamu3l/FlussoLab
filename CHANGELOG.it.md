# Novità

**Italiano** · [English](CHANGELOG.md)

Tutte le modifiche di FlussoLab, dalla più recente. I numeri di versione seguono la regola *principale.funzioni.correzioni*.

## 1.1.0 · 19 ottobre 2026

- **Trascina i file sulla finestra**: uno o più file `.flusso` lasciati in qualsiasi punto di FlussoLab si aprono come nuove schede. Funziona in tutti i browser, anche con Safari e Firefox.
- **Apri dallo ZIP**: trascinando uno ZIP (o scegliendolo in *File → Apri*) FlussoLab mostra i diagrammi che contiene e chiede quali aprire. Va bene anche lo ZIP creato con *Esporta consegna*.
- *File → Apri* accetta più file insieme.
- Nella finestra *Informazioni* c'è il collegamento a questa pagina.

## 1.0.3 · 19 ottobre 2026

- Con l'app installata (Chrome, Edge), il doppio clic su un file `.flusso` lo apre come **nuova scheda nella finestra già aperta**, invece di aprire un'altra finestra.
- Se quel diagramma è già aperto, FlussoLab passa alla sua scheda invece di duplicarlo.

## 1.0.2 · 17 ottobre 2026

- Un **ciclo infinito** non blocca più la pagina: *Stop* risponde subito anche alla velocità massima.
- Se il programma gira per diversi secondi senza chiedere niente, compare l'avviso «Il programma non finisce?».
- La console tiene al massimo le ultime 3000 righe.

## 1.0.1 · 16 ottobre 2026

- **Divisione**: `/` dà sempre un risultato con la virgola (`7 / 2` → 3.5), `//` è la divisione intera, arrotondata verso il basso (`7 // 2` → 3). Mettendo un risultato con la virgola in una variabile `int`, il messaggio suggerisce di usare `//`.
- **Prove**: un IN chiude la riga come nella console, i numeri si confrontano con una piccola tolleranza (7 e 7.0 sono uguali), con «Solo l'ultima riga» si vede solo quella.
- Chiudendo o ricaricando la pagina il browser non chiede più di salvare: il lavoro resta salvato nel browser.
- Sitemap completa, con le lingue e le immagini.

## 1.0.0 · 10 ottobre 2026

Prima versione numerata.

- Blocchi IN, OUT/OUTLN, assegnazione, IF, WHILE, DO WHILE, FOR, VAR e commento; esecuzione completa o passo passo, con variabili e traccia.
- Tipi come in C (`int`, `float`, `string`, `bool`), automatici o dichiarati; messaggi d'errore chiari, controllati prima di eseguire.
- Pseudocodice e codice Python generati dal diagramma.
- Più diagrammi in schede, file `.flusso`, immagini PNG, *Esporta consegna* in un unico ZIP.
- Link condivisibili con il diagramma compresso dentro, senza server.
- Scheda **Prove** per controllare il programma con input e output attesi; blocchi disattivabili.
- **Verifiche** con il server del docente: codice dello studente, blocchi fissi, prove nascoste, consegna.
- App installabile che funziona anche offline, in italiano e inglese; altre lingue si aggiungono con un file.
