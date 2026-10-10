# FlussoLab · server per le verifiche

**Italiano** · [English](README.md)

Questo è il **branch `server`** del progetto [FlussoLab](https://github.com/aSamu3l/FlussoLab): un piccolo server che il docente installa sul proprio computer o su quello della scuola, per fare verifiche con FlussoLab.

- Il docente entra con email e password e crea le verifiche: consegna, **blocchi fissi** (IN e OUT su cui si basa il controllo), prove visibili e **prove nascoste**, una o più **varianti**, orario di apertura e chiusura.
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
4. Apri `https://consegne.tuodominio.it/admin` e crea l'account del docente: c'è un solo account.

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

## Impostazioni

| Variabile | Predefinito | A cosa serve |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://flussolab.s3l.it` | Siti da cui gli studenti possono aprire e consegnare le verifiche (separati da virgole). |
| `APP_URL` | `https://flussolab.s3l.it/` | Indirizzo dell'app usato nei link per la classe. |
| `TRUST_PROXY` | vuoto | Metti `1` se il server è dietro un reverse proxy: così legge l'IP vero degli studenti. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | vuoti | Facoltativi: creano l'account del docente al primo avvio. |
| `PORT` | `8080` | Porta interna del container. |
| `DATA_DIR` | `/data` | Dove salva il database (un solo file). |

## Operazioni utili

**Password dimenticata**

```sh
docker exec -it flussolab-server node src/server.js reset-admin prof@scuola.it nuova-password
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

**Backup**: tutti i dati stanno nel volume `flussolab-data`.

```sh
docker run --rm -v flussolab-data:/data -v "$PWD":/backup alpine tar czf /backup/flussolab-backup.tgz -C /data .
```

## Come funziona una verifica

1. **Blocchi fissi.** Per ogni variante scegli gli IN (la variabile in cui finiscono i dati) e gli OUT (la variabile da stampare). Gli studenti li trovano nel diagramma con un lucchetto: possono spostarli, anche dentro un ciclo, e aggiungere blocchi in mezzo, ma non cancellarli né modificarli.
2. **Prove.**
   - **Input**: un valore per riga, nell'ordine in cui il programma li legge. Ogni IN eseguito, fisso o aggiunto dallo studente, prende il valore successivo; così funziona anche un ciclo che richiede un dato sbagliato.
   - **Output atteso**: un valore per riga, uno per ogni volta che un OUT fisso scrive. I testi scritti dagli altri OUT non contano; i numeri si confrontano con una piccola tolleranza, quindi 7 e 7.0 sono uguali.
3. **Varianti.** I codici si alternano tra le varianti, così i vicini di banco hanno esercizi diversi.
4. **Orari.** Prima dell'apertura il link non mostra niente; dopo la chiusura non si consegna più. Fino alla chiusura lo studente può consegnare di nuovo: vale l'ultima consegna, e il docente vede anche le precedenti.

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

## Sviluppo

```sh
npm run sync-core   # copia core.js dal branch main
npm test
npm start           # http://localhost:8080/admin
```

Nessuna dipendenza esterna: Node.js 22.13 o più recente, con `node:sqlite`. Licenza [CC BY-NC-SA 4.0](https://github.com/aSamu3l/FlussoLab/blob/main/LICENSE), come FlussoLab.
