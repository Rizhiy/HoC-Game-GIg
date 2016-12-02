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
		document.querySelector(".editor").style.visibility = "visible";

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
    ground.style.width = "4100px";
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
    right.style.right = "-100px";
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

var messageboxes = {}
var mbid = 0;
function addMessageBox(entid, msg) {
    var div = document.createElement("div")
    div.style.borderRadius = "32px"
    div.style.backgroundColor = "beige"
    div.style.fontSize = "3em"
    div.style.padding = "16px"
    div.style.position = "absolute"
    div.style.transform = "translate(-50%, -100%)"
    div.style.visibility = "hidden"
    div.style.zIndex = 1
    div.innerHTML = msg
    
    document.querySelector(".world").appendChild(div)
    
    mbid += 1
    messageboxes[mbid] = {div, id: entid};
    
    function die(id, div){
        setTimeout(function(){
            div.remove()
            delete messageboxes[id]
        }, 3000)
    }
    die(mbid, div);
}

let byId = {}
function render(entities) {
    byId = {}
  let msgboxesById = {}
  for (var i=0; i<entities.length; i++) {
    let entity = entities[i]
    byId[entity.id] = entity
  }
  
  let msgkeys = Object.keys(messageboxes)
  for(var i=0; i<msgkeys.length; i++){
    let msgbox = messageboxes[msgkeys[i]]
    if (!msgboxesById[msgbox.id]){
        msgboxesById[msgbox.id] = []
    }
    msgboxesById[msgbox.id].push(msgbox)
  }

  for (let id in byId) {
    var entity = byId[id]
    var image = images[id]
    if (!image) {
      images[id] = image = createDiv()
		
	  // Add wand
	  var wand = createDiv()
	  wand.className = 'wand'
	  wand.style.transform = `rotate(90deg) translate(0px, -36px) scale(0.5)`
  
	  var wand_pos = emojiNames.indexOf('soft ice cream')
	  var wand_x = wand_pos % 32;
	  var wand_y = Math.floor(wand_pos / 32);
	  wand.style.backgroundPosition = "-" + (72*wand_x) + "px -" + (72*wand_y) + "px";
	  wand.style.backgroundSize = "2304px 2304px";

	  image.appendChild(wand);
    }
    setEmoji(image, entity.name)
    image.style.transform = `translate(${entity.x}px, ${entity.y}px) scale(${entity.scale}) rotate(${entity.rot}deg)`
    
    var msgs = msgboxesById[id]
    if(msgs){
        for(var i=0; i<msgs.length; i++){
            var msg = msgs[i]
            msg.div.style.left = (entity.x + 36) + "px"
            msg.div.style.top = entity.y + "px"
            msg.div.style.visibility = "visible"
        }
    }
    
    // TODO opacity
    // TODO visible
  }
  
  let world = document.querySelector(".world")

  let player = byId[playerid]
  if (player) {
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
  updates = updates.slice(updates.length - 5)
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
      case 'messagebox':
        addMessageBox(json.id, json.message)
        break
    }
  })

  conn.closed(() => {
    console.log('closed!')
    document.body.innerHTML = ''
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

// Mouse event handler: Change orientation of wand to follow mouse
function onWorldMouse(e){
	
	// Get mouse coords
	var mouse_x = e.clientX
	var mouse_y = e.clientY
	
	// Get 'wand' div elements
	var wands = document.getElementsByClassName('wand')
	console.log(wands)

	// For each wand point it at mouse loc
	for (var wand_idx=0; wand_idx < wands.length; wand_idx++) {
		//console.log(wands.length)
		console.log(wands[wand_idx])
		console.log(typeof(wands[wand_idx]))
		console.log(wands[wand_idx].parentNode)
		var rect = wands[wand_idx].parentElement.getBoundingClientRect();
		wand_x = (rect.right + rect.left)/2
		wand_y = (rect.top + rect.bottom)/2

		// Angle of wand relative to vertical axis of emoji
		var angle = 90.0+(Math.atan2(mouse_y-wand_y,mouse_x-wand_x)*(180.0/Math.PI));

		// Set the new position and rotation of wand
		
		// New position
		parent_transform = wands[wand_idx].parentElement.style.transform;
		parent_rotation = parent_transform.match(/\.*rotate\(([\-0-9]+.[0-9]+)deg\)/)
		parent_rotation = parent_rotation ? parseFloat(parent_rotation[1]) : 0;
		new_angle = angle-parent_rotation;
		
		// New angle
		var wand_offset = 36;
		new_x = wand_offset*Math.sin(new_angle*(Math.PI/180.0));
		new_y = -wand_offset*Math.cos(new_angle*(Math.PI/180.0));
		
		// Update transformation
		wands[wand_idx].style.transform = `translate(${new_x}px, ${new_y}px) scale(0.5) rotate(${new_angle}deg)`
	}
}

document.querySelector(".world").addEventListener("mousemove",onWorldMouse);

function sendMouse(e) {
    e = e || window.event;
    
    var player = byId[playerid]
    if(player){
        var w = container.offsetWidth
        var h = container.offsetHeight
        var cx = -player.x + w/2
        var cy = -player.y + h/2
        
        var wx = e.clientX - cx
        var wy = e.clientY - cy
        window.conn.send({type:'mouseMove',position:{x:wx,y:wy}})
    }
}

window.addEventListener("mousemove",sendMouse);

window.addEventListener("load", () => {
       loadEmoji(emoji => {
               let conn = new Connection()
               conn.opened = () => {
                       main(conn, emoji)
               }
       });
})
 
