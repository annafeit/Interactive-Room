var Furniture = {};

Kata.require([ 
	'katajs/oh/Script.js', 
	kata_base_offset + 'scripts/UserScript.js',
	kata_base_offset + 'scripts/Utils.js'
],function() {

	var SUPER = Kata.Script.prototype;

	Furniture = function(channel, args){
		this.mesh = args.visual.mesh;
		this.space = args.space;
		this.initialPos = args.center;
		this.furnitureId = args.id;
		this.position = args.position;
		this.orientation = args.orientation;

		this.name = args.name;
		
		this.inDB = args.inDB;
		this.shader = "normal";
		this.materials = {red: null, green: null, normal: null};
		
		this.active = false;
		
		this.xml3d = document.getElementsByTagName("xml3d")[0];
		
		SUPER.constructor.call(this, channel, args, function(){});

		this.connect(args, null, Kata.bind(this.connected, this));		
	};

	Kata.extend(Furniture, SUPER);

	/**
	* proximity callback TODO ???
	*/
    User.prototype.proxEvent = function(remote, added) {
        if (added){
        	Kata.warn("Camera Discover object.");
	        this.presence.subscribe(remote.id());
	        this.mOther = remote;
        }
        else{
        	Kata.warn("Camera wiped object");
        }
    };
	
    Furniture.prototype.connected = function(presence){
		//handle connection failure
		if (presence == null){
			Kata.error('Failed to connect object to '+ space+'. Reason: ' + reason);
			throw "error";
		}			
		
		this.presence = presence;				
		
		this.presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        this.presence.setQuery(0);
		
        this.setInitialPos();
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
	    		
		document.userScript.furnitureCreated(this, this.inDB);
		
	};
	
	Furniture.prototype.setInitialPos = function(){
		
	}
	
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
	
	Furniture.prototype.changeShader = function(color){
		// if scene wasn't parsed yet
		if (this.materials.red == null){
			this.parseScene();
		}
		var obj = document.getElementById(this.name+this.presence.mID);
		obj.setAttribute("shader", "#"+this.materials[color] );		
		this.shader = color;		
		this.xml3d.update();
		this.shader = color;
	}
		
	
	Furniture.prototype.parseScene = function(){	
        var materials = document.getElementsByTagName("shader");	    
	    //finds id of red, green and normal shader
	    for (var i = 0; i<materials.length; i++){
		    var material = materials[i].id;
		    if (material.substr(0,3) == "red"){
		    	this.materials.red = material;
		    }
		    if (material.substr(0,5) == "green"){
		    	this.materials.green = material;
		    }
		    if (material.substr(0,6) == "normal"){
		    	this.materials.normal = material;
		    }
	    }
	}
	
	Furniture.prototype.setActive = function(b){
		if(this.active && !b && !(this.shader == "red")){
			//save new position and orientation in DB only if this isn't active any more and placed correctly
			//this.updateFurnitureInDB();
			this.active = b;
		}		
		else if(b){
			this.active = b;
		}
	}
	
	/*Furniture.protoype.updateFurnitureInDB = function(){
		//TODO
	}*/
	

}, kata_base_offset + "scripts/FurnitureScript.js");
