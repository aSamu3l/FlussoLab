# FlussoLab

**Italiano** · [English](README.md)

Editor di diagrammi di flusso che funziona nel browser, pensato per la scuola.
Niente da installare: va su PC, Mac, Chromebook e tablet.

**[Apri FlussoLab](https://flussolab.s3l.it/)**

![Il diagramma "Media dei voti" in FlussoLab](docs/editor.png)

## Cosa fa

- Blocchi `IN`, `OUT`, `OUTLN`, assegnazione, `IF`, `WHILE`, `DO WHILE`, `FOR`, `VAR` e commento
- Tipi come in C (`int`, `float`, `string`, `bool`), automatici o dichiarati
- Esecuzione completa o passo passo, con le variabili
- Errori spiegati in modo semplice
- Pseudocodice e codice Python generati in automatico
- Più diagrammi aperti in schede, salvataggio in file `.flusso`, esportazione in PNG e consegna in un unico ZIP
- Italiano e inglese (e altre lingue in arrivo), tema chiaro e scuro

## Come si presenta

**Esecuzione passo passo**: il blocco attivo è evidenziato e a destra si vedono le variabili.

![Esecuzione passo passo del programma "Numero primo"](docs/esecuzione.png)

**Errori chiari**: il blocco sbagliato viene segnalato prima di eseguire, con un messaggio che spiega cosa correggere.

![Errore su un blocco OUTLN con un testo senza virgolette](docs/errore.png)

**Anche su telefono e tablet**, con il tema scuro.

<img src="docs/telefono.png" alt="FlussoLab su telefono, tema scuro" width="300">

## Installare come app

FlussoLab si può installare e funziona anche senza internet:

- **Chrome o Edge** (Windows, Chromebook, Android): menu del browser → «Installa FlussoLab».
- **iPhone e iPad**: Safari → Condividi → «Aggiungi alla schermata Home».

## Contribuire

Segnalazioni e proposte sono benvenute: leggi [CONTRIBUTING.it.md](CONTRIBUTING.it.md).
Vuoi FlussoLab nella tua lingua? Basta aggiungere un file nella cartella [`lang/`](lang): trovi i passaggi in CONTRIBUTING.it.md.

## Autore

Sviluppato e mantenuto da [aSamu3l](https://github.com/aSamu3l).

## Licenza

[CC BY-NC-SA 4.0](LICENSE): gratuito e aperto a tutti, vietato l'uso commerciale.
Le versioni modificate devono citare l'autore, restare pubbliche con la stessa licenza
e usare un nome diverso da "FlussoLab".
