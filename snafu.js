var SnafuApp = (function() {

  function SpeedEffect(amount, xcell, ycell, board) {
    var imageObj = new Image();
    imageObj.onload = function() {
      var img = new Kinetic.Image({
        x: xcell * board.getUnitSize() + 1,
        y: ycell * board.getUnitSize() + 1,
        image: imageObj,
        width: board.getUnitSize() - 2,
        height: board.getUnitSize() - 2
      });
    
      board.getLayer().add(img);
    };
    imageObj.src = 'speed.png';
    board.setEffect(this, xcell, ycell);

    this.apply = function(player) {
      player.addSpeed(amount);
    }
  }

  function PortalEffect(xcell, ycell, board) {
    var imageObj = new Image();
    imageObj.onload = function() {
      var img = new Kinetic.Image({
        x: xcell * board.getUnitSize() + 1,
        y: ycell * board.getUnitSize() + 1,
        image: imageObj,
        width: board.getUnitSize() - 2,
        height: board.getUnitSize() - 2
      });
    
      board.getLayer().add(img);
    };
    imageObj.src = 'portal.png';
    board.setEffect(this, xcell, ycell);

    this.sibling = null;
    this.xcell = xcell;
    this.ycell = ycell;

    this.apply = function(player) {
      player.setCellPosition(this.sibling.xcell, this.sibling.ycell);
    }

    this.link = function(portalEffect) {
      this.sibling = portalEffect;
      portalEffect.sibling = this;
    }
  }
  
  
  var IDLE = 0, UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4;

  function Player(name, fill, board, km, xcell, ycell) {
    var rect = new Kinetic.Rect({
      x: board.getUnitSize() * xcell,
      y: board.getUnitSize() * ycell,
      width: board.getUnitSize(),
      height: board.getUnitSize(),
      fill: fill,
      stroke: 'gray',
      lineJoin: 'bevel',
      strokeWidth: 3,
    });
    var curDirection = IDLE;
    var nextDirection = IDLE;
    var speed = 1;
    var directions = [UP, DOWN, LEFT, RIGHT];
    var oppositeDirections = [DOWN, UP, RIGHT, LEFT];

    var keyMap = {};
    for (var i = 0; i < directions.length; i++) {
        keyMap[km[i]] = directions[i];
    }

    this.getFill = function() { return rect.getFill(); }
    this.getX = function() { return rect.getX(); }
    this.getY = function() { return rect.getY(); }
    this.getName = function() { return name; }
    this.addSpeed = function(amount) { speed += amount; }
    this.setCellPosition = function(xcell, ycell) {
      rect.setX(board.getUnitSize() * xcell);
      rect.setY(board.getUnitSize() * ycell);
    }

    board.addPlayer(this, rect);
    board.enter(this, rect.getX() / board.getUnitSize(),
                      rect.getY() / board.getUnitSize());
    board.exit(this, rect.getX(), rect.getY());

    function keyHandler(e, directionKey, c) {
      var direction = keyMap[directionKey.pop()];
      // TODO: try to code this without a loop
      for (var i = 0; i < directions.length; i++) {   
        if (direction == directions[i]) {
          if (curDirection == oppositeDirections[i]) {
            return; // no backtracking allowed
          }
          nextDirection = directions[i];
          if (curDirection == IDLE) {
            curDirection = directions[i];
          }
          return;
        }
      }
    }

    var kjs = KeyboardJS.on(Object.keys(keyMap).toString(), keyHandler);
    var anim = new Kinetic.Animation(animate.bind(this), board.getLayer());
    anim.start();

    this.stop = function () {
      anim.stop();
      kjs.clear();
    }

    function animate(frame) {
      var unitSize = board.getUnitSize();
      var tx = rect.getX(), ty = rect.getY();
      var ts = speed;
        
      function nextPosition(current, innerDir, outerDir, max) {
        var next = current;
        if (curDirection == innerDir) {
          next -= speed;
        } else if (curDirection == outerDir) {
          next += speed;
        }
        if (next != current) {
          // find out if we need to wrap around
          if (next + unitSize <= 0) {
            next = max - unitSize;
          } else if (next >= max) {
            next = 0;
          }
        }
        return next;
      }

      tx = nextPosition(rect.getX(), LEFT, RIGHT, board.getWidth());
      ty = nextPosition(rect.getY(), UP, DOWN, board.getHeight());

      if (tx != rect.getX()) {
        r = rect.getX() % unitSize;
        			
        if (r < ts && r >= 0) {
          board.exit(this);
        
          var enterx = tx;
          if (curDirection == RIGHT) {
            if (tx + unitSize < board.getWidth()) {
              enterx += unitSize;
            } else {
              enterx = 0;
            }
          } else {
            if (tx < 0) {
              enterx += board.getWidth();
            }
          }
        
          if (board.enter(this, enterx / unitSize, ty / unitSize)) {
            // continue;
          } else {
            return;
          }
        }
        
        // recalculate tx here since the speed might have changed
        tx = nextPosition(rect.getX(), LEFT, RIGHT, board.getWidth());
        
        r = tx % unitSize;
        if (r < ts && r >= 0) {
          tx -= r;
          curDirection = nextDirection;
        }
        
        rect.setX(tx);
      }
		
      if (ty != rect.getY()) {
        r = rect.getY() % unitSize;
        
        if (r < ts && r >= 0) {
          board.exit(this);
        
          var entery = ty;
          if (curDirection == DOWN) {
            if (ty + unitSize < board.getHeight()) {
              entery += unitSize;
            } else {
              entery = 0;
            }
          } else {
            if (ty < 0) {
              entery += board.getHeight();
            }
          }
        
          if (board.enter(this, tx / unitSize, entery / unitSize)) {
            // continue
          } else {
            return;
          }
        }
        
        // recalculate ty here since the speed might have changed
        ty = nextPosition(rect.getY(), UP, DOWN, board.getHeight());
        
        r = ty % unitSize;
        if (r < speed && r >= 0) {
          ty -= r;
          curDirection = nextDirection;
        }
        
        rect.setY(ty);
      }
    }
  }

  function Board(s, u) {
    this.layer = new Kinetic.Layer();
    this.stage = s;
    this.units = u;
    this.unitSize = s.getWidth() / u;
    this.players = [];

    this.getUnitSize = function() { return this.unitSize; }
    this.getLayer = function() { return this.layer; }
    this.getStage = function() { return this.stage; }
    this.getWidth = function() { return this.stage.getWidth(); }
    this.getHeight = function() { return this.stage.getHeight(); }
    this.setEffect = function(e, xcell, ycell) { this.effects[xcell][ycell] = e; }

    this.init = function() {
      this.visits = new Array(this.units);
      for (var i = 0; i < this.visits.length; i++) {
        this.visits[i] = new Array(this.units);
        for (var j = 0; j < this.visits[i].length; j++) {
          this.visits[i][j] = false;
        }
      }
  
      this.effects = new Array(this.units);
      for (var i = 0; i < this.effects.length; i++) {
        this.effects[i] = new Array(this.units);
      }
      
      var e1 = new SpeedEffect(0.5, 6, 6, this);
      var e2 = new SpeedEffect(0.5, 10, 13, this);
      var e3 = new SpeedEffect(0.5, 19, 12, this);
      var e4 = new PortalEffect(3, 15, this);
      var e5 = new PortalEffect(15, 4, this);
      e4.link(e5);
  
      for (var i = 0; i <= this.units; i++) {
        this.layer.add(new Kinetic.Line({
          points: [0, i * this.unitSize, this.stage.getWidth(), i * this.unitSize],
          stroke: 'gray',
          strokeWidth: 0.5,
          dash: [10, 2]
        }));
  
        this.layer.add(new Kinetic.Line({
          points: [i * this.unitSize, 0, i * this.unitSize, this.stage.getHeight()],
          stroke: 'gray',
          strokeWidth: 0.5,
          dash: [10, 2]
        }));
      }

      this.stage.add(this.layer);
    }

    this.init.call(this);

    this.addPlayer = function(player, rect) {
      this.players.push(player);
      this.layer.add(rect);
    }

    this.stop = function() {
      for (var i = 0; i < this.players.length; i++) {
        this.players[i].stop();
      }
    }

    this.display = function(t, f) {
      var complexText = new Kinetic.Text({
        x: this.getUnitSize() * 2,
        y: this.getUnitSize() * 10,
        text: t,
        fontSize: 18,
        fontStyle: 'bold',
        fontFamily: 'Tahoma',
        fill: 'white',
        width: this.getUnitSize() * (this.units - 4),
        padding: 20,
        align: 'center'
      });

      var rect = new Kinetic.Rect({
        x: this.getUnitSize() * 2,
        y: this.getUnitSize() * 10,
        stroke: '#555',
        strokeWidth: 5,
        fill: f,
        width: complexText.width(),
        height: complexText.height(),
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: {x:10,y:10},
        shadowOpacity: 0.2,
        cornerRadius: 10
      });

      this.layer.add(rect);
      this.layer.add(complexText);
    }

    this.enter = function(player, xcell, ycell) {
      var x = Math.floor(xcell);
      var y = Math.floor(ycell);
		
      if (this.visits[x][y]) {
        this.stop();
        
        var winner = ((player == this.players[0]) ? this.players[1] : this.players[0]);
        this.display(winner.getName() + " is the winner!!", winner.getFill());
        return false;
      }

      if (this.effects[x][y]) {
        this.effects[x][y].apply(player);
      } else {
        this.visits[x][y] = true;
      }

      return true;
    }

    this.exit = function(player) {
      this.paintCell(player.getFill(), player.getX(), player.getY(), 0);
    }
	
    this.paintCell = function(color, x, y, crop) {
      var r = new Kinetic.Rect({
        x: x + crop + 1,
        y: y + crop + 1,
        width: this.unitSize - 2,
        height: this.unitSize - 2,
        fill: color
      });
      this.layer.add(r);
      r.moveToBottom();
      this.layer.draw();
    }

  }

  return {
    buildPlayer: function(name, fill, board, keyMap, xcell, ycell) {
      return new Player(name, fill, board, keyMap, xcell, ycell);
    },
    buildBoard: function(stage, units) {
      return new Board(stage, units);
    }
  }
})();
