var User={};

Kata.require([
	'katajs/oh/GraphicsScript.js',
], function() {
	/**
	 * Simulate inheritance from GraphicsScript by defining a super variable
	 * This is the first Object in the OH and therefore inherits from 
	 * GraphicsScript and not from Script!
	 */
	var SUPER = Kata.GraphicsScript.prototype;		
	var space;
	/**
	 * Constructor
	 */
	User.UserScript = function(channel, args){
		//initialize viewer in the origin
		this.initialLocation = Kata.LocationIdentityNow();						
		//save arguments
		this.username = args.username;
		this.space=args.space;
		
		//to save which key is pressed
		this.keyIsDown = {};
		//initialize
		this.keyIsDown[this.Keys.UP] = false;
		this.keyIsDown[this.Keys.DOWN] = false;
		this.keyIsDown[this.Keys.RIGHT] = false;
		this.keyIsDown[this.Keys.LEFT] = false;
		
		//call parent constructor
		SUPER.constructor.call(this, channel, args, function(){});
		
		//connect to the spaceServer with method 'connect' of parent's parent class
		//last argument must always be a callback (->Kata.bind), a method that's invoked upon completion
		this.connect(args, null, Kata.bind(this.connected, this));
	};
	/**
	 * Simulate inheritance from GraphicsScript by extending the User class with the methods of the parent(SUPER) class
	 */
	Kata.extend(User.UserScript, SUPER);
	
	/**
	 * proximity callback
	 */ 
    User.UserScript.prototype.proxEvent = function(remote, added) {
        if (added){
        	Kata.warn("Camera Discover object.");
            this.presence.subscribe(remote.id());
        }
        else{
        	Kata.warn("Camera wiped object");
        }            
    };	    
	
	/** Camera sync */
    User.UserScript.prototype.syncCamera = function() {
        var now = new Date();
        this.setCameraPosOrient(this.presence.predictedPosition(now),
                                this.presence.predictedOrientation(now),
                                0.0);
        
    };
    
    /** 
     * Creates the room, the user wants to login to
     */
    User.UserScript.prototype.createRoom = function(){
    	this.createObject(kata_base_offset + "scripts/RoomScript.js", 
	   			"Room.RoomScript", 
				{ space:this.space,
				  visual:{mesh:"static/meshes/staticWorld.xml3d"}
				});
    }
    
	/**
	 * Callback that is triggered when object is connected to the space	  
	 */
	User.UserScript.prototype.connected = function(presence, space, reason){		
		//handle connection failure
		if (presence == null){
			Kata.error('Failed to connect viewer to '+ space+'. Reason: ' + reason);
			throw "error";
		}
		
		var pos = [Math.random() * 50, 0, Math.random() * 50];
        var orient = Kata._helperQuatFromAxisAngle([0, 1, 0], Math.random() * 2 * 3.14);
        
		//save world presence
		this.presence = presence;
		presence.setPosition(pos);
		presence.setOrientation(orient);
		
		//display the object
		this.enableGraphicsViewport(presence,0);
		
		presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        presence.setQuery(0);
        
        //send a location update to the space server
        var now = new Date();
		var loc = this.presence.predictedLocationAtTime(now);
		loc.pos = [4.354404, -3.840325, 2.360209];
		var or = Kata._helperQuatFromAxisAngle([0.772239, 0.341341, 0.535848], 1.347139);
		loc.orient = or; 
		this.presence.setLocation(loc);				
		
        //set up camera sync
        this.mCamUpdateTimer = setInterval(Kata.bind(this.syncCamera, this), 60);
        this.syncCamera();
        
		//display username
		document.getElementById("name").innerHTML=username;
		
		//create Room of user
		this.createRoom();
		
		  
	};
	
	 
	
   User.UserScript.prototype.Keys = {
	        UP : 38,
	        DOWN : 40,
	        LEFT : 37,
	        RIGHT : 39
	};
		
	
		
	
	
	//Handle messages from GUI
	User.UserScript.prototype._handleGUIMessage = function (channel, msg) {
		//calls cameraPeriodicUpdate if the message is "loaded" TODO do i need that??
		Kata.GraphicsScript.prototype._handleGUIMessage.call(this, channel, msg)
		
		if(msg.msg = "keyup"){
			this.keyIsDown[msg.keyCode] = false;
//			this.presence.setVelocity([0,0,0]);
			/*//If neither up nor down key is now pressed -> don't go 
			if ( !this.keyIsDown[this.Keys.UP] && !this.keyIsDown[this.Keys.DOWN])
                this.presence.setVelocity([0, 0, 0]);
			//If neither left nor right key is pressed -> don't rotate
            if ( !this.keyIsDown[this.Keys.LEFT] && !this.keyIsDown[this.Keys.RIGHT])
                this.presence.setAngularVelocity(Kata.Quaternion.identity());*/
		}
		if (msg.msg = "keydown"){	
			this.keyIsDown[msg.keyCode] = true;
			if(this.keyIsDown[this.Keys.UP]){
				var now = new Date();
				var loc = this.presence.predictedLocationAtTime(now);
				loc.pos = [0,1,0];								
				this.presence.setLocation(loc);
				
//				this.presence.setVelocity([0,1,0]);
				
			}
			
			/*var avMat = Kata.QuaternionToRotation(this.presence.predictedOrientation(new Date()));			
			var full_rot_seconds = 10.0;
			
            var avXX = avMat[0][0];
            var avXY = avMat[0][1];
            var avXZ = avMat[0][2];
            var avZX = avMat[2][0];
            var avZY = avMat[2][1];
            var avZZ = avMat[2][2];
            
            var ctrl = msg.ctrl;
			this.keyIsDown[msg.keyCode] = true;
			
			if (this.keyIsDown[this.Keys.UP]){
				this.presence.setVelocity([-avZX, -avZY, -avZZ])
				
			}
			if (this.keyIsDown[this.Keys.DOWN]){
				this.presence.setVelocity([avZX, avZY, avZZ]);				
			}
			if (this.keyIsDown[this.Keys.LEFT]){
				this.presence.setAngularVelocity(
						Kata.Quaternion.fromAxisAngle([0,1,0], 2.0*Math.Pi/full_rot_seconds)
				);
			}
			if (this.keyIsDown[this.Keys.RIGHT]){
				this.presence.setAngularVelocity(
						Kata.Quaternion.fromAxisAngle([0,1,0], -2.0*Math.Pi/full_rot_seconds)
				);
			}*/
		}
		
		this.updateGFX(this.presence);
		
	};
	
}, kata_base_offset + "scripts/UserScript.js");
