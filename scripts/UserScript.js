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
	 * proximity callback TODO ???
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
                                0.1);	//lag:0.1 just to match the code...
        
    };
    
    /** 
     * Creates the room, the user wants to login to
     */
    User.UserScript.prototype.createRoom = function(){
    	this.roomMesh = "static/meshes/staticWorld.xml3d";
    	this.createObject(kata_base_offset + "scripts/RoomScript.js", 
	   			"Room.RoomScript", 
				{ space:this.space,
				  visual:{mesh:this.roomMesh},
				  loc:{scale: "1.0"}	//just to match the code..
				});    
    }
    
    /**
     * Sets the camera to the "door-view"
     */
    User.UserScript.prototype.setCamToDoor = function(){
    	var views = document.getElementsByTagName("view");
    	var view;
    	
    	//finds the viewpoint at the door
    	for (var i = 0; i<views.length; i++){
    		view = views[i];
    		if (view.id.substr(0,4) == "door"){
    			break;
    		}
    	}
    	var now = new Date();
 		var loc = this.presence.predictedLocationAtTime(now);
 		var p = view.position;
 		var o = view.orientation;
 		
 		loc.pos = [p.x, p.y, p.z];
 		var or = Kata._helperQuatFromAxisAngle([o.axis.x, o.axis.y, o.axis.z], o.angle);
 		loc.orient = or; 
 		
 		this.presence.setLocation(loc);		
    };
    
	/**
	 * Callback that is triggered when object is connected to the space	  
	 */
	User.UserScript.prototype.connected = function(presence, space, reason){		
		//handle connection failure
		if (presence == null){
			Kata.error('Failed to connect viewer to '+ space+'. Reason: ' + reason);
			throw "error";
		}
		
		//save world presence
		this.presence = presence;
		
		//display the object
		this.enableGraphicsViewport(presence,0);
		
		presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        presence.setQuery(0);                  		
		
		//create Room of user
		this.createRoom();				  
		
        //set up camera sync
        this.mCamUpdateTimer = setInterval(Kata.bind(this.syncCamera, this), 60);
        this.syncCamera();
        
		//display username
		document.getElementById("name").innerHTML=username;
	}; 
	
	//Enum for Keycode
    User.UserScript.prototype.Keys = {
	        UP : 38,
	        DOWN : 40,
	        LEFT : 37,
	        RIGHT : 39
	};
	
	//Handle messages from GUI
	User.UserScript.prototype._handleGUIMessage = function (channel, msg) {
		if(msg.msg=="loaded" && msg.mesh==this.roomMesh){
			this.setCamToDoor();
		}
		
		if(msg.msg == "keyup"){
			this.keyIsDown[msg.keyCode] = false;
			
			//If neither up nor down key is now pressed -> don't go 
			if ( !this.keyIsDown[this.Keys.UP] && !this.keyIsDown[this.Keys.DOWN])
                this.presence.setVelocity([0, 0, 0]);
			//If neither left nor right key is pressed -> don't rotate
            if ( !this.keyIsDown[this.Keys.LEFT] && !this.keyIsDown[this.Keys.RIGHT])
                this.presence.setAngularVelocity(Kata.Quaternion.identity());
		}
		if (msg.msg == "keydown"){			
			var origOrient = this.presence.predictedOrientation(new Date());
			var avMat = Kata.QuaternionToRotation(origOrient);
            var avSpeed = 15;
            var full_rot_seconds = 10.0;	            	          
            
            var avXX = avMat[0][0] * avSpeed;
            var avXY = avMat[0][1] * avSpeed;
            var avXZ = avMat[0][2] * avSpeed;
            var avZX = avMat[2][0] * avSpeed;
            var avZY = avMat[2][1] * avSpeed;
            var avZZ = avMat[2][2] * avSpeed;
            
            this.ctrl = msg.ctrlKey;
            this.keyIsDown[msg.keyCode] = true;
           
            if (this.keyIsDown[this.Keys.UP]) {
            	if (this.ctrl){
            		//var inv = origOrient.inverse;
            		var deflt = Kata.Quaternion.fromAxisAngle([0, 0, 1], 0.0);
            		var up = Kata.Quaternion.fromAxisAngle([1, 0, 0], 0.17); //0.17 ca. 10°
            		var res = deflt.multiply(up);
            		
            		var loc = this.presence.predictedLocationAtTime(now);
            		loc.orient=res.multiply(origOrient);
            		this.presence.setLocation(loc);
            		
            	}
            	else{
            		this.presence.setVelocity([-avZX, -avZY, -avZZ]);
            	}
                
            }
            if (this.keyIsDown[this.Keys.DOWN]) {
            	if (this.ctrl){
            		//TODO
            	}
            	else{
            		this.presence.setVelocity([avZX, avZY, avZZ]);
            	}
            }
            
            if (this.keyIsDown[this.Keys.LEFT]) {
            	if (this.ctrl){	            	
	                this.presence.setAngularVelocity(
	                    Kata.Quaternion.fromAxisAngle([0, 1, 0], 2.0*Math.PI/full_rot_seconds)
	                );
            	}
            	else{
            		this.presence.setVelocity([-avXX, -avXY, -avXZ]);
            	}	                
            }
            if (this.keyIsDown[this.Keys.RIGHT]) {
            	if (this.ctrl){
	                this.presence.setAngularVelocity(
	                    Kata.Quaternion.fromAxisAngle([0, 1, 0], -2.0*Math.PI/full_rot_seconds)
	                );
            	}
            	else{
            		this.presence.setVelocity([avXX, avXY, avXZ]);
            	}
            }
		}
		
		this.updateGFX(this.presence);
		
	};
	
}, kata_base_offset + "scripts/UserScript.js");
