# What's new

[Italiano](CHANGELOG.it.md) · **English**

Every change to FlussoLab, newest first. Version numbers follow *major.features.fixes*.

## 1.1.2 · October 20, 2026

- The **ready-made examples** declare the type of what they read (`IN int n`, `IN float grade`), so the generated Python code works too.
- The **PNG image** window closes after the download, like *Save*.
- Removed styles and texts left over from the old exercise editor.
- Updated screenshots in the README and on the welcome page; the README lists the newer features (Tests, links, assignments, drag and drop).

## 1.1.1 · October 19, 2026

- The *Tests* tab no longer shows the device code and the device history: they stay only inside the `.flusso` file, for the teacher.

## 1.1.0 · October 19, 2026

- **Drop files on the window**: one or more `.flusso` files dropped anywhere on FlussoLab open as new tabs. Works in every browser, Safari and Firefox included.
- **Open from a ZIP**: dropping a ZIP (or choosing it in *File → Open*) lists the diagrams inside and asks which ones to open. The ZIP made by *Export submission* works too.
- *File → Open* accepts several files at once.
- The *About* window links to this page.

## 1.0.3 · October 19, 2026

- With the installed app (Chrome, Edge), double-clicking a `.flusso` file opens it as a **new tab in the window already open**, instead of another window.
- If that diagram is already open, FlussoLab switches to its tab instead of opening it twice.

## 1.0.2 · October 17, 2026

- An **endless loop** no longer freezes the page: *Stop* answers right away, even at full speed.
- When a program runs for several seconds without asking anything, the warning “The program does not end?” appears.
- The console keeps at most the last 3000 lines.

## 1.0.1 · October 16, 2026

- **Division**: `/` always gives a decimal result (`7 / 2` → 3.5), `//` is the integer division, rounded down (`7 // 2` → 3). Putting a decimal result in an `int` variable, the message suggests `//`.
- **Tests**: an IN ends the line like in the console, numbers are compared with a small tolerance (7 equals 7.0), with “Only the last line” only that line is shown.
- Closing or reloading the page no longer asks to save: the work stays saved in the browser.
- Complete sitemap, with languages and images.

## 1.0.0 · October 10, 2026

First numbered version.

- IN, OUT/OUTLN, assignment, IF, WHILE, DO WHILE, FOR, VAR and comment blocks; run all at once or step by step, with variables and trace.
- C-like types (`int`, `float`, `string`, `bool`), automatic or declared; clear error messages, checked before running.
- Pseudocode and Python code generated from the diagram.
- Several diagrams in tabs, `.flusso` files, PNG images, *Export submission* in one ZIP.
- Shareable links with the diagram compressed inside, no server needed.
- **Tests** tab to check a program with inputs and expected outputs; blocks can be disabled.
- **Tests from the teacher's server**: student code, locked blocks, hidden tests, hand-in.
- Installable app that also works offline, in Italian and English; more languages come with one file.
