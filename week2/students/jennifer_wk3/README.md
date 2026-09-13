# Endless Wordle

An unlimited Wordle-style game with Normal (one word in six tries) and Hard (four words at once in nine tries) modes. It uses 3,185 five-letter words from Merriam-Webster's Common Word Finder list. Four-letter words pluralized with a final `s` are included. Statistics are saved in the browser.

Dictionary source: <https://www.merriam-webster.com/wordfinder/classic/begins/common/5/a/1> (one page for each starting letter).

## Run it

From this folder, start a local server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
