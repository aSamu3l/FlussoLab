# Contributing to FlussoLab

[Italiano](CONTRIBUTING.it.md) · **English**

Thanks for your interest! FlussoLab is maintained by [aSamu3l](https://github.com/aSamu3l).

## How to contribute

- **Found a problem or have an idea?** Open an [issue](https://github.com/aSamu3l/FlussoLab/issues).
- **Want to propose a change?** Fork the repository, create a branch, then open a pull request to this repository.
  Describe what changes and why.

The best way to improve FlussoLab is to contribute here, to the main project,
so the work reaches every school that uses it.

## Adding a language

All of FlussoLab's texts are in the [`lang/`](lang) folder, one file per language.
You don't need to touch the code to add one:

1. Copy `lang/en.json` and name it after the language code, for example `lang/fr.json`.
2. In the new file change `"code"` (e.g. `"fr"`) and `"name"` (the language's name in that language, e.g. `"Français"`).
3. Translate the texts. Keep the keys on the left and placeholders such as `{0}`, `{1}` or `{1:tyk}` unchanged:
   the program fills them in. Block keywords (`IN`, `OUT`, `IF`, `WHILE`…) stay in English.
   - `ui`: menus, buttons and error messages
   - `pseudo`: the pseudocode words
   - `python`: the comments in the Python code
   - `guide`: the guide (in HTML)
   - `examples`: the ready-made examples; you can translate the quoted texts and the variable names
4. Add the language to `lang/languages.json`, for example `{ "code": "fr", "name": "Français" }`.
5. Open a pull request.

The automatic tests check that the file has no missing entries or wrong placeholders
(you can also run them locally with `node --test tests/*.test.js`). Once accepted, the language appears by itself
in the **Help** menu and is picked automatically for people whose browser uses that language.

## Credits

Everyone whose change is accepted is added to the list of contributors in the README.

## License of contributions

By sending a contribution you state that it is your own work and agree that it is distributed
under the project's license ([CC BY-NC-SA 4.0](LICENSE)).
