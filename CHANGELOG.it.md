# Novità

**Italiano** · [English](CHANGELOG.md)

Tutte le modifiche di FlussoLab, dalla più recente. I numeri di versione seguono la regola *principale.funzioni.correzioni*.

## 1.4.0 · 25 ottobre 2026

- **Salvataggio automatico durante la verifica** (server 0.4): ogni minuto il lavoro va sul server, solo quello che è cambiato, e la barra mostra quando è stato salvato l'ultima volta. Non è una consegna: se ti dimentichi di premere **Consegna**, il docente può comunque usare la tua ultima bozza.
- I **blocchi fissi** della verifica si possono solo spostare: niente copia, duplica o elimina, dal pannello, dai menu o dalla tastiera; un blocco che ne contiene uno (un ciclo, un IF) segue la stessa regola. Tagliarne uno lo sposta solo dentro il suo programma.
- **Un codice, un dispositivo**: il codice della verifica funziona sul primo computer e browser che lo apre. Se devi cambiare computer, il docente lo sblocca.

## 1.3.0 · 25 ottobre 2026

- **Tempo della verifica** (server 0.3): una barra sotto l'intestazione mostra l'ora di chiusura, il tempo che manca e il pulsante Consegna. Cinque minuti prima arriva un avviso; alla chiusura **non si può più modificare** e restano i minuti extra decisi dal docente solo per consegnare. Se il docente prolunga o chiude prima, l'app se ne accorge da sola.
- I programmi non possono più creare testi enormi o scrivere senza limite: compare un errore chiaro invece di bloccare la pagina.
- Intestazioni di sicurezza per il sito (Content Security Policy, niente inquadramento in altre pagine).

## 1.2.0 · 22 ottobre 2026

- **Verifiche con più esercizi** (server 0.2): con il codice si aprono tutti gli esercizi, uno per scheda, ognuno con la sua consegna e le sue prove. **Consegna** li manda tutti insieme e avvisa se ne manca uno; riaprendo il link tornano solo quelli chiusi.
- Le schede mostrano solo il nome dell'esercizio (o della verifica, se ha un solo esercizio): **la variante non compare più**.
- Funziona sempre anche con il server 0.1.

## 1.1.2 · 20 ottobre 2026

- Gli **esempi pronti** dichiarano il tipo dei dati letti (`IN int n`, `IN float voto`): così anche il codice Python generato funziona.
- La finestra dell’**immagine PNG** si chiude dopo il download, come quella di *Salva*.
- Tolti stili e testi rimasti dal vecchio editor di esercizi.
- Immagini aggiornate nel README e nella pagina di benvenuto; nel README le funzioni nuove (Prove, link, verifiche, trascinamento).

## 1.1.1 · 19 ottobre 2026

- Nella scheda *Prove* non si vedono più il codice del dispositivo e la cronologia dei dispositivi: restano solo dentro il file `.flusso`, per il docente.

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
