var Furniture = {};

Kata.require([ 
	'katajs/oh/Script.js', 
	kata_base_offset + 'scripts/UserScript.js',
	kata_base_offset + 'scripts/Utils.js'
],function() {

	var SUPER = Kata.Script.prototype;

	/**
	 * THE FURNITURE SCRIPT
	 * 
	 * id of the corresponding group in the xml3d scene
	 * this.name + this.presence.mID
	 * 
	 */
	Furniture = function(channel, args){
		this.mesh = args.visual.mesh;
		this.space = args.space;
		this.initialPos = args.center;
		this.furnitureId = args.id;
		this.position = args.position;			//only not null when object is recreated in the room
		this.orientation = args.orientation;	//only not null when object is recreated in the room
		this.type = args.type;
		this.dbID = args.dbID;	//the entryID of this furniture in the "host" table of the database. 

		this.name = args.name;
		this.group = null;			
		
		this.inDB = args.inDB;
		this.shader = "normal";
		this.materials = {red: null, green: null, normal: null};
		
		
		this.active = false;		
		
		this.xml3d = document.getElementsByTagName("xml3d")[0];
		
		//save furniture in userscript
		this.owner = document.userScript;
    	this.owner.furniture.push(this);    	
		
		SUPER.constructor.call(this, channel, args, function(){});
			
		this.connect(args, null, Kata.bind(this.connected, this));	
		
	};

	Kata.extend(Furniture, SUPER);

	/**
	* proximity callback TODO ???
	*/
    User.prototype.proxEvent = function(remote, added) {
        if (added){
        	Kata.warn("Furniture Discovered object.");
	        this.presence.subscribe(remote.id());
	        this.mOther = remote;
        }
        else{
        	Kata.warn("Furniture wiped object");
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
 
        //checks if the has already been loaded
        var loads = this.owner.loadedFurnitures;
		var loaded;
		for (var i = 0; i<loads.length;i++){
			if(loads[i] == this.presence.mID){
				loaded = true;
			}
		}
		if(loaded){
			this.meshLoaded();
		}
	}
	
	Furniture.prototype.setInitialPos = function(){
		var now = new Date();
		var loc = this.presence.predictedLocationAtTime(now);	
		if(this.position){
		    loc.pos = this.position;	    
		    this.presence.setLocation(loc);
		    
		    if(this.orientation){		    
			    loc.orient = this.orientation; 	    
			    this.presence.setLocation(loc);
			}
		}
		else{
			if(this.initialPos){
				//set furniture to the current center		   
			    var p = this.initialPos;		  
			    
			    var walls = Helper.getWalls(this.type);
			    
				switch (this.type){
					case "floor":						
					    var box = org.xml3d.util.getWorldBBox(walls[0]);
						p.y = box.min.y;
						loc.pos = [p.x, p.y, p.z];	    
						this.presence.setLocation(loc);
						break;
					case "wall": 
						//TODO look for wall that's in camera view
						break;
					case "ceiling":
						var box = org.xml3d.util.getWorldBBox(walls[0]);
						p.y = box.min.y;
						loc.pos = [p.x, p.y, p.z];	    
						this.presence.setLocation(loc);				
						break;
					default: console.log("furniture " + this.name + this.presence.mID +": wrong type")
				}
			}
		}
		if(this.shader = "normal"){
			this.lastValidPosition = this.presence.predictedLocationAtTime(now);
		}
	}
	
	/*
	 * If the mesh is loaded in initially parses the xml3d file for it's group, all children of it's group
	 * and the green and red shaders.
	 */	
	Furniture.prototype.meshLoaded = function(){
		//save corresponding group in xml3d-scene
		this.group = document.getElementById(this.name + this.presence.mID);
		this.parseScene();
		this.centerMesh();
		this.setInitialPos();
		
		if(!(this.inDB)){
			this.checkForIntersections()			
			this.active = true;						
		}
		this.owner.furnitureCreated(this, this.inDB);
	}
	
	/**
	 * changes the transformation attributre of the corresponding mesh in such a way,
	 * that it's centered around (0,0) on the x-z plane for ceiling and floor furnitures
	 * and on the x-y plane for furnitures with type wall.
	 * The y-coordinate is 0.1 for floor furnitures and -0.1 for ceiling furnitures.
	 * The z-coordinate is -0.1 for wall furnitures  
	 */
	Furniture.prototype.centerMesh = function(){
		var transform = document.getElementById(this.group.transform);
		if(!transform){
			//TODO create new transformation and assign it
		}
		//TODO doesnt work
		var center = Helper.centerDistance(this.group);
		switch (this.type){
			case "floor":
				transform.translation.x = center.x;
				//such that the min coordinate is at (x,0,z)
				transform.translation.y = (1+ (-1)*this.group.getBoundingBox().min.y);
				transform.translation.z = center.z;
				break;
			case "wall":
				transform.translation.x = -center.x;
				transform.translation.y = -center.y
				transform.translation.z = -1;
				break;
			case "ceiling":
				transform.translation.x = center.x;
				transform.translation.y = ((-1)*this.group.getBoundingBox().max.y)
				transform.translation.z = center.z;
				break;
		
		}
	}
	
	
	/**
	 * checks if this object's mesh currently intersects with anything in the world. 
	 * If so, the shader of the object changes to red, otherwise to green.
	 * return: a group this object intersects with
	 */
	Furniture.prototype.checkForIntersections = function(){		
		var intersectionGroup = Helper.checkForIntersections(this.group);
		if (intersectionGroup){
			this.changeShader("red");			
		}
		else{
			this.changeShader("green");
		}
		return intersectionGroup;
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
		if(color != this.shader){
			if(color == "normal"){
				var parent = this.group.parentElement;
				$(this.group).remove();
				$(parent).append($(this.normalGroup).clone());
				this.group = document.getElementById(this.name + this.presence.mID);
			}
			else{
				// if scene wasn't parsed yet		
				if (this.materials.red == null){
					this.parseScene();
				}
				
				//set shader attribute for this group and all it's children
				if (this.group.hasAttribute("shader")){
					this.group.setAttribute("shader", "#"+this.materials[color] );
				}
				var children = this.group.getElementsByTagName("group");
				for(var i=0; i < children.length; i++){
					var child = children[i];
					if (child.hasAttribute("shader")){
						child.setAttribute("shader", "#"+this.materials[color] );
					}
				}
			}
			this.shader = color;		
			this.xml3d.update();		
			this.owner.shaderChanged(this.group, this.shader);
		}
	}
		
	/**
	 * parses the xml3d file:
	 * saves the red and green shaders in the material array.
	 * saves all child nodes of this.group 
	 */
	Furniture.prototype.parseScene = function(){	
        var materials = document.getElementsByTagName("shader");	    
	    //finds id of red, green and normal shader
	    for (var i = 0; i<materials.length; i++){
		    var material = materials[i].id;
		    if (material.substr(0,11) =="redMaterial"){
		    	this.materials.red = material;
		    }
		    if (material.substr(0,13) =="greenMaterial"){
		    	this.materials.green = material;
		    }
	    }
	    
	    this.normalGroup = $(this.group).clone();
	}
	
	Furniture.prototype.setActive = function(b){
		if(this.active && !b && !(this.shader == "red")){
			//save new position and orientation in DB only if this isn't active any more and placed correctly
			this.updateFurnitureInDB();
			this.active = b;
		}		
		else if(b){
			this.active = b;
		}
	}	
	
	Furniture.prototype.moveFurnitureToMouse = function(x, y, hitpoint){		
		//look if a ray from the current mouse position hits a wall of the right type.
		var hitPoint = hitpoint;
		if(!hitpoint){
			hitPoint = Helper.getHitPoint(x,y,this.type);
		}
		//move furniture to the hitpoint (if there is one)
		if(hitPoint.x){
			switch (this.type){		
				case "floor": 
					this.movePresence(hitPoint);
					break;
				case "wall":
					//TODO change orientation
					this.movePresence(hitPoint);
					break;
				case "ceiling":
					this.movePresence(hitPoint);
					break;
			}
		}
		//check for intersections
		var group = this.checkForIntersections();
		if(group){
			//TODO wieso dauert es so lange bis er sich wieder bewegt, wenn ich das mache?
			/*var type = group.getAttribute("type");
			if((type == "wall" || type == "ceiling" || type == "floor") && this.lastValidPosition){
				//object intersects with a wall -> move back to last valid position
				this.movePresenceToLastValid();
				this.changeShader("green");
			}*/
		}
		else{
			var now = new Date();
			this.lastValidPosition = this.presence.predictedLocationAtTime(now);
		}
		
	}
	
	Furniture.prototype.updateFurnitureInDB = function (){
		var pos = this.getPosition();
		var or = this.getOrientation();
		var dbID = this.dbID;
		if(dbID){
			$.post('scripts/updateFurniture.php', {dbID: dbID, position: pos, orientation: or}, 
					function(data, jqxhr){});
		}
		else{
			var thus = this;
			$.post('scripts/createFurniture.php', {furnitureId: this.furnitureId, roomId: this.owner.roomId, position: pos, orientation: or}, 
					function(data, jqxhr){
						thus.dbID = data[0];
					},'json');
		}
	}
	
	/**
	 * helper function to update the presence's position and orientation
	 * position: (x,y,z)
	 * orientation: XML3DRotation 
	 */
	Furniture.prototype.movePresence = function (position, orientation){
		 var now = new Date();
	     var loc = this.presence.predictedLocationAtTime(now);		     
	     //create location
	     if(position){
	    	 loc.pos = [position.x, position.y, position.z];
	     }
	     if(orientation){
		     var or = Kata._helperQuatFromAxisAngle(
		                    [orientation.axis.x, orientation.axis.y, orientation.axis.z],
		                    orientation.angle);
		     loc.orient = or;		 
	     }
	     this.presence.setLocation(loc);	    
	}
	
	/**
	 * helper function to update the presence's position and orientation to 
	 * the last valid position
	 *
	 */
	Furniture.prototype.movePresenceToLastValid = function (){
		 var now = new Date();
	     var loc = this.presence.predictedLocationAtTime(now);		     
	     //create location	    
	     loc.pos = this.lastValidPosition.pos;
	     loc.orient = this.lastValidPosition.orient;	     
	     this.presence.setLocation(loc);	    
	}
	
	/**
	 * rotates the Furniture by doing the following:
	 * for type floor:
	 * (1) take the center of the obj projected on the floor 
	 *     add dx and dy on the x and z coordinate.
	 *     subtract the two points to get the new looking direction for this object
	 *     negate and normalize it.
	 * (2) take the up vector of the obj (0 1 0) 
	 *     take the cross product of the up vector and the direction
	 *     get the rotation with the method XML3DRotation.fromBasis
	 *     
	 * basically its done like in the lookAt + setDirection method of the view element.
	 */
	Furniture.prototype.rotate = function(dx, dy){
		var transform = document.getElementById(this.group.transform);
        var rotation = transform.rotation;
        
        //get initial direction vector
        var init = this.xml3d.createXML3DVec3();
        init.x = 0; init.y = 0; init.z = -1;
        init = rotation.rotateVec3(init);
        
        //create new direction vector               
        var mousePos = this.xml3d.createXML3DVec3();
        var centerVec = this.xml3d.createXML3DVec3();
        var center = Helper.objWorldCenter(this.group);  
        var up = this.xml3d.createXML3DVec3();
        
        switch(this.type){
        	case "floor":
        		centerVec.x = center.x;
        		centerVec.y = 0;
                centerVec.z = center.z;
                
                mousePos.x = center.x + dx;
                mousePos.z = center.z + dy;
                mousePos.y = 0;
                
                up.x = 0; up.y = 1; up.z = 0;
                break;
        	case "ceiling":
        		var box = org.xml3d.util.getWorldBBox(this.getWall());
        		centerVec.x = center.x;
        		centerVec.y = box.min.y;
                centerVec.z = center.z;
                
                mousePos.x = center.x + dx;
                mousePos.z = center.z + dy;
                mousePos.y = box.min.y;
                break;
        		
        }        
        
        var dir = mousePos.subtract(centerVec);
        dir = dir.normalize();
        
        var right = up.cross(dir).normalize();
        up = dir.cross(right).normalize();
        
        var orientation = XML3DRotation.fromBasis(right, up, dir);  
        orientation.setAxisAngle(orientation.axis, orientation.angle*(-1));
        this.movePresence(null, orientation);
        this.checkForIntersections();
	}	
	
	
	/**
	 * computes the wall this furniture is actually placed on
	 */
	Furniture.prototype.getWall = function(){
		var camPos = this.owner.camera.position;		
		var now = new Date();
		var meshPos = this.presence.predictedPosition(now);
		
		var vec = this.xml3d.createXML3DVec3();
		vec.x = meshPos[0]; vec.y = meshPos[1]; vec.z = meshPos[2];
		var direction = vec.subtract(camPos);
		
		var ray = this.xml3d.createXML3DRay();
		ray.origin = camPos;
		ray.direction = direction;
		
		var group = Helper.rayIntersectsWalls(ray, this.type);		
		return 	group;	
	}
	
	
	

}, kata_base_offset + "scripts/FurnitureScript.js");
