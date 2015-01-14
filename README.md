# Puzzle Tools
Various useful pages for solving puzzles.


## Caesar Shift

Generates all twenty-six possible caesar shifts of an input
phrase, for rapid perusal. With some extra features.

 * `Reverse`: Show a string and its reverse -- for when you
   don't know which way the encoded text is facing

 * `Double`: Write two copies of a string in a row -- for when you don't know where the encded text begins

 * `Highlight`: Highlight the outputs that look most like English

## Highlighting the most English-like outputs

The method for highlighting the most promising outputs is a
heuristic based on trigram distribution. The repository comes
with a distribution file that's ready to go. If you're
interested in re-generating the distribution file, you'll need
wget, python, and unzip available on your system. Then run:

```
$ cd shift/distribution
$ make
```
