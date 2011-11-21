var User={};

Kata.require([
	'katajs/oh/GraphicsScript.js',
	kata_base_offset + 'scripts/Utils.js'
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
	User = function(channel, args){
		//save the xml3d element
		var t = document.getElementsByTagName("xml3d");
		this.xml3d = t[0];		
		//save arguments
		this.username = args.username;
		this.space=args.space;
		this.roomId=args.roomId;
		this.roomMesh = args.world;
		
		this.mRemotePresences = new Array();
		
		/**"camera" mode: moving camera by drag 
		 * "furniture" mode: moving furniture by drag and drop
		 */		
		this.mode="camera";	 
		
		//to store all furniture of the room
		this.furniture = new Array();
		this.activeFurniture;
		
		//to save which key is pressed
		this.keyIsDown = {};
		//initialize
		this.keyIsDown[this.Keys.UP] = false;
		this.keyIsDown[this.Keys.DOWN] = false;
		this.keyIsDown[this.Keys.RIGHT] = false;
		this.keyIsDown[this.Keys.LEFT] = false;
		this.keyIsDown[this.Keys.W] = false;
		this.keyIsDown[this.Keys.A] = false;
		this.keyIsDown[this.Keys.S] = false;
		this.keyIsDown[this.Keys.D] = false;
		
		//call parent constructor
		SUPER.constructor.call(this, channel, args, function(){});
		
		//connect to the spaceServer with method 'connect' of parent's parent class
		//last argument must always be a callback (->Kata.bind), a method that's invoked upon completion
		this.connect(args, null, Kata.bind(this.connected, this));
	};
	/**
	* Simulate inheritance from GraphicsScript by extending the User class with the methods of the parent(SUPER) class
	*/
	Kata.extend(User, SUPER);
	
	
	/**
	* I think: This registers the "near" objects in this.mRemotePresences (with it's presence).
	* Then the script can use the presences to send messages to the hostedObjects via presence._sendHostedObjectMessage
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

    
    /** Camera sync */
    User.prototype.syncCamera = function() {
        var now = new Date();
        this.setCameraPosOrient(this.presence.predictedPosition(now),
                                this.presence.predictedOrientation(now),
                                0.1); //lag:0.1 just to match the code...
        this.checkWalls(); 
    };
         
    
	/**
	* Callback that is triggered when object is connected to the space
	*/
	User.prototype.connected = function(presence, space, reason){
		//handle connection failure
		if (presence == null){
		Kata.error('Failed to connect viewer to '+ space+'. Reason: ' + reason);
		throw "error";
		}
		
		//save world presence
		this.presence = presence;
		
		//display the object
		this.enableGraphicsViewport(presence,0);
		
		//this.presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        //this.presence.setQuery(0);
        
        //save the activeView
        var id = this.xml3d.activeView;
        this.camera = document.getElementById(id);
		        
		//create Room of user
		this.createRoom();
		
		var thus = this;
		//attach a handler for the click-event of all current AND future elements with class furniture
		$(".furniture").live("click",function(){thus.createFurniture(this, false)});
		
        //set up camera sync
        this.mCamUpdateTimer = setInterval(Kata.bind(this.syncCamera, this), 60);
        this.syncCamera();       
		
		document.userScript = this;
	};
	
    /**
	* Creates the room, the user wants to login to
	*/
    User.prototype.createRoom = function(){
	    this.createObject(kata_base_offset + "scripts/RoomScript.js",
							"Room",
							{ space:this.space,
					    	  visual:{mesh:this.roomMesh},
					    	  roomId: this.roomId,
					    	  loc:{scale: "1.0"} //just to match the code..
							});	    
	    
	    
    }
    
    User.prototype.furnitureCreated = function(obj){    	
    	//only if object isn't already in DB (and now was recreated) 
	    if(!obj.inDB){
	    	//if object was not placed correctly from beginning, it's active and the application is in furniture-mode
	    	if(obj.active){
	    		this.activeFurniture = obj;
	    		this.mode = "furniture";
	    	}
	    	//if it was placed correctly, it's not active and we can write it in the DB
	    	else{
				//get furniture position and orientation
				var pos = obj.getPosition();
				var or = obj.getOrientation();
				$.post('scripts/createFurniture.php', {furnitureId: obj.furnitureId, roomId: this.roomId, position: pos, orientation: or}, 
						function(data, jqxhr){
							obj.dbID = data[0];
						},'json');
			}
	    }
    	
    }
        
    User.prototype.createFurniture = function(obj, inDB){
    	var prev = obj.getAttribute("preview");
    	var id = obj.getAttribute("id");  
    	var type = obj.getAttribute("type");   
    	var name = obj.getAttribute("name");  
    	var thus = this;
    	$.post('scripts/getMeshFromFurniturePreview.php', {preview: prev}, 
    			function(data, jqxhr){     				
    				var url = kata_base_offset + data[0];
    				//create new object in world      				
    		    	thus.createObject(kata_base_offset + "scripts/FurnitureScript.js",
    		    			"Furniture",
    		    			{ space:thus.space,    		    		
    		    			  center: thus.center,
    		    			  id:id,
    		    			  visual:{mesh: url},
    		    			  inDB:inDB,
    		    			  type:type,
    		    			  name:name,
    		    			  loc:{scale: "1.0"} //just to match the code..
    		    			});    		    	
    			},'json');
    } 
    
    /**
     * checks the database for furniture that are already in that room
     */
    User.prototype.fillRoom = function(){
    	var thus = this;
    	$.post('scripts/fillRoom.php', {roomId: this.roomId}, 
    			function(data, jqxhr){
    				console.log(data);
    				for (var i = 0;i<data.length;i++){
    					var obj = data[i];
    					var name = obj.name;
    					var url = kata_base_offset + obj.mesh;
    					var id = obj.id;
    					var type = obj.type;
    					var dbID = obj.entryId;
    					
    					var pos = obj.position.split(" ");
    					pos[0] = parseInt(pos[0]);
    					pos[1] = parseInt(pos[1]);
    					pos[2] = parseInt(pos[2]);
    					var or = obj.orientation.split(" ");
    					or[0] = parseInt(or[0]);
    					or[1] = parseInt(or[1]);
    					or[2] = parseInt(or[2]);
    					or[3] = parseInt(or[3]);
    					
    					thus.createObject(kata_base_offset + "scripts/FurnitureScript.js",
        		    			"Furniture",
        		    			{ space:thus.space,
    							  position: pos,
    							  orientation: or,
        		    			  id:id,
        		    			  type: type,
        		    			  name:name,
        		    			  visual:{mesh: url},
        		    			  inDB: true,
        		    			  dbID: dbID,
        		    			  loc:{scale: "1.0"} //just to match the code..
        		    			});
    				}
    		
    			},'json');    	
    }

	User.prototype.parseScene = function(){
		//camera
        var activeViewId = this.xml3d.activeView;
        this.camera = document.getElementById(activeViewId);
        
        var materials = document.getElementsByTagName("shader");
	    var material;
	    var transparent;
	     
	     //finds id of material-shader and transparent-shader
	     for (var i = 0; i<materials.length; i++){
	    	 material = materials[i].id;
	    	 if (material.substr(0,8) == "material" && material.substr(0,14) != "materialCenter"){
	    		 break;
	    	 }
	     }
	     for (var i = 0; i<materials.length; i++){
	    	 transparent = materials[i].id;
	    	 if (transparent.substr(0,19) == "transparentMaterial"){
	    		 break;
	    	 }
	     }
	     this.material = material;
	     this.transparentMaterial = transparent;
	}
	
	  /**
	* Sets the camera to the "door-view"
	*/
    User.prototype.setCamToDoor = function(){
	     var views = document.getElementsByTagName("view");
	     var view;
	     
	     //finds the viewpoint at the door
	     for (var i = 0; i<views.length; i++){
	    	 view = views[i];
	    	 if (view.id.substr(0,4) == "door"){
	    		 break;
	    	 }
	     }
    	 //set center variable
    	 var s = view.getAttribute("center").split(" "); 
    	 this.center = this.xml3d.createXML3DVec3();
    	 this.center.x = s[0];
    	 this.center.y = s[1];
    	 this.center.z = s[2];     	 
    	 
    	 var view = this.lookAt(this.center, view);
    	 
    	//set initial distance from cam to center
    	 var dist = view.position.subtract(this.center);
 		 this.camCenterDistance = dist.length(); 		
 		 
    	 //set presence position
	     var now = new Date();
	     var loc = this.presence.predictedLocationAtTime(now);
	     var p = view.position;
	     var o = view.orientation;
	 
	     loc.pos = [p.x, p.y, p.z];
	     var or = Kata._helperQuatFromAxisAngle([o.axis.x, o.axis.y, o.axis.z], o.angle);
	     loc.orient = or;
	 
	     this.presence.setLocation(loc);
	     this.syncCamera();	     	    
    };
    
    User.prototype.setCam = function(pos, or){
    	var now = new Date();
    	var loc = this.presence.predictedLocationAtTime(now);
    	if(pos){
    		loc.pos = pos;
    	}
    	if (or){
    		loc.orient = or;
    	}
    	this.presence.setLocation(loc);
    };
	
	/**
	* check if the camera is out of the room and make walls invisible if this is true.
	*/
	User.prototype.checkWalls = function(){
		//create ray with origin in camera and direction in camera direction
		var ray = this.xml3d.createXML3DRay();
		ray.origin = this.camera.position;		
		ray.direction = this.camera.getDirection();
		//create ray with origin in camera and direction in opposite camera direction
		var rayNeg = this.xml3d.createXML3DRay();		
		rayNeg.origin = this.camera.position;
		rayNeg.direction = this.camera.getDirection().negate();
				
		var rt1 = Helper.rayIntersectsWalls(ray);
		var rt2 = Helper.rayIntersectsWalls(rayNeg);
		if (!(rt1 && rt2)){
			//outside of the room (not a wall on both sides of the camera)			
			this.setShaderTransparent();							
		}
		else{
			this.setShaderSolid();
		}
	}
	

	User.prototype.setShaderTransparent = function(){
		var groups = document.getElementsByTagName("group");		
		for (var i =0;i<groups.length;i++)
		{
			var obj = groups[i];
			if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
				obj.setAttribute("shader", "#"+this.transparentMaterial );				
			}
		}
		this.xml3d.update();
	}
	
	User.prototype.setShaderSolid = function(){	
		var groups = document.getElementsByTagName("group");		
		for (var i =0;i<groups.length;i++)
		{
			var obj = groups[i];
			if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
				obj.setAttribute("shader", "#"+this.material );				
			}
			
		}
		this.xml3d.update();
	}

	
	//Enum for Keycode
	User.prototype.Keys = {
		UP : 38,
		DOWN : 40,
		LEFT : 37,
		RIGHT : 39,
		W : 87,
		A : 65,
		S : 83,
		D : 68
	};

	var lastClick = -Number.MAX_VALUE;;
	
	//the smaller the speed the faster the turning/moving/zooming
	//no mathematical foundation, just a  guess
	var turnSpeed = 30;	
	var zoomSpeed = 20;
	var moveSpeed = 15;
		
	//Handle messages from GUI
	User.prototype._handleGUIMessage = function (channel, msg) {
		//TODO does this script only gets this message from objects hosted by this oh?
		if(msg.msg=="loaded"){
			if (msg.mesh==this.roomMesh){
				this.setCamToDoor();
				this.parseScene();
				this.fillRoom();
			
			}
			else{
				for(var i = 0; i<this.furniture.length; i++){
					var furn = this.furniture[i];
					if(furn.presence.mID == msg.id){
						furn.meshLoaded();
					}
				}
			}
			
			
		}
		if(msg.msg=="click"){	
			if (msg.event.timeStamp -200 < lastClick ){
				msg.msg = "doubleclick";
			}
			else{
				var furn = null;
				var mesh = this.xml3d.getElementByPoint(msg.x, msg.y);
				if(mesh){
					var obj = mesh.parentElement;
					furn = this.furnitureFromXML3D(obj);
				}
				
				if (furn ||this.mode=="furniture"){	
					this.changeMode(furn);
				}
			}
			lastClick = msg.event.timeStamp; 			
		}
		if(msg.msg == "doubleclick"){
			//move and rotate camera such that it looks at the center of the object that was clicked on.			
			var obj = this.xml3d.getElementByPoint(msg.x, msg.y).parentElement;
			var furn = this.furnitureFromXML3D(obj);
			if (furn){	
				var pos = Helper.objWorldCenter(obj);
				var point = this.xml3d.createXML3DVec3();
				point.x = pos.x;
				point.y = pos.y;
				point.z = pos.z;
				var cam = this.setCamUpToY(this.camera);
				cam = this.lookAt(point, cam);
				this.updatePresence(cam.position, cam.orientation);
			}
		}
		if(msg.msg =="mousemove"){
			if(this.mode == "furniture")
				this.activeFurniture.moveFurnitureToMouse(msg.x, msg.y);			
		}
		if(msg.msg =="drop" && this.mode == "furniture"){
			//TODO rotate furn	        	
		}
		if(msg.msg == "drag" && this.mode == "furniture"){
			//TODO rotate furn
		}
		/** camera Navigation **/
		if(msg.msg == "drag" && this.mode == "camera"){
			
			if (Math.abs(msg.dx) > Math.abs(msg.dy)){
				//mouse moved more horizontally
				if(msg.dx > 0){
					//TODO this is wrong, when dragging and moving the mouse around, it only gets smaller then 0 
					//when it passes the starting point again. (continues turning in the other direction until then
					//mouse moved to the right -> turn left
					var i = msg.dx;
					while (i>0){
						this.turnLeft();
						i = i - turnSpeed;
					}
				}
				else{
					//mouse moved to the left -> turn right
					var i = -msg.dx;
					while (i>0){
						this.turnRight();
						i = i - turnSpeed;
					}
				}
			}
			else{
				//mouse moved more vertically
				if(msg.dy > 0){
					//mouse moved down -> turn up
					var i = msg.dy;
					while (i>0){
						this.turnUp();
						i = i - turnSpeed;
					}
				}
				else{
					//mouse moved up -> turn down
					var i = -msg.dy;
					while (i>0){
						this.turnDown();
						i = i - turnSpeed;
					}
				}
			}
		}
		if(msg.msg == "wheel"){
			
			if(msg.dy > 0){
				// zoom in 
				var i = msg.dy;
				while (i>0){
					this.zoomIn();
					i = i - zoomSpeed;
				}
			}
			else{
				//zoom out
				var i = -msg.dy;
				while (i>0){
					this.zoomOut();
					i = i - zoomSpeed;
				}
			}
		}
		if(msg.msg == "keyup"){
			this.keyIsDown[msg.keyCode] = false;
		}
		
		if (msg.msg == "keydown"){			
            this.ctrl = msg.ctrlKey;
            this.keyIsDown[msg.keyCode] = true;
                       
            if (this.keyIsDown[this.Keys.UP] || this.keyIsDown[this.Keys.W]) {
            	if (this.ctrl){
            		var i = 0;
            		while (i<turnSpeed){
            			this.turnUp();
            			i++;
            		}
					
		        }
	            else{	            	
	            	var i = 0;
            		while (i<moveSpeed){
            			this.moveUp();
            			i++;
            		}
	            }
                
            }
            if (this.keyIsDown[this.Keys.DOWN] || this.keyIsDown[this.Keys.S]) {
            	if (this.ctrl){
            		var i = 0;
	        		while (i<turnSpeed){
	        			this.turnDown();
	        			i++;
	        		}
            	}
	            else{
	            	var i = 0;
            		while (i<moveSpeed){
            			this.moveDown();
            			i++;
            		}
	            }
            }            
            if (this.keyIsDown[this.Keys.LEFT] || this.keyIsDown[this.Keys.A]) {
            	if (this.ctrl){
            		var i = 0;
	        		while (i<turnSpeed){
	        			this.turnRight();
	        			i++;
	        		}
            	}
	            else{
	            	var i = 0;
            		while (i<moveSpeed){
            			this.moveLeft();
            			i++;
            		}
	            }
            }
            if (this.keyIsDown[this.Keys.RIGHT] || this.keyIsDown[this.Keys.D]) {
            	if (this.ctrl){
            		var i = 0;
	        		while (i<turnSpeed){
	        			this.turnLeft();
	        			i++;
	        		}
            	}
	            else{
	            	var i = 0;
            		while (i<moveSpeed){
            			this.moveRight();
            			i++;
            		}
	            }
            }
		}
	
		this.updateGFX(this.presence);
	
	};
	
	/*
	 * Helper functions for placing. 
	 * 
	 */
	/**
	 * obj: xml3d element
	 * returns the corresponding Furniture object
	 */
	User.prototype.furnitureFromXML3D = function (obj){
		if (obj){
			if (obj.getAttribute("type").substr(0,2) == "on"){ 
				//if it's a furniture object (types "onwall", "onfloor" or "onceiling")										
				for (var i = 0; i<this.furniture.length;i++) {
		            var furn = this.furniture[i];
		            if (furn.presence.mID == obj.parentElement.id ){
		            	return furn;		            	
		            }		                
		        }
			}
		}
	}
	
	/**
	 * changes mode and activeFurniture in userscript, changes active state and shader of furniture
	 * furn: the furniture that was clicked on
	 * mode: the new mode
	 */
	User.prototype.changeMode = function (furn){					
		//from 'camera' to 'furniture'
		if (this.mode == "camera"){
			this.mode = "furniture";
			this.activeFurniture = furn;
			this.activeFurniture.setActive(true);
			//change shader
			if (this.activeFurniture.shader == "normal"){				
				this.activeFurniture.changeShader("green");
			} 
			   
		}
		else if(!(this.activeFurniture.shader == "red")){
				if (this.activeFurniture == furn || !(furn)){
					this.mode = "camera";
					this.activeFurniture.setActive(false);											
					this.activeFurniture.changeShader("normal");				
					this.activeFurniture = null;
				}
				else{
					this.activeFurniture.setActive(false);								
					this.activeFurniture.changeShader("normal");
					furn.setActive(true);
					if (furn.shader == "normal"){				
						furn.changeShader("green");
					}
					this.activeFurniture = furn;
				}
				
		}
	}

	
	
	/*
	 * Functions to control the camera.
	 * 
	 * Turning:
	 * 	the camera turns around the center: position and direction of camera changes
	 * 	max: turning right or left is unlimited,
	 * 		 turning up and down only in the range from parallel to floor until parallel to y-axis.
	 * Moving:
	 *  The camera moves parallel to the floor 
	 * 	max: position of the center outside the walls
	 *  position of the camera changes, position of the center changes the same way
	 * Zooming: 
	 * 	the camera moves in the looking direction 
	 *  max. until it has (nearly) the same position as the center. 	 
	 * 	The center doesn't change but the distance from camera to center changes
	 * 
	 * Implementation:
	 * change position/direction of the tmp-camera and assign it to the presence. Position of actual camera
	 * in the scene is then changed automatically
	 */
	
		
	var speed=2;
	/**
	 * 
	 * point: XML3DVec3
	 * camera: XML3D view
	 */	
	User.prototype.lookAt = function(point, cam){
		var vector = point.subtract(cam.position);
		vector = vector.normalize();
		cam.setDirection(vector);
		this.center = point;
		this.camCenterDistance = (cam.position.subtract(this.center)).length();				  
		return cam;
	}
	
	/**
	 * helper function to update the presence's position and orientation
	 * position: XML3DVec3
	 * orientation: XML3DRotation 
	 */
	User.prototype.updatePresence = function (position, orientation){
		 var now = new Date();
	     var loc = this.presence.predictedLocationAtTime(now);		     
	     //create location
	     loc.pos = [position.x, position.y, position.z];
	     var or = Kata._helperQuatFromAxisAngle(
	                    [orientation.axis.x, orientation.axis.y, orientation.axis.z],
	                    orientation.angle);
	     loc.orient = or;		 
	     this.presence.setLocation(loc);
	     this.syncCamera();
	}
	
	/**
	 * Helper function to move the Center
	 * The center's y-coordinate (height) neer changes
	 */
	User.prototype.moveCenter = function(x, z){
		this.center.x = this.center.x + x;		
		this.center.z = this.center.z + z;
		this.moveCenterCube(x, z);		
	}
	
	/**
	 * Helper function to move the center cube
	 */
	User.prototype.moveCenterCube = function(x, z){
		//finds the transformation of the cube
		var transformations = document.getElementsByTagName("transform");
		var trans;
	    for (var i = 0; i<transformations.length; i++){
		    trans = transformations[i];
		    if (trans.id.substr(0,6) == "center"){
		    	break;
		    }
	    }
	    trans.translation.x = trans.translation.x + x;
	    trans.translation.z = trans.translation.z + z;
	}
	
	/**
	 * Helper function to correct the Distance from the cam to the center
	 */
	User.prototype.correctCenterCamDistance = function(cam, update){		
		var dist = cam.position.subtract(this.center);
		if(update){
			this.camCenterDistance = dist.length();
					
		}
		else{
	        var diff = dist.length() - this.camCenterDistance;
	        if (diff != 0){
	        	var dir = cam.getDirection();
	        	dir = dir.normalize();
	        	cam.position.x = cam.position.x + (dir.x * diff);
	        	cam.position.z = cam.position.z + (dir.z * diff);
	        }      
		}
        return cam;
	}
	
	/**
	 * Helper function to change the camera's Up vector to be parallel to the y-axis
	 */
	User.prototype.setCamUpToY = function(cam){
		var newUp = this.xml3d.createXML3DVec3();
		newUp.x = 0;
		newUp.y = 1;
		newUp.z = 0;
		cam.setUpVector(newUp);		
		return cam;
	}
	
	/**
	 * Helper function to compute the angle between a vector and the y-axis
	 */
	User.prototype.angleToY = function(vec){
		var yAxis = this.xml3d.createXML3DVec3();
		yAxis.x = 0;
		yAxis.y = 1;
		yAxis.z = 0;
		var alpha = (vec.dot(yAxis)) / (vec.length() * yAxis.length());  
		return alpha;
	}
	
		
	User.prototype.turnRight = function(){	
		//make cam parallel to floor		
		var cam = this.setCamUpToY(this.camera);		
		
		var orientMat = cam.orientation.toMatrix();		
		//x-axis in camera coordinate system
		var orXX = orientMat.m11 * speed;
        var orXZ = orientMat.m13 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x + orXX;
        cam.position.z = cam.position.z + orXZ;
        
        //change camera's direction such that it looks at the center 
        //and correct it's distance to center
        cam = this.lookAt(this.center, cam);
        cam = this.correctCenterCamDistance(cam, false);                
        this.updatePresence(cam.position, cam.orientation);       
	}
	
	User.prototype.turnLeft = function(){
		//make cam parallel to floor	
		var cam = this.setCamUpToY(this.camera);
		
		var orientMat = cam.orientation.toMatrix();		
		//x-axis in camera coordinate system
		var orXX = orientMat.m11 * speed;
        var orXZ = orientMat.m13 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x - orXX;
        cam.position.z = cam.position.z - orXZ;
        
        //change camera's direction such that it looks at the center 
        //and correct it's distance to center
        cam = this.lookAt(this.center, cam);        
        cam = this.correctCenterCamDistance(cam, false);
        
        this.updatePresence(cam.position, cam.orientation);  
	}
	
	
	User.prototype.turnUp = function(){
		var cam = this.camera;
		
		//angle of camDirection to y-Axis in the range of 90° - 180°
		var angle = this.angleToY(cam.getDirection());
		if(angle < -0.98){
			return;
		}
		
		var orientMat = cam.orientation.toMatrix();		
		//y-axis in camera coordinate system
		var orYX = orientMat.m21 * speed;        
        var orYY = orientMat.m22 * speed;
        var orYZ = orientMat.m23 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x + orYX;
        cam.position.y = cam.position.y + orYY;
        cam.position.z = cam.position.z + orYZ;
        
        //change camera's direction such that it looks at the center         
        cam = this.lookAt(this.center, cam);
        cam = this.correctCenterCamDistance(cam, false);
       
        this.updatePresence(cam.position, cam.orientation);
	}
	User.prototype.turnDown = function(){
		var cam = this.camera;
		
		//angle of camDirection to y-Axis in the range of 90° - 180°
		var angle = this.angleToY(cam.getDirection());
		if(angle > 0){
			return;
		}
		
		var orientMat = cam.orientation.toMatrix();
		//y-axis in camera coordinate system
		var orYX = orientMat.m21 * speed;        
        var orYY = orientMat.m22 * speed;
        var orYZ = orientMat.m23 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x - orYX;
        cam.position.y = cam.position.y - orYY;
        cam.position.z = cam.position.z - orYZ;
        
        //change camera's direction such that it looks at the center         
        cam = this.lookAt(this.center, cam);
        cam = this.correctCenterCamDistance(cam, false);
       
        this.updatePresence(cam.position, cam.orientation);
	}
	
	User.prototype.moveRight = function(){
		//make cam parallel to floor	
		var cam = this.setCamUpToY(this.camera);		
		
		var orientMat = cam.orientation.toMatrix();
		//x-axis in camera coordinate system
		var orXX = orientMat.m11 * speed;
		var orXY = orientMat.m12 * speed;
        var orXZ = orientMat.m13 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x + orXX;
        cam.position.y = cam.position.y + orXY;
        cam.position.z = cam.position.z + orXZ;
        
        //move the center, change camera's direction such that it looks at the center 
        //and correct it's distance to center
        this.moveCenter(orXX, orXZ);        
        cam = this.lookAt(this.center, cam);        
        cam = this.correctCenterCamDistance(cam, false);
        
        this.updatePresence(cam.position, cam.orientation);    
	}
	User.prototype.moveLeft = function(){
		//make cam parallel to floor	
		var cam = this.setCamUpToY(this.camera);		
		
		var orientMat = cam.orientation.toMatrix();
		//x-axis in camera coordinate system
		var orXX = orientMat.m11 * speed;
        var orXZ = orientMat.m13 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x - orXX;
        cam.position.z = cam.position.z - orXZ;
        
        //move the center, change camera's direction such that it looks at the center 
        //and correct it's distance to center
        this.moveCenter(-orXX, -orXZ);        
        cam = this.lookAt(this.center, cam);        
        cam = this.correctCenterCamDistance(cam, false);
        
        this.updatePresence(cam.position, cam.orientation);
	}
	User.prototype.moveUp = function(){
		//make cam parallel to floor	
		var cam = this.setCamUpToY(this.camera);		
		
		var orientMat = cam.orientation.toMatrix();
		//z-axis in camera coordinate system
		var orZX = orientMat.m31 * speed;
        var orZZ = orientMat.m33 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x - orZX;
        cam.position.z = cam.position.z - orZZ;
        
        //move the center, change camera's direction such that it looks at the center 
        //and correct it's distance to center
        this.moveCenter(-orZX, -orZZ);        
        cam = this.lookAt(this.center, cam);        
        cam = this.correctCenterCamDistance(cam, false);
        
        this.updatePresence(cam.position, cam.orientation);
	}
	User.prototype.moveDown = function(){
		//make cam parallel to floor	
		var cam = this.setCamUpToY(this.camera);		
		
		var orientMat = cam.orientation.toMatrix();
		//z-axis in camera coordinate system
		var orZX = orientMat.m31 * speed;
        var orZZ = orientMat.m33 * speed;
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x + orZX;
        cam.position.z = cam.position.z + orZZ;
        
        //move the center, change camera's direction such that it looks at the center 
        //and correct it's distance to center
        this.moveCenter(orZX, orZZ);        
        cam = this.lookAt(this.center, cam);        
        cam = this.correctCenterCamDistance(cam, false);
        
        this.updatePresence(cam.position, cam.orientation);
	}
	User.prototype.zoomIn = function(){		
		var cam = this.camera;		
		if (this.camCenterDistance < 5){
			return;
		}
		var dir = cam.getDirection();
        dir.normalize();
        
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x + (dir.x * speed);
        cam.position.y = cam.position.y + (dir.y * speed);
        cam.position.z = cam.position.z + (dir.z * speed);
        
        //update distance of camera to center 
        this.correctCenterCamDistance(cam, true);
        
        this.updatePresence(cam.position, cam.orientation);
	}
	User.prototype.zoomOut = function(){
		var cam = this.camera;		
		
		var dir = cam.getDirection();
		dir.normalize();
		
        //change position in direction of camera's x-axis
        cam.position.x = cam.position.x - (dir.x * speed);
        cam.position.y = cam.position.y - (dir.y * speed);
        cam.position.z = cam.position.z - (dir.z * speed);
        
        //update distance of camera to center 
        this.correctCenterCamDistance(cam, true);
        
        this.updatePresence(cam.position, cam.orientation);
	}
	
	



}, kata_base_offset + "scripts/UserScript.js");

