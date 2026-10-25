# Novità del server

**Italiano** · [English](CHANGELOG.md)

## 0.3.0 · 25 ottobre 2026

- **Tempo della verifica**: alla chiusura gli studenti non possono più modificare, ma hanno ancora i **minuti extra** scelti dal docente (5 di base) per consegnare. L'app mostra loro l'ora di chiusura, il tempo che manca e gli avvisi; il server manda anche la propria ora, così il conto è giusto anche con l'orologio del computer sbagliato.
- **Prolunga** di 5 o 15 minuti e **Chiudi subito** dalla pagina della verifica; l'app degli studenti si aggiorna da sola.
- **Codice di configurazione** al primo avvio, stampato nei log: senza, nessuno può creare l'account del docente al posto tuo.
- Limiti a testi e output dei programmi corretti sul server (un programma che scrive all'infinito non lo rallenta più); il CSV dei risultati non può contenere formule.
- Il cookie di accesso è marcato sicuro solo quando `TRUST_PROXY` è attivo, come documentato.

## 0.2.0 · 22 ottobre 2026

- **Verifiche con più esercizi**: fino a 10 esercizi, ognuno con le sue varianti. Ogni codice riceve una variante per esercizio, con combinazioni diverse per i vicini di banco.
- Lo studente trova un esercizio per scheda e li consegna tutti insieme (FlussoLab 1.2).
- Risultati con una colonna per esercizio e il totale; nello ZIP un file per studente ed esercizio e un `risultati.csv` con tutte le colonne.
- Modificando una verifica i codici tengono le varianti già assegnate.
- **La variante resta segreta**: il server non manda più allo studente il nome della variante, e i codici da stampare non lo riportano. Così chi copia da un vicino con una variante diversa si riconosce dalle prove.
- Messaggi di errore delle prove spiegati per esteso; corretta la pagina dei codici da stampare.
- Protocollo 2. I dati della 0.1 vengono convertiti da soli al primo avvio.

## 0.1.0 · 10 ottobre 2026

- Prima versione: account del docente, verifiche con varianti, blocchi fissi e prove nascoste, codici studente, consegne corrette sul server, segnalazioni, ZIP con i risultati, immagine Docker.
