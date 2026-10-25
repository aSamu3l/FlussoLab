# FlussoLab · server per le verifiche

**Italiano** · [English](README.md)

Questo è il **branch `server`** del progetto [FlussoLab](https://github.com/aSamu3l/FlussoLab): un piccolo server che il docente installa sul proprio computer o su quello della scuola, per fare verifiche con FlussoLab.

- Il docente entra con email e password e crea le verifiche: uno o più **esercizi**, ognuno con consegna, **blocchi fissi** (IN e OUT su cui si basa il controllo), prove visibili e **prove nascoste** e una o più **varianti**, più l'orario di apertura e chiusura.
- Ottiene **un link per la classe** e dei **codici studente** da stampare.
- Gli studenti usano il solito FlussoLab (`flussolab.s3l.it`): aprono il link, inseriscono il codice, risolvono e premono **Consegna**.
- Il server **ricorregge ogni consegna** con lo stesso motore dell'app, anche con le prove nascoste che lo studente non vede mai, e mostra al docente una tabella con risultati e segnalazioni: stesso dispositivo usato da più codici, file modificato a mano, blocchi fissi cambiati.

Niente nomi degli studenti sul server: solo codici. La corrispondenza codice → studente la tiene il docente.

## Cosa serve

- **Docker**, con o senza Portainer.
- **Un indirizzo HTTPS**, per esempio `https://consegne.tuodominio.it`, tramite un reverse proxy come Nginx Proxy Manager, Caddy o Traefik. Serve perché FlussoLab è su HTTPS e i browser non permettono a una pagina HTTPS di parlare con un server senza HTTPS.

## Installazione con Portainer

1. **Stacks → Add stack**, dai un nome (es. `flussolab`) e incolla nel *Web editor* il contenuto di [`docker-compose.yml`](docker-compose.yml).
2. Se serve, cambia la porta a sinistra (`8080:8080`) e premi **Deploy the stack**.
3. In **Nginx Proxy Manager** → *Proxy Hosts* → *Add Proxy Host*:
   - **Domain**: `consegne.tuodominio.it`
   - **Forward Hostname / IP**: l'IP del computer con Docker (o `flussolab-server` se NPM è nella stessa rete Docker), **Port** `8080`
   - scheda **SSL**: *Request a new SSL Certificate*, *Force SSL*.
4. Apri `https://consegne.tuodominio.it/admin` e crea l'account del docente: c'è un solo account. Ti chiede un **codice di configurazione**: lo trovi nei log del container (Portainer → *Containers* → *Logs*). Serve perché nessun altro possa creare l'account prima di te. In alternativa imposta `ADMIN_EMAIL` e `ADMIN_PASSWORD` nello stack e l'account viene creato da solo.

## Installazione da terminale

Con Docker Compose, nella cartella dove hai scaricato `docker-compose.yml`:

```sh
docker compose up -d
```

Oppure con un solo comando:

```sh
docker run -d --name flussolab-server --restart unless-stopped \
  -p 8080:8080 -v flussolab-data:/data \
  -e ALLOWED_ORIGINS=https://flussolab.s3l.it -e TRUST_PROXY=1 \
  ghcr.io/asamu3l/flussolab-server:latest
```

Poi configura il reverse proxy come sopra e apri `/admin`.

**Utente:** il server gira come utente **1000:1000**, mai come root. All'avvio il container dà la cartella dei dati a quell'utente, anche se usi una cartella del computer (`./data:/data`) che appartiene a root. Per un altro utente imposta `PUID` e `PGID`.

## Impostazioni

| Variabile | Predefinito | A cosa serve |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://flussolab.s3l.it` | Siti da cui gli studenti possono aprire e consegnare le verifiche (separati da virgole). |
| `APP_URL` | `https://flussolab.s3l.it/` | Indirizzo dell'app usato nei link per la classe. |
| `TRUST_PROXY` | vuoto | Metti `1` se il server è dietro un reverse proxy: così legge l'IP vero degli studenti. Senza, tutta la classe risulta con lo stesso indirizzo e i limiti anti-abuso potrebbero scattare per tutti insieme. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | vuoti | Facoltativi: creano l'account del docente al primo avvio. |
| `PUID`, `PGID` | `1000` | Utente e gruppo con cui gira il server e a cui appartengono i dati. |
| `PORT` | `8080` | Porta interna del container. |
| `DATA_DIR` | `/data` | Dove salva il database (un solo file). |
| `BACKUP_DIR` | vuoto | Accende il **backup automatico**: una copia coerente del database (`flussolab-AAAAMMGG-HHMM.db`) in questa cartella all'avvio e poi ogni `BACKUP_EVERY` ore. Montaci un volume a parte, per esempio `/backup`. |
| `BACKUP_EVERY` | `6` | Ore tra una copia e l'altra. |
| `BACKUP_KEEP` | `30` | Giorni per cui una copia viene tenuta; le più vecchie vengono tolte. |

## Operazioni utili

**Password dimenticata**

```sh
docker exec -it -u 1000:1000 flussolab-server node src/server.js reset-admin prof@scuola.it nuova-password
```

**Aggiornare**
- **Portainer:** nello stack premi *Pull and redeploy*.
- **Terminale:**

  ```sh
  docker compose pull && docker compose up -d
  ```

  oppure, se l'hai avviato con `docker run`:

  ```sh
  docker pull ghcr.io/asamu3l/flussolab-server:latest
  docker rm -f flussolab-server
  ```
  
  e poi rilancia il comando `docker run` di sopra.

I dati restano nel volume `flussolab-data`.

**Backup**: con `BACKUP_DIR=/backup` e un volume (o una cartella dell'host) montato su `/backup`, il server ci scrive da solo una copia del database, all'avvio e ogni `BACKUP_EVERY` ore, e toglie le copie più vecchie di `BACKUP_KEEP` giorni. Per ripristinarne una, ferma il container e copia il file sopra `/data/flussolab.db`. Senza, tutti i dati stanno nel volume `flussolab-data`:

```sh
docker run --rm -v flussolab-data:/data -v "$PWD":/backup alpine tar czf /backup/flussolab-backup.tgz -C /data .
```

## Come funziona una verifica

1. **Esercizi.** Una verifica può avere fino a 10 esercizi. Lo studente li trova uno per scheda e **Consegna** li manda tutti insieme; fino alla chiusura può consegnare di nuovo.
2. **Blocchi fissi.** Per ogni variante scegli gli IN (la variabile in cui finiscono i dati) e gli OUT (la variabile da stampare). Gli studenti li trovano nel diagramma con un lucchetto: possono spostarli, anche dentro un ciclo, e aggiungere blocchi in mezzo, ma non cancellarli né modificarli.
3. **Prove.**
   - **Input**: un valore per riga, nell'ordine in cui il programma li legge. Ogni IN eseguito, fisso o aggiunto dallo studente, prende il valore successivo; così funziona anche un ciclo che richiede un dato sbagliato.
   - **Output atteso**: un valore per riga, uno per ogni volta che un OUT fisso scrive. I testi scritti dagli altri OUT non contano; i numeri si confrontano con una piccola tolleranza, quindi 7 e 7.0 sono uguali.
4. **Varianti.** Ogni codice riceve una variante di ogni esercizio; i codici si alternano tra le varianti, così i vicini di banco hanno combinazioni diverse. Se modifichi la verifica dopo, i codici tengono le varianti che avevano già. Lo studente non vede mai quale variante ha (né nell'app né sul foglio con il codice): solo tu la vedi nei risultati.
5. **Risultati.** Una riga per codice, con il risultato di ogni esercizio e il totale; lo ZIP contiene un file `.flusso` per studente ed esercizio, più `risultati.csv`.
6. **Un codice, un dispositivo.** Un codice funziona sul primo dispositivo (computer e browser) che lo apre: su un altro l'app dice che il codice è in uso. Se uno studente deve cambiare computer, libera il codice con **Sblocca** nella pagina della verifica.
7. **Salvataggio automatico.** Durante la verifica l'app manda al server il lavoro degli studenti ogni minuto (solo quello che è cambiato). Una bozza non è una consegna: se uno studente non preme mai Consegna, nei risultati vedi l'ora dell'ultima bozza e puoi **usarla come consegna**, per quel codice o per tutti insieme; viene corretta come le altre e segnata *Da bozza*.
8. **Orari.** Prima dell'apertura il link non mostra niente. L'app mostra allo studente l'ora di chiusura e il tempo che manca, e lo avvisa 5 minuti prima. All'ora di chiusura non può più modificare, ma ha ancora i **minuti extra** che hai scelto (5, di base) solo per premere Consegna; poi la consegna è chiusa. Fino ad allora può consegnare di nuovo: vale l'ultima consegna, e il docente vede anche le precedenti. Dalla pagina della verifica puoi **prolungare** di 5 o 15 minuti o chiudere subito: l'app degli studenti si aggiorna da sola entro mezzo minuto.

## Privacy

Il server salva solo:
- **i codici**, senza nomi;
- **i diagrammi consegnati** e **i risultati**;
- **l'ora**;
- **il codice casuale del dispositivo**, generato dall'app;
- **l'indirizzo IP** di chi consegna.

Non ci sono account per gli studenti, cookie per gli studenti o log degli accessi. I dati restano sul computer dove gira il server. Chi installa il server ne è il responsabile: la scuola o il docente.

## Versioni

L'app parte dalla versione 1.x, il server dalla 0.x. App e server si scambiano un numero di *protocollo*: se non coincide, l'app mostra un messaggio chiaro invece di un errore.

- Il **server 0.2** o successivo (protocollo 2) richiede **FlussoLab 1.2** o successivo. FlussoLab 1.2 funziona anche con il server 0.1. Gli avvisi sul tempo e il blocco delle modifiche alla chiusura richiedono FlussoLab 1.3 e server 0.3; il codice legato al dispositivo e il salvataggio automatico richiedono FlussoLab 1.4 e server 0.4 (un'app più vecchia continua a funzionare, senza).
- L'aggiornamento dalla 0.1 è automatico: al primo avvio i dati vengono convertiti e le verifiche che hai diventano verifiche con un esercizio.
- Le novità di ogni versione sono nel [changelog](CHANGELOG.it.md).

## Sviluppo

```sh
npm run sync-core   # copia core.js dal branch main
npm test
npm start           # http://localhost:8080/admin
```

Nessuna dipendenza esterna: Node.js 22.13 o più recente, con `node:sqlite`. Licenza [CC BY-NC-SA 4.0](https://github.com/aSamu3l/FlussoLab/blob/main/LICENSE), come FlussoLab.
