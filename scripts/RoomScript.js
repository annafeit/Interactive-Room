var Room = {};

Kata.require([ 
	'katajs/oh/Script.js', 
	kata_base_offset + 'scripts/UserScript.js'
],function() {

	var SUPER = Kata.Script.prototype;

	Room = function(channel, args){

		SUPER.constructor.call(this, channel, args, function(){});

		this.connect(args, null, Kata.bind(this.connected, this));		
	};

	Kata.extend(Room, SUPER);

	Room.prototype.connected = function(presence){

	};


}, kata_base_offset + "scripts/RoomScript.js");
