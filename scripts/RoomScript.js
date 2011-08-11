var Room = {};

Kata.require([ 
	'katajs/oh/GraphicsScript.js', 
],function() {
	
	var SUPER = Kata.Script.prototype;
	
	Room.RoomScript = function(channel, args){
		
		SUPER.constructor.call(this, channel, args, function(){});
		
		this.connect(args, null, Kata.bind(this.connected, this));		
	};
	
	Kata.extend(Room.RoomScript, SUPER);
	
	Room.RoomScript.prototype.connected = function(presence){

	};
		
	
}, kata_base_offset + "script/UserScript.js");
