# FlussoLab · verification server

[Italiano](README.it.md) · **English**

This is the **`server` branch** of [FlussoLab](https://github.com/aSamu3l/FlussoLab): a small server a teacher installs on their own computer or the school's, to run verifications (tests) with FlussoLab.

- The teacher logs in with email and password and creates verifications: task, **locked blocks** (the IN and OUT blocks the check relies on), visible and **hidden tests**, one or more **variants**, opening and closing time.
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
4. Open `https://tests.yourdomain.org/admin` and create the teacher's account: there is only one.

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

## Settings

| Variable | Default | What it does |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://flussolab.s3l.it` | Sites students can open and hand in verifications from (comma separated). |
| `APP_URL` | `https://flussolab.s3l.it/` | App address used in the class links. |
| `TRUST_PROXY` | empty | Set to `1` behind a reverse proxy, so the real IP of students is read. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | empty | Optional: create the teacher's account at the first start. |
| `PORT` | `8080` | Port inside the container. |
| `DATA_DIR` | `/data` | Where the database (a single file) is kept. |

## Useful commands

**Forgotten password**

```sh
docker exec -it flussolab-server node src/server.js reset-admin teacher@school.org new-password
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

**Backup**: all data is in the `flussolab-data` volume.

```sh
docker run --rm -v flussolab-data:/data -v "$PWD":/backup alpine tar czf /backup/flussolab-backup.tgz -C /data .
```

## How a verification works

1. **Locked blocks.** For each variant choose the INs (the variable the data goes into) and the OUTs (the variable to print). Students find them in the diagram with a padlock: they can move them, even inside a loop, and add blocks in between, but not delete or edit them.
2. **Tests.**
   - **Input**: one value per line, in the order the program reads them. Every IN that runs, locked or added by the student, takes the next value, so a loop asking again for a wrong value works too.
   - **Expected output**: one value per line, one for each time a locked OUT writes. Text written by other OUTs does not count; numbers are compared with a small tolerance, so 7 and 7.0 are equal.
3. **Variants.** Codes alternate between variants, so students sitting next to each other get different exercises.
4. **Times.** Before it opens the link shows nothing; after it closes no one can hand in. Until then a student can hand in again: the last submission counts, and the teacher also sees the earlier ones.

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

## Development

```sh
npm run sync-core   # copy core.js from the main branch
npm test
npm start           # http://localhost:8080/admin
```

No external dependencies: Node.js 22.13 or newer, with `node:sqlite`. License [CC BY-NC-SA 4.0](https://github.com/aSamu3l/FlussoLab/blob/main/LICENSE), like FlussoLab.
