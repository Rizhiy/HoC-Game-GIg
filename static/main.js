var wsUri = "ws://localhost:8080/";
var output;

class Connection {
  constructor() {
    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.onopen = e => this.opened(e)
    this.ws.onclose = e => this.closed(e)
    this.ws.onmessage = this._message.bind(this)
    this.ws.onerror = e => this.error(e)

    this.handlers = []
  }

  send(json) {
    this.ws.send(JSON.stringify(json))
  }

  opened() {}
  closed() {}
  error() {}

  _message(message) {
    let json = JSON.parse(message.data)
    this.handlers.forEach(cb => cb(json))
  }

  on(cb) {
    this.handlers.push(cb)
  }
}


var emoji
function loadEmoji(cb) {
    var xhr = new XMLHttpRequest();

    xhr.responseType = "arraybuffer";

    xhr.addEventListener("load", function(){
		// Remove progress bar
		document.getElementById("loadingcontainer").remove();

        var arrayBufferView = new Uint8Array( this.response );
        var blob = new Blob( [ arrayBufferView ], { type: "image/png" } );
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL( blob );

        emoji = imageUrl
        cb(imageUrl);
    });

    xhr.addEventListener("progress", function(p){
        var el = document.getElementById("loadingbar")
		el.style.width = (100 * p.loaded / p.total) + "%";
    });

    xhr.open("GET", "emoji.png");
    xhr.send();
}

let images = {}

function createDiv() {
  var img = document.createElement("div");
  img.style.width = "72px";
  img.style.height = "72px";
  img.style.background = "url(" + emoji + ")";
  img.style.position = "absolute"
  return img
}

function addGround(){
    var ground = document.createElement("div");
    ground.style.width = "4000px";
    ground.style.height = "100px";
    ground.style.backgroundColor = "black";
    ground.style.position = "absolute";
    ground.style.top = "2000px";
    ground.style.left = "0px";
    return ground
}

function addSky(){
    var sky = document.createElement("div");
    sky.style.width = "4000px";
    sky.style.height = "100px";
    sky.style.backgroundColor = "blue";
    sky.style.position = "absolute";
    sky.style.top = "0px";
    sky.style.left = "0px";
    return sky
}

function addLeft(){
    var left = document.createElement("div");
    left.style.width = "100px";
    left.style.height = "2000px";
    left.style.backgroundColor = "grey";
    left.style.position = "absolute";
    left.style.top = "0px";
    left.style.left = "0px";
    return left;
}

function addRight(){
    var right = document.createElement("div");
    right.style.width = "100px";
    right.style.height = "2000px";
    right.style.backgroundColor = "grey";
    right.style.position = "absolute";
    right.style.top = "0px";
    right.style.right = "0px";
    return right;
}

function setEmoji(img, name) {
  var pos = emojiNames.indexOf(name);
  var x = pos % 32;
  var y = Math.floor(pos / 32);

  img.style.backgroundPosition = "-" + (72*x) + "px -" + (72*y) + "px";
  img.style.backgroundSize = "2304px 2304px";

  document.querySelector(".world").appendChild(img);
}

function render(entities) {
  let byId = {}
  for (var i=0; i<entities.length; i++) {
    let entity = entities[i]
    byId[entity.id] = entity
  }

  for (let id in byId) {
    var entity = byId[id]
    var image = images[id]
    if (!image) {
      images[id] = image = createDiv()
    }
    setEmoji(image, entity.name)
    image.style.transform = `translate(${entity.x}px, ${entity.y}px) scale(${entity.scale}) rotate(${entity.rot}deg)`
    // TODO opacity
    // TODO visible
  }
  
  let world = document.querySelector(".world")

  let player = byId[playerid]
  if (player) {
    console.log(player)
    var w = container.offsetWidth
    var h = container.offsetHeight
    var cx = -player.x + w/2
    var cy = -player.y + h/2
    world.style.transform = `translate(${cx}px, ${cy}px)`
  }
  // TODO remove dead entities
}

function choose(options) {
  return options[Math.floor(Math.random() * options.length)]
}

function doRender(){
	var update = updates.shift()
	if(update){
		render(update)
	}
}

var container = document.querySelector('.container')
var updates = []
function main(conn, emoji) {
  window.conn = conn

  conn.on(json => {
    switch (json.type) {
      case 'world':
        updates.push(json.entities)
        break
      case 'player_id':
		console.log("I AM " + json.id)
        playerid = json.id
        break
    }
  })

  conn.send({ type: 'spawn', name: choose(emojiNames) });

    document.querySelector(".world").appendChild(addGround());
    document.querySelector(".world").appendChild(addSky());
    document.querySelector(".world").appendChild(addLeft());
    document.querySelector(".world").appendChild(addRight());

  let fps = 25;
  window.setInterval(doRender, 1000.0 / fps);

}

function sendKey(e){
    e = e || window.event;
    window.conn.send({type:'keydown',keyCode: e.keyCode})
}
window.addEventListener("keydown",sendKey);

window.addEventListener("load", () => {
       loadEmoji(emoji => {
               let conn = new Connection()
               conn.opened = () => {
                       main(conn, emoji)
               }
       });
})
 
