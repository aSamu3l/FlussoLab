# Contribuire a FlussoLab

Grazie per l'interesse! FlussoLab è mantenuto da [aSamu3l](https://github.com/aSamu3l).

## Come contribuire

- **Hai trovato un problema o hai un'idea?** Apri una [issue](https://github.com/aSamu3l/FlussoLab/issues).
- **Vuoi proporre una modifica?** Fai un fork, crea un ramo, poi apri una pull request verso questo repository.
  Descrivi cosa cambia e perché.

Il modo migliore per migliorare FlussoLab è contribuire qui, al progetto principale,
così il lavoro arriva a tutte le scuole che lo usano.

## Aggiungere una lingua

Tutti i testi di FlussoLab sono nella cartella [`lang/`](lang): un file per lingua.
Per aggiungerne una non serve toccare il codice:

1. Copia `lang/en.json` (o `lang/it.json`) e chiamalo con il codice della lingua, ad esempio `lang/fr.json`.
2. Nel file nuovo cambia `"code"` (es. `"fr"`) e `"name"` (il nome della lingua scritto nella lingua stessa, es. `"Français"`).
3. Traduci i testi. Lascia uguali le chiavi a sinistra e i segnaposto come `{0}`, `{1}` o `{1:tyk}`:
   vengono sostituiti dal programma. Le parole chiave dei blocchi (`IN`, `OUT`, `IF`, `WHILE`…) restano in inglese.
   - `ui`: menu, pulsanti e messaggi di errore
   - `pseudo`: le parole dello pseudocodice
   - `python`: i commenti del codice Python
   - `guide`: la guida (in HTML)
   - `examples`: gli esempi pronti; puoi tradurre i testi tra virgolette e i nomi delle variabili
4. Aggiungi la lingua in `lang/languages.json`, ad esempio `{ "code": "fr", "name": "Français" }`.
5. Apri una pull request.

I test automatici controllano che il file non abbia voci mancanti o segnaposto sbagliati
(si avviano anche in locale con `node --test tests/*.test.js`). Una volta accettata, la lingua compare da sola
nel menu **Aiuto** e viene scelta in automatico per chi ha il browser in quella lingua.

## Riconoscimenti

Chi contribuisce con una modifica accettata viene aggiunto all'elenco dei contributori nel README.

## Licenza dei contributi

Inviando un contributo dichiari che è un tuo lavoro e accetti che venga distribuito
con la licenza del progetto ([CC BY-NC-SA 4.0](LICENSE)).
