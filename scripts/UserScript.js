var User={};

Kata.require([
	'katajs/oh/GraphicsScript.js',
	kata_base_offset + 'scripts/utils.js',
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
		//save the xml3d element
		var t = document.getElementsByTagName("xml3d");
		this.xml3d = t[0];
		this.roomMesh = args.world;
		//save arguments
		this.username = args.username;
		this.space=args.space;
		this.database = args.database;
		
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
                                0.1); //lag:0.1 just to match the code...
        //this.checkWalls(); -> doesn't work yet
    };
    
    /**
* Creates the room, the user wants to login to
*/
    User.UserScript.prototype.createRoom = function(){
	    this.createObject(kata_base_offset + "scripts/RoomScript.js",
		"Room.RoomScript",
		{ space:this.space,
		visual:{mesh:this.roomMesh},
		loc:{scale: "1.0"} //just to match the code..
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
    
    User.UserScript.prototype.setCam = function(pos){
    	var now = new Date();
    	var loc = this.presence.predictedLocationAtTime(now);
    	loc.pos = pos;
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

        //save the activeView
        var id = this.xml3d.activeView;
        this.camera = document.getElementById(id);
		        
		//create Room of user
		this.createRoom();

        //set up camera sync
        this.mCamUpdateTimer = setInterval(Kata.bind(this.syncCamera, this), 60);
        this.syncCamera();
        
		//display username
		document.getElementById("name").innerHTML=username;
	};

	/**
	* check if the camera is out of the room and make walls invisible if this is true.
	*/
	User.UserScript.prototype.checkWalls = function(){
		//create ray with origin in camera and direction in camera direction
		var ray = this.xml3d.createXML3DRay();
		ray.origin = this.camera.position;		
		ray.direction = this.camera.getDirection();
		//create ray with origin in camera and direction in opposite camera direction
		var rayNeg = this.xml3d.createXML3DRay();		
		rayNeg.origin = this.camera.position;
		rayNeg.direction = this.camera.getDirection().negate();
				
		var rt1 = Helper.rayIntersectsScene(ray);
		var rt2 = Helper.rayIntersectsScene(rayNeg);
		if (!(rt1 && rt2)){
			//outside of the room (not a wall on both sides of the camera)			
			setShaderTransparent();							
		}
		else{
			setShaderSolid();
		}
	}
	

	function setShaderTransparent(){
		var groups = document.getElementsByTagName("group");		
		for (var i =0;i<groups.length;i++)
		{
			var obj = groups[i];
			if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
				obj.setAttribute("shader", "#transparentMaterial" );				
			}
		}
	}
	
	function setShaderSolid(){	
		var groups = document.getElementsByTagName("group");		
		for (var i =0;i<groups.length;i++)
		{
			var obj = groups[i];
			if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
				obj.setAttribute("shader", "#material" );				
			}
		}
	}
	
		
	
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
			var now = new Date();
			var preOrient = this.presence.predictedOrientation(now);
			var origOrient = new Kata.Quaternion();
			origOrient[0] = preOrient[0];
			origOrient[1] = preOrient[1];
			origOrient[2] = preOrient[2];
			origOrient[3] = preOrient[3];
			var avMat = Kata.QuaternionToRotation(origOrient);
            var avSpeed = 50;
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
				    /*
					var dir = this.camera.getDirection();
					var up = this.camera.getUpVector();
					var axis = up.cross(dir);
					this.presence.setAngularVelocity(
					Kata.Quaternion.fromAxisAngle([dir.x, dir.y, dir.z], 2.0*Math.PI/full_rot_seconds)
					);*/ //new rotation N = inv(O) * V * O
		            //FIXME still doesn't work correctly?
		            var inv = origOrient.inverse();
		            var up = Kata.Quaternion.fromAxisAngle([1, 0, 0], 0.017); //0.017 ca. 5°
		            
		            var rotateBack = inv.multiply(origOrient);
		            var rotateVert = up.multiply(rotateBack);
		             //TODO find out why not reversed (the function call)
		            var res = origOrient.multiply(up);
		             //TODO how to make it smooth (like Velocity)
		            this.presence.setOrientation(res);
		            }
	             else{
	            	this.presence.setVelocity([-avZX, -avZY, -avZZ]);
	             }
                
            }
            if (this.keyIsDown[this.Keys.DOWN]) {
            	if (this.ctrl){
            		//new rotation N = inv(O) * V * O
            		var inv = origOrient.inverse();
            		var up = Kata.Quaternion.fromAxisAngle([1, 0, 0], -0.017); //0.017 ca. 1°
		            
		            var rotateBack = origOrient.multiply(inv);
		            var rotateVert = rotateBack.multiply(up)
		            var res = origOrient.multiply(up);
		            
		            this.presence.setOrientation(res);
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

