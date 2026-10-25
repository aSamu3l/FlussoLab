# FlussoLab · verification server

[Italiano](README.it.md) · **English**

This is the **`server` branch** of [FlussoLab](https://github.com/aSamu3l/FlussoLab): a small server a teacher installs on their own computer or the school's, to run verifications (tests) with FlussoLab.

- The teacher logs in with email and password and creates verifications: one or more **exercises**, each with its task, **locked blocks** (the IN and OUT blocks the check relies on), visible and **hidden tests** and one or more **variants**, plus opening and closing time.
- They get **one link for the class** and **student codes** to print.
- Students use the usual FlussoLab (`flussolab.s3l.it`): they open the link, enter their code, solve it and press **Hand in**.
- The server **re-checks every submission** with the same engine as the app, including the hidden tests students never see, and shows the teacher a table of results and warnings: same device used by several codes, hand-edited file, locked blocks changed.

No student names on the server, only codes. The teacher keeps the code → student list.

## Requirements

- **Docker**, with or without Portainer.
- **An HTTPS address**, e.g. `https://tests.yourdomain.org`, through a reverse proxy such as Nginx Proxy Manager, Caddy or Traefik. FlussoLab runs on HTTPS, and browsers do not let an HTTPS page talk to a server without HTTPS.

## Install with Portainer

1. **Stacks → Add stack**, give it a name (e.g. `flussolab`) and paste the content of [`docker-compose.yml`](docker-compose.yml) in the *Web editor*.
2. Change the port on the left (`8080:8080`) if needed and press **Deploy the stack**.
3. In **Nginx Proxy Manager** → *Proxy Hosts* → *Add Proxy Host*:
   - **Domain**: `tests.yourdomain.org`
   - **Forward Hostname / IP**: the IP of the Docker machine (or `flussolab-server` if NPM is on the same Docker network), **Port** `8080`
   - **SSL** tab: *Request a new SSL Certificate*, *Force SSL*.
4. Open `https://tests.yourdomain.org/admin` and create the teacher's account: there is only one. It asks for a **setup code**: you find it in the container's log (Portainer → *Containers* → *Logs*). It makes sure nobody else creates the account before you. Alternatively set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the stack and the account is created by itself.

## Install from the command line

With Docker Compose, in the folder with `docker-compose.yml`:

```sh
docker compose up -d
```

Or with a single command:

```sh
docker run -d --name flussolab-server --restart unless-stopped \
  -p 8080:8080 -v flussolab-data:/data \
  -e ALLOWED_ORIGINS=https://flussolab.s3l.it -e TRUST_PROXY=1 \
  ghcr.io/asamu3l/flussolab-server:latest
```

Then set up the reverse proxy as above and open `/admin`.

**User:** the server runs as user **1000:1000**, never as root. At start the container gives the data folder to that user, even a host folder (`./data:/data`) owned by root. For another user set `PUID` and `PGID`.

## Settings

| Variable | Default | What it does |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://flussolab.s3l.it` | Sites students can open and hand in verifications from (comma separated). |
| `APP_URL` | `https://flussolab.s3l.it/` | App address used in the class links. |
| `TRUST_PROXY` | empty | Set to `1` behind a reverse proxy, so the real IP of students is read. Without it the whole class shares one address and the anti-abuse limits may hit everyone at once. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | empty | Optional: create the teacher's account at the first start. |
| `PUID`, `PGID` | `1000` | User and group running the server and owning the data. |
| `PORT` | `8080` | Port inside the container. |
| `DATA_DIR` | `/data` | Where the database (a single file) is kept. |
| `BACKUP_DIR` | empty | Turns on the **automatic backup**: a consistent copy of the database (`flussolab-YYYYMMDD-HHMM.db`) in this folder at start and then every `BACKUP_EVERY` hours. Mount a separate volume there, e.g. `/backup`. |
| `BACKUP_EVERY` | `6` | Hours between two copies. |
| `BACKUP_KEEP` | `30` | Days a copy is kept; older ones are removed. |

## Useful commands

**Forgotten password**

```sh
docker exec -it -u 1000:1000 flussolab-server node src/server.js reset-admin teacher@school.org new-password
```

**Update**
- **Portainer:** press *Pull and redeploy* on the stack.
- **Command line:**

  ```sh
  docker compose pull && docker compose up -d
  ```

  or, if you started it with `docker run`:

  ```sh
  docker pull ghcr.io/asamu3l/flussolab-server:latest
  docker rm -f flussolab-server
  ```

  and then run the `docker run` command above again.

Data stays in the `flussolab-data` volume.

**Backup**: with `BACKUP_DIR=/backup` and a volume (or a host folder) mounted at `/backup`, the server writes a copy of the database there by itself, at start and every `BACKUP_EVERY` hours, and removes copies older than `BACKUP_KEEP` days. To restore one, stop the container and copy the file over `/data/flussolab.db`. Without it, all data is in the `flussolab-data` volume:

```sh
docker run --rm -v flussolab-data:/data -v "$PWD":/backup alpine tar czf /backup/flussolab-backup.tgz -C /data .
```

## How a verification works

1. **Exercises.** A verification can have up to 10 exercises. Students open each one in its own tab and **Hand in** sends all of them together; they can hand in again until it closes.
2. **Locked blocks.** For each variant choose the INs (the variable the data goes into) and the OUTs (the variable to print). Students find them in the diagram with a padlock: they can move them, even inside a loop, and add blocks in between, but not delete or edit them.
3. **Tests.**
   - **Input**: one value per line, in the order the program reads them. Every IN that runs, locked or added by the student, takes the next value, so a loop asking again for a wrong value works too.
   - **Expected output**: one value per line, one for each time a locked OUT writes. Text written by other OUTs does not count; numbers are compared with a small tolerance, so 7 and 7.0 are equal.
4. **Variants.** Every code gets one variant of each exercise; codes alternate between them, so students sitting next to each other get different combinations. Editing a verification later keeps the variants already given to the codes. Students never see which variant they have (neither in the app nor on the slip with the code): only you see it in the results.
5. **Results.** One row per code, with the result of every exercise and the total; the ZIP holds one `.flusso` file per student and exercise, and `risultati.csv`.
6. **One code, one device.** A code works on the first device (computer and browser) that opens it: on another one the app says the code is in use. If a student has to change computer, free the code with **Unlock** on the verification's page.
7. **Autosave.** During the verification the app sends the students' work to the server every minute (only what changed). A draft is not a submission: if a student never presses Hand in, you see the time of the last draft in the results and can **use it as the submission** for that code or for everyone at once; it is graded like the others and marked *From draft*.
8. **Times.** Before it opens the link shows nothing. The app shows students the closing time and the time left, and warns them 5 minutes before. At the closing time they can no longer edit, but still have the **extra minutes** you chose (5 by default) just to press Hand in; then the hand-in is closed. Until then a student can hand in again: the last submission counts, and the teacher also sees the earlier ones. From the verification's page you can **extend** by 5 or 15 minutes or close at once: the students' app updates by itself within half a minute.

## Privacy

The server only stores:
- **codes**, without names;
- **submitted diagrams** and **results**;
- **the time**;
- **the random device code** made by the app;
- **the IP address** of the submission.

There are no student accounts, no student cookies and no access logs. Data stays on the machine running the server, and whoever installs it is responsible for it: the school or the teacher.

## Versions

The app starts from 1.x, the server from 0.x. App and server exchange a *protocol* number: if it does not match, the app shows a clear message instead of an error.

- **Server 0.2** or newer (protocol 2) needs **FlussoLab 1.2** or newer. FlussoLab 1.2 also works with server 0.1. The time warnings and the editing lock at the closing time need FlussoLab 1.3 and server 0.3; the device-bound codes and the autosave need FlussoLab 1.4 and server 0.4 (an older app keeps working, without them).
- Updating from 0.1 is automatic: the data is converted at the first start and the verifications you already have become verifications with one exercise.
- The changes of every version are in the [changelog](CHANGELOG.md).

## Development

```sh
npm run sync-core   # copy core.js from the main branch
npm test
npm start           # http://localhost:8080/admin
```

No external dependencies: Node.js 22.13 or newer, with `node:sqlite`. License [CC BY-NC-SA 4.0](https://github.com/aSamu3l/FlussoLab/blob/main/LICENSE), like FlussoLab.
