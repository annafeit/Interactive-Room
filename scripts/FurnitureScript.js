var Furniture = {};

Kata.require([ 
	'katajs/oh/Script.js', 
	kata_base_offset + 'scripts/UserScript.js'
],function() {

	var SUPER = Kata.Script.prototype;

	Furniture = function(channel, args){
		this.mesh = args.visual.mesh;
		this.space = args.space;
		this.initialPos = args.center;
		this.id = args.id;
		this.position = args.position;
		this.orientation = args.orientation;
		
		SUPER.constructor.call(this, channel, args, function(){});

		this.connect(args, null, Kata.bind(this.connected, this));		
	};

	Kata.extend(Furniture, SUPER);

	
    Furniture.prototype.connected = function(presence){
		//handle connection failure
		if (presence == null){
			Kata.error('Failed to connect object to '+ space+'. Reason: ' + reason);
			throw "error";
		}			
		
		this.presence = presence;
		
		if(this.initialPos){
			//set furniture to the current center
			var now = new Date();
		    var loc = this.presence.predictedLocationAtTime(now);
		    var p = this.initialPos;	     	 
		    loc.pos = [p.x, p.y, p.z];	    
		    this.presence.setLocation(loc);
		}
		if(this.position){
			var now = new Date();
		    var loc = this.presence.predictedLocationAtTime(now);		         	
		    loc.pos = this.position;	    
		    this.presence.setLocation(loc);
		}
		if(this.orientation){
			var now = new Date();
		    var loc = this.presence.predictedLocationAtTime(now);		    
		    loc.orient = this.orientation; 	    
		    this.presence.setLocation(loc);
		}
	    
	    document.userScript.furnitureCreated(this);
	};
	
	Furniture.prototype.getPosition = function(){
		var now = new Date();
		var pos = this.presence.predictedPosition(now);
		var ret = pos[0] + " " + pos[1] + " " + pos[2];
		return ret;
        
	}
	Furniture.prototype.getOrientation = function(){
		var now = new Date();
		var or = this.presence.predictedOrientation(now);
		var ret = or[0] + " " + or[1] + " " + or[2] + " " + or[3];
		return ret;
	}


}, kata_base_offset + "scripts/FurnitureScript.js");
