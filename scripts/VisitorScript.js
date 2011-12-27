var Visitor={};

Kata.require([
	'katajs/oh/GraphicsScript.js',
	kata_base_offset + 'scripts/Utils.js',
	kata_base_offset + 'scripts/behavior/visit/Visit.js'
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
	Visitor = function(channel, args){		
		//save the xml3d element
		var t = document.getElementsByTagName("xml3d");
		this.xml3d = t[0];		
		//save arguments
		this.username = args.username;
		this.space=args.space;	
		this.roomMesh = args.world;	
		
		/*
		 * "camera" mode: moving camera by drag 
		 * "furniture" mode: moving furniture by drag and drop
		 */		
		this.mode="camera";
		this.activeFurniture;
		this.initiator = false;
				
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
		
		this.furnitureShaders = {red: null, green: null, normal: null};
		this.centerFurniture = new Array();
		
		//call parent constructor
		SUPER.constructor.call(this, channel, args, function(){});
		
		
		
		//for sending messages
		this.visitBehavior = 
			new Kata.Behavior.Visit(
				this, "visitor"	
		);
		
		//connect to the spaceServer with method 'connect' of parent's parent class
		//last argument must always be a callback (->Kata.bind), a method that's invoked upon completion
		this.connect(args, null, Kata.bind(this.connected, this));		
	};
	/**
	* Simulate inheritance from GraphicsScript by extending the Visitor class with the methods of the parent(SUPER) class
	*/
	Kata.extend(Visitor, SUPER);
	
	
	/**
	* I think: This registers the "near" objects in this.mRemotePresences (with it's presence).
	* Then the script can use the presences to send messages to the hostedObjects via presence._sendHostedObjectMessage
	*/
    Visitor.prototype.proxEvent = function(remote, added) {
        if (added){
        	Kata.warn("Camera Discover object.");
	        this.presence.subscribe(remote.id());
	        this.mOther = remote;
        }
        else{
        	if (remote.mID == this.visitBehavior.owner.id){
        		Kata.warn("Owner left room");
        		alert("owner left the room");
        		document.location.href="mainMenu.xhtml";
        	}
        	else{
        		Kata.warn("Camera wiped object");
        	}
        }
    };

    
    /** Camera sync */
    Visitor.prototype.syncCamera = function() {
        var now = new Date();
        this.setCameraPosOrient(this.presence.predictedPosition(now),
                                this.presence.predictedOrientation(now),
                                0.1); //lag:0.1 just to match the code...
        this.checkWalls(); 
    };
         
    
	/**
	* Callback that is triggered when object is connected to the space
	*/
	Visitor.prototype.connected = function(presence, space, reason){
		//handle connection failure
		if (presence == null){
		Kata.error('Failed to connect viewer to '+ space+'. Reason: ' + reason);
		throw "error";
		}		
		
		//save world presence
		this.presence = presence;
		
		this.presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        this.presence.setQuery(0);   
	
		//display the object
		this.enableGraphicsViewport(this.presence,0);
		
        //save the activeView
        var id = this.xml3d.activeView;
        this.camera = document.getElementById(id);		
		
		var thus = this;
		//attach a handler for the click-event of all current AND future elements with class furniture
		$(".furniture").live("click",function(){thus.createFurniture(this)});
						
        //set up camera sync
        this.mCamUpdateTimer = setInterval(Kata.bind(this.syncCamera, this), 60);
        this.syncCamera(); 
	}
	
	Visitor.prototype.accessConfirmationRequest = function(){
		//send access confirmation request
		var args = {visitor: this.username, mode: null};
		this.visitBehavior.sendMessage("confirmAccess", args);
		//block content until access is allowed
		$("#modalDialogVisitor").append("<p>Please wait until the owner of the room authorizes your acces</p>");
		$("#modalDialogVisitor").dialog("open");
	}
	
	
	Visitor.prototype.createFurniture = function(obj){
		if(this.mode=="camera"){
			var prev = obj.getAttribute("preview");
			var id = obj.getAttribute("id");  
			var type = obj.getAttribute("type");   
			var name = obj.getAttribute("name");  
			var thus = this;
			$.post('scripts/getMeshFromFurniturePreview.php', {preview: prev}, 
					function(data, jqxhr){     				
						var url = kata_base_offset + data[0];
						//create new object in world      				
						var args = {    		    			    		    	
				    			center: thus.center,
				    			id:id,
				    			mesh: url,    		    			
				    			type:type,
				    			name:name, 
				    			initiator: thus.presence.mID
				    			};
						thus.visitBehavior.sendMessage("create", args);
					},'json');
		}
    } 
	
	Visitor.prototype.destroyFurniture = function (groupId){
		if(this.initiator){
			var args = {
					groupId: groupId
				};
			this.visitBehavior.sendMessage("destroy", args);
		}
	}

	Visitor.prototype.parseScene = function(){
		//camera
        var activeViewId = this.xml3d.activeView;
        this.camera = document.getElementById(activeViewId);
        
        var materials = document.getElementsByTagName("shader");	    
	     
	     //finds id of material-shader and transparent-shader
	     for (var i = 0; i<materials.length; i++){
	    	 var material = materials[i].id;
	    	 if (material.substr(0,8) == "material" && material.substr(0,14) != "materialCenter"){
	    		 this.material = material;
	    	 }	    	 	 		   
 		     if (material.substr(0,11) =="redMaterial"){
 		    	this.furnitureShaders["red"] = material;
 		     }
 		     if (material.substr(0,13) =="greenMaterial"){
 		    	this.furnitureShaders["green"] = material;
 		     }
 		     if (material.substr(0,19) == "transparentMaterial"){
 		    	this.transparentMaterial = material;
	    	 }
	 	    
	     }
	}
	
	  /**
	* Sets the camera to the "door-view"
	*/
    Visitor.prototype.setCamToDoor = function(){
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

	
	/**
	* check if the camera is out of the room and make walls invisible if this is true.
	*/
	Visitor.prototype.checkWalls = function(){
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
			if(rt1)
				this.setShaderTransparent(rt1.wall);							
		}
		else{
			this.setShaderSolid();
		}
	}
	

	Visitor.prototype.setShaderTransparent = function(wall){
		if(this.hiddenWall && this.hiddenWall != wall){
			this.setShaderSolid();			
		}
		if(wall){			
			wall.setAttribute("shader", "#"+this.transparentMaterial );
			this.hiddenWall = wall;
		}
		else{
			//set shader of all walls transparent
			var groups = document.getElementsByTagName("group");		
			for (var i =0;i<groups.length;i++)
			{
				var obj = groups[i];
				if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
					obj.setAttribute("shader", "#"+this.transparentMaterial );				
				}
			}
		}
		this.xml3d.update();
	}
	

	
	Visitor.prototype.setShaderSolid = function(){	
		var groups = document.getElementsByTagName("group");		
		for (var i =0;i<groups.length;i++)
		{
			var obj = groups[i];
			if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
				obj.setAttribute("shader", "#"+this.material );				
			}
			
		}
		this.xml3d.update();
		this.hiddenWall = null;
	}

	
	
	//Enum for Keycode
	Visitor.prototype.Keys = {
		UP : 38,
		DOWN : 40,
		LEFT : 37,
		RIGHT : 39,
		W : 87,
		A : 65,
		S : 83,
		D : 68
	};

	var lastClick = -Number.MAX_VALUE;
	var lastDragEvent;
	//the smaller the speed the faster the turning/moving/zooming
	//no mathematical foundation, just a  guess
	var turnSpeed = 15;	
	var zoomSpeed = 10;
	var moveSpeed = 10;
		
	//Handle messages from GUI
	Visitor.prototype._handleGUIMessage = function (channel, msg) {
		if(msg.msg=="loaded"){
			if (msg.mesh==this.roomMesh){
				this.setCamToDoor();
				this.parseScene();
			}			
			if(this.activeFurnitureUpdate){
				var obj = document.getElementById(this.activeFurnitureUpdate.groupId);
				if(obj){
					this.handleChangeShader(this.activeFurnitureUpdate);
				}
			}
			for (var i = 0; i<this.centerFurniture.length;i++){
				var msg = this.centerFurniture[i]
				var furn = msg.groupId;
				if (furn.indexOf(msg.id) != -1){
					this.centerFurniture.splice(i, 1);
					var obj = document.getElementById(furn);
					this.centerMesh(obj, msg.x, msg.y, msg.z);
				}
			}
		}
		if(msg.msg=="click"){	
			if (msg.event.timeStamp -200 < lastClick ){
				msg.msg = "doubleclick";
				lastClick = msg.event.timeStamp;
			}
			else{
				lastClick = msg.event.timeStamp;
				if(this.mode == "camera" || this.initiator){
					//send a mode-message to the owner				
					var mesh = this.xml3d.getElementByPoint(msg.x, msg.y);
					if(mesh){	
						var obj = Helper.getFurnitureGroup(mesh);
						if(obj){
							var args = {
									initiator: this.presence.mID,
									groupId: obj.id
								};
							this.visitBehavior.sendMessage("mode", args);
							return;
						}
					}
					//else for both ifs
					var args = {
						initiator: this.presence.mID,						
						};
					
					this.visitBehavior.sendMessage("mode", args);
				}				
			}
						
		}
		if(msg.msg == "doubleclick"){
			//move and rotate camera such that it looks at the center of the object that was clicked on.			
			var mesh  = this.xml3d.getElementByPoint(msg.x, msg.y);
			var obj = Helper.getFurnitureGroup(mesh);
			
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
			//send a move message to the owner
			if(this.mode == "furniture" && this.initiator){
				var furn = document.getElementById(this.activeFurniture);
				var type = furn.getAttribute("type");
				var p = Helper.getHitPoint(msg.x,msg.y,type, this.hiddenWall);
				if (p){
					var coord = p.x + " " + p.y + " " + p.z;
					var args = {
						hitPoint: coord
						};
					this.visitBehavior.sendMessage("move", args);
					if (furn.getAttribute("type")=="onWall"){
						this.centerMesh(furn);
					}
				}
			}
							
		}		
		if(msg.msg == "drag" && this.mode == "furniture"){
			if(Math.abs(msg.dx)>2 && Math.abs(msg.dy)>2 && this.initiator){
				var coord = msg.dx + " " + msg.dy;
				var args = {
					rotate: coord
					};
				this.visitBehavior.sendMessage("rotate", args);
			}
		}
		/** camera Navigation **/
		if(msg.msg == "drag" && this.mode == "camera" || !(this.initiator)){
			if (Math.abs(msg.dx) > Math.abs(msg.dy)){			
				//mouse moved more horizontally
				if(msg.dx > 0){					
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
			else { 
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
	Visitor.prototype.furnitureFromXML3D = function (obj){
		if (obj){
			if (obj.getAttribute("type").substr(0,2) == "on"){ 
				//if it's a furniture object (types "onwall", "onfloor" or "onceiling")										
				for (i in this.mRemotePresences) {
					var furn = this.mRemotePresences[i];
		            if (furn){
		            	if (furn.mID == obj.parentElement.id ){
		            		return furn;
		            	}
		            }		                
		        }
			}
		}
	}
		
	/*
	 * Methods to handle incoming messages from owner:
	 * handleChangeMode: updates the mode and activeFurniture and checks if it was the initiator of the furniture mode
	 * handleChangeShader: changes the shader of the given group (furniture) to msg.color.
	 */
	Visitor.prototype.handleChangeMode = function(msg){
		this.mode = msg.mode
		if (msg.groupId){
			this.activeFurniture = msg.groupId;
		}
		else{
			this.activeFurniture = null
		}
		if (this.mode == "furniture" && msg.initiator == this.presence.mID){
			this.initiator = true;
		}	
		else{
			this.initiator = false;
		}
	} 
	
	Visitor.prototype.handleChangeShader = function(msg){
		var group = document.getElementById(msg.groupId);
		var color = msg.color;
		
		if(group){
			if(color == "normal"){
				var parent = group.parentElement;
				$(group).remove();
				$(parent).append(this.activeFurnitureNormal);
				this.activeFurnitureNormal = null;
			}
			else{
				if(!this.activeFurnitureNormal){
					this.activeFurnitureNormal = $(group).clone();
				}
				if (group.hasAttribute("shader")){
					group.setAttribute("shader", "#"+this.furnitureShaders[color] );
				}
				//change Material of all child-groups of the furniture group
				var children = group.getElementsByTagName("group");
				for(var i=0; i < children.length; i++){
					var child = children[i];
					if (child.hasAttribute("shader")){
						child.setAttribute("shader", "#"+this.furnitureShaders[color] );
					}
				}
			}
			
			this.xml3d.update();
		}
		else{			
			this.activeFurnitureUpdate = msg;
		}
	}
	
	Visitor.prototype.handleFurnitureInfo = function(msg){
		var mesh = document.getElementById(msg.groupId);
		if (mesh){
			this.centerMesh(mesh, msg.x, msg.y, msg.z);
		}
		else{
			this.centerFurniture.push(msg);
		}
	}
	
	
	Visitor.prototype.centerMesh = function(mesh, x, y, z){
		var transform = document.getElementById(mesh.transform);
		if(!transform){
			//TODO create new transformation and assign it
		}
		transform.translation.x = x;
		transform.translation.y = y;
		transform.translation.z = z;
	}
		
	
	Visitor.prototype.handleAccessConfirmation = function(msg){
		if(msg.confirmation){
			$("#modalDialogVisitor").dialog("close");
			
		}
		else{
			$("#modalDialogVisitor").empty();
			$( "#modalDialogVisitor" ).append("<p> The owner didn't allow you to access the room</p>" )
			$( "#modalDialogVisitor" ).dialog( "option", "buttons", [
                                   {
                                	   text: "Ok",
                                	   click: function() { document.location.href='mainMenu.xhtml'; }                                	 
                                   }
                                   ] );
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
	Visitor.prototype.lookAt = function(point, cam){
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
	Visitor.prototype.updatePresence = function (position, orientation){
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
	Visitor.prototype.moveCenter = function(x, z){
		this.center.x = this.center.x + x;		
		this.center.z = this.center.z + z;		
	}
	
	
	/**
	 * Helper function to correct the Distance from the cam to the center
	 */
	Visitor.prototype.correctCenterCamDistance = function(cam, update){		
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
	Visitor.prototype.setCamUpToY = function(cam){
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
	Visitor.prototype.angleToY = function(vec){
		var yAxis = this.xml3d.createXML3DVec3();
		yAxis.x = 0;
		yAxis.y = 1;
		yAxis.z = 0;
		var alpha = (vec.dot(yAxis)) / (vec.length() * yAxis.length());  
		return alpha;
	}
	
		
	Visitor.prototype.turnRight = function(){	
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
	
	Visitor.prototype.turnLeft = function(){
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
	
	
	Visitor.prototype.turnUp = function(){
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
	Visitor.prototype.turnDown = function(){
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
	
	Visitor.prototype.moveRight = function(){
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
	Visitor.prototype.moveLeft = function(){
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
	Visitor.prototype.moveUp = function(){
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
	Visitor.prototype.moveDown = function(){
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
	Visitor.prototype.zoomIn = function(){		
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
	Visitor.prototype.zoomOut = function(){
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

    
    
    




}, kata_base_offset + "scripts/VisitorScript.js");

