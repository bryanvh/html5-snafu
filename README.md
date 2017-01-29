# Snafu

This is an HTML5 version of the game Snafu.

There are two players, Red and Blue. Each player operates a "snake" that moves around the grid. Both players share the same keyboard: Red uses AWSD keys and Blue uses arrow keys.

If your snake runs into the path left behind by itself or the other snake, you lose. The object is to trap the other snake before you run out of room.

Note: to run this in a browser, you'll need a web server. For example, you can use Python to run a web server in the code directory like this:
```
python -m SimpleHTTPServer 8000
```

Then access http://localhost:8000/snafu.html from your browser.

