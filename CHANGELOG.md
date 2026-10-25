# Server changelog

[Italiano](CHANGELOG.it.md) · **English**

## 0.4.0 · October 25, 2026

- **One code, one device**: a student code works on the first device that opens it; on another one the app says it is in use. The teacher frees it with **Unlock** on the verification's page (*Codes in use*).
- **Autosave**: during the verification the app sends the work to the server every minute, only what changed. Drafts appear in the results with their time; the teacher can **use a draft as the submission** for one code or for all the missing ones at once (graded like the others, marked *From draft*).
- **Automatic backup**: with `BACKUP_DIR` (e.g. `/backup`, on its own volume) the server writes a consistent copy of the database at start and every `BACKUP_EVERY` hours (6), keeping `BACKUP_KEEP` days (30).
- The image published on ghcr.io carries a signed **provenance attestation** (`gh attestation verify`).
- Database schema 3 (migrated by itself at the first start).

## 0.3.0 · October 25, 2026

- **Verification time**: at the closing time students can no longer edit, but still have the **extra minutes** chosen by the teacher (5 by default) to hand in. The app shows them the closing time, the time left and the warnings; the server also sends its own clock, so the count is right even when the computer's clock is wrong.
- **Extend** by 5 or 15 minutes and **Close at once** from the verification's page; the students' app updates by itself.
- **Setup code** at the first start, printed in the log: without it nobody can create the teacher's account in your place.
- Limits on texts and output of the programs graded on the server (a program that writes forever no longer slows it down); the results CSV cannot contain formulas.
- The login cookie is marked secure only when `TRUST_PROXY` is on, as documented.

## 0.2.0 · October 22, 2026

- **Verifications with several exercises**: up to 10 exercises, each with its own variants. Every code gets one variant per exercise, with different combinations for students sitting next to each other.
- Students find one exercise per tab and hand them all in together (FlussoLab 1.2).
- Results with one column per exercise and the total; the ZIP holds one file per student and exercise and a `risultati.csv` with all the columns.
- Editing a verification keeps the variants already given to the codes.
- **The variant stays secret**: the server no longer sends the variant's name to the student, and the codes to print do not show it. So a student copying from a neighbour with another variant shows up in the tests.
- Test errors explained in words; fixed the page of codes to print.
- Protocol 2. Data from 0.1 is converted by itself at the first start.

## 0.1.0 · October 10, 2026

- First version: teacher account, verifications with variants, locked blocks and hidden tests, student codes, submissions graded on the server, warnings, ZIP with the results, Docker image.
