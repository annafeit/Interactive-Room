Kata.require([
    'externals/protojs/protobuf.js',
     'externals/protojs/pbj.js',
     kata_base_offset + 'scripts/Utils.js'
], function() {

    if (typeof(Kata.Behavior) == "undefined")
        Kata.Behavior = {};

    /** 
	 * behavior to send and handle messages to and from the owner of the room
	 *
     *
     *  @constructor
     *  @param parent {Kata.Script} the parent Script for this behavior
     *  @param type 	visitor or owner
     */
    Kata.Behavior.Camera = function(parent, cam, xml3d) {
        this.parent = parent;
        this.parent.addBehavior(this);

        this.cameraMode = "top";
        this.mode = "camera";
        
        this.camera = cam;
        this.xml3d = xml3d;
        this.center = this.xml3d.createXML3DVec3();
        this.hiddenWalls = new Array();
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
		this.keyIsDown[this.Keys.DEL] = false;
		
		this.parseScene();
		this.setCamToView("top");		
		
		
		//set up camera sync
        this.mCamUpdateTimer = setInterval(Kata.bind(this.syncCamera, this), 60);
        this.syncCamera();                
    }; 
    
    
    Kata.Behavior.Camera.prototype.parseScene = function(){
		//camera
        var activeViewId = this.xml3d.activeView;
        this.camera = document.getElementById(activeViewId);
        
        var groups = document.getElementsByTagName("group");	    
        var materials = document.getElementsByTagName("shader");
	    var transparent;
	    
	    //creates a list of walls and its shaders
	    this.wallShader = new Array();
	    for (var i = 0; i<groups.length; i++){
	    	 var group = groups[i];
	    	 if ((group.getAttribute("type") == "wall") || (group.getAttribute("type") == "floor") || (group.getAttribute("type") == "ceiling")){
	    		 shader = group.getAttribute("shader");	 
	    		 this.wallShader[group.id] = shader; 
	    	 }
	     }	   
	    for (var i = 0; i<materials.length; i++){
	    	 transparent = materials[i].id;
	    	 if (transparent.substr(0,19) == "transparentMaterial"){
	    		 break;
	    	 }
	     }
	    
	     this.transparentMaterial = transparent;
	}
    
    Kata.Behavior.Camera.prototype.setupButtons = function(angleVec) {    	
    	var thus = this;
	    $("#firstPersonView").click(function(){thus.setCamToView("firstPerson")});
		$("#topView").click(function(){thus.setCamToView("top")});
		
		$("#camLeft").mousedown(function(){thus.setVelocity("left")});
		$("#camLeft").mouseup(function(){thus.disableVelocity(true, false)});
		
		$("#camRight").mousedown(function(){thus.setVelocity("right")});
		$("#camRight").mouseup(function(){thus.disableVelocity(true, false)});
		
		$("#camUp").mousedown(function(){thus.setVelocity("up")});
		$("#camUp").mouseup(function(){thus.disableVelocity(true, false)});
		
		$("#camDown").mousedown(function(){thus.setVelocity("down")});
		$("#camDown").mouseup(function(){thus.disableVelocity(true, false)});
		
		$("#camTurnRight").mousedown(function(){thus.setAngularVelocity("right")});
		$("#camTurnRight").mouseup(function(){thus.disableVelocity(false, true)});
		
		$("#camTurnLeft").mousedown(function(){thus.setAngularVelocity("left")});
		$("#camTurnLeft").mouseup(function(){thus.disableVelocity(false, true)});
		
		$("#camTurnUp").mousedown(function(){thus.setAngularVelocity("up")});
		$("#camTurnUp").mouseup(function(){thus.disableVelocity(false, true)});
		
		$("#camTurnDown").mousedown(function(){thus.setAngularVelocity("down")});
		$("#camTurnDown").mouseup(function(){thus.disableVelocity(false, true)});
		
		$("#camZoomSlider").slider("option", "value",  (-1)*this.camCenterDistance);
		$("#camZoomSlider").bind( "slide", function(event, ui) {
			  thus.zoomTo((ui.value * (-1)));
			});
    };
    
    /**
	* Sets the camera to the view with the given name
	*/
    Kata.Behavior.Camera.prototype.setCamToView = function(v){
	     var views = document.getElementsByTagName("view");
	     var view;
	     var l = v.length;
	     //finds the viewpoint of the given view
	     for (var i = 0; i<views.length; i++){
	    	 view = views[i];
	    	 if (view.id.substr(0,l) == v){
	    		 break;
	    	 }
	     }
    	 //set center variable
    	 var s = view.getAttribute("center").split(" "); 
    	     	 
    	 this.center.x = s[0];
    	 this.center.y = s[1];
    	 this.center.z = s[2];     	 
    	 
    	 var view2 = this.lookAt(this.center, view);
    	 
    	//set initial distance from cam to center
    	 var dist = view2.position.subtract(this.center);
 		 this.camCenterDistance = dist.length(); 		
 		 
 		 var p = view2.position;
	     var o = view2.orientation;
 		 
    	 //set presence position
	     this.updatePresence(p, o);
	     this.setupButtons(view2.getDirection());
	     
	     this.cameraMode = v;
    };
    
    /**
	 * helper function to update the presence's position and orientation
	 * position: XML3DVec3
	 * orientation: XML3DRotation 
	 */
    Kata.Behavior.Camera.prototype.updatePresence = function (position, orientation){
		 var now = new Date();
	     var loc = this.parent.presence.predictedLocationAtTime(now);		     
	     
	     if(position){
	    	 loc.pos = [position.x, position.y, position.z];
	     }
	     if(orientation){
	    	 var or = Kata._helperQuatFromAxisAngle(
	                    [orientation.axis.x, orientation.axis.y, orientation.axis.z],
	                    orientation.angle);
	    	 loc.orient = or;
	     }
	     this.parent.presence.setLocation(loc);	    
	}
    
    /** Camera sync */
    Kata.Behavior.Camera.prototype.syncCamera = function() {
        var now = new Date();
        this.parent.setCameraPosOrient(this.parent.presence.predictedPosition(now),
                                this.parent.presence.predictedOrientation(now),
                                0.1); //lag:0.1 just to match the code...
        this.checkWalls(); 
    };
    
    /**
	* check if the camera is out of the room and make walls invisible if this is true.
	*/
    Kata.Behavior.Camera.prototype.checkWalls = function(){
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
	

	Kata.Behavior.Camera.prototype.setShaderTransparent = function(wall){
		if(this.hiddenWalls[0] && !(Helper.contains(this.hiddenWalls, wall))){
			this.setShaderSolid();			
		}
		if(wall && !(Helper.contains(this.hiddenWalls, wall))){	
			var walls = new Array();
			if(wall.getAttribute("type") == "ceiling"){
				walls = Helper.getWalls(wall.getAttribute("type"));
			}
			if(wall.getAttribute("type") == "wall"){
				walls[0] = wall;
			}
			for (var i=0;i<walls.length;i++){
				walls[i].setAttribute("shader", "#"+this.transparentMaterial );
				this.hiddenWalls.push(walls[i]);
			}
		}
		if(!wall){
			//set shader of all walls transparent
			var groups = document.getElementsByTagName("group");		
			for (var i =0;i<groups.length;i++)
			{
				var obj = groups[i];
				if(obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling"){
					obj.setAttribute("shader", "#"+this.transparentMaterial );	
					this.hiddenWalls.push(obj);
				}
			}
		}
		this.xml3d.update();
	}
	

	
	Kata.Behavior.Camera.prototype.setShaderSolid = function(){					
		for (var i =0; i<this.hiddenWalls.length; i++){		
			var obj = this.hiddenWalls[i];
			var shader = this.wallShader[obj.id];
			obj.setAttribute("shader", shader );				
		}
					
		this.xml3d.update();
		this.hiddenWalls = new Array();
	} 
    
	Kata.Behavior.Camera.prototype.zoomTo = function(dist) {
		diff = Math.round(this.camCenterDistance) - dist;		
		
		var dir = this.camera.getDirection().negate();
		var pos = this.center.add(dir.scale(dist));
		
		//var pos = this.camera.position.add(this.camera.getDirection().scale(diff));
		this.camCenterDistance = (pos.subtract(this.center)).length();	
		this.updatePresence(pos, this.camera.orientation);
		
	}
	
    Kata.Behavior.Camera.prototype.setVelocity = function(dir) {
    	var avMat = Kata.QuaternionToRotation(this.parent.presence.predictedOrientation(new Date()));
    	var avSpeed = 50;
    	var avXX = avMat[0][0] * avSpeed;
        var avXY = avMat[0][1] * avSpeed;
        var avXZ = avMat[0][2] * avSpeed;
        var avZX = avMat[2][0] * avSpeed;
        var avZY = avMat[2][1] * avSpeed;
        var avZZ = avMat[2][2] * avSpeed;
        
        if (dir == "right")
        	this.parent.presence.setVelocity([avXX, avXY, avXZ]);
        if (dir == "left")
        	this.parent.presence.setVelocity([-avXX, -avXY, -avXZ]);
        if (dir == "up")
        	this.parent.presence.setVelocity([-avZX, 0, -avZZ]);
        if (dir == "down")
        	this.parent.presence.setVelocity([avZX, 0 , avZZ]);
        
        this.moveCenter();
        this.parent.updateGFX(this.parent.presence)
    }
    
    Kata.Behavior.Camera.prototype.setAngularVelocity = function(dir) {
    	if(this.cameraMode == "firstPerson"){
	    	var full_rot_seconds = 10.0;    	        
	    	var yaxis = this.camYAxisInWorldCoord();
	    	
	        if (dir == "right")
	        	this.parent.presence.setAngularVelocity(
	                    Kata.Quaternion.fromAxisAngle([yaxis.x, yaxis.y, yaxis.z], -2.0*Math.PI/full_rot_seconds)
	                );       
	        if (dir == "left")
	        	this.parent.presence.setAngularVelocity(
	                    Kata.Quaternion.fromAxisAngle([yaxis.x, yaxis.y, yaxis.z], 2.0*Math.PI/full_rot_seconds)
	                );
	        if (dir == "up")
	        	this.parent.presence.setAngularVelocity(
	                    Kata.Quaternion.fromAxisAngle([1, 0, 0], 2.0*Math.PI/full_rot_seconds)
	                );
	        if (dir == "down")
	        	this.parent.presence.setAngularVelocity(
	                    Kata.Quaternion.fromAxisAngle([1, 0, 0], -2.0*Math.PI/full_rot_seconds)
	                );
    	}
    	else{
    		
    	}
	        this.parent.updateGFX(this.parent.presence)
    }
        
    Kata.Behavior.Camera.prototype.disableVelocity = function(move, turn) {
    	if (move){
    		this.parent.presence.setVelocity([0, 0, 0]);
    	}
    	if (turn){
    		this.parent.presence.setAngularVelocity(Kata.Quaternion.identity());
    	}
    	
    	this.moveCenter();
    	this.parent.updateGFX(this.parent.presence)
    }
    
    Kata.Behavior.Camera.prototype.camYAxisInWorldCoord = function(){
    	var or = this.camera.orientation;
    	var orient = this.xml3d.createXML3DRotation();
    	var axis = or.axis;
    	var angle = or.angle * (-1);
    	orient.setAxisAngle(axis, angle);
    	
    	var vec = this.xml3d.createXML3DVec3();
    	vec.x = 0;
    	vec.y = 1;
    	vec.z = 0;
    	
    	return orient.rotateVec3(vec);
    }
    
    Kata.Behavior.Camera.prototype.turnDown = function(){
		var cam = this.camera;
		
		//angle of camDirection to y-Axis in the range of 0° - 180°
		var angle = this.angleToY(cam.getDirection());
		if(angle > 0.98){
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
                
    
    /**
	 * Helper function to move the Center
	 */
    Kata.Behavior.Camera.prototype.moveCenter = function(x, z){
    	var dir = this.camera.getDirection().normalize();
    	this.center = this.camera.position.add(dir.scale(this.camCenterDistance));		
	}
    
	//Enum for Keycode
	Kata.Behavior.Camera.prototype.Keys = {
		UP : 38,
		DOWN : 40,
		LEFT : 37,
		RIGHT : 39,
		W : 87,
		A : 65,
		S : 83,
		D : 68,
		DEL:46
	};
	
	Kata.Behavior.Camera.prototype.lookAt = function(point, cam){
		var vector = point.subtract(cam.position);
		vector = vector.normalize();
		cam.setDirection(vector);
		this.center = point;
		this.camCenterDistance = (cam.position.subtract(this.center)).length();				  
		return cam;
	}
    
	/**
	 * Helper function to compute the angle between a vector and the y-axis
	 */
	Kata.Behavior.Camera.prototype.angleToY = function(vec){
		var yAxis = this.xml3d.createXML3DVec3();
		yAxis.x = 0;
		yAxis.y = 1;
		yAxis.z = 0;
		var alpha = Math.acos((vec.dot(yAxis)) / (vec.length() * yAxis.length()));  
		return alpha;
	}
    
    
    
}, '../../scripts/behavior/Camera.js');







