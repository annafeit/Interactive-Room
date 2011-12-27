var Helper={};

Kata.require([ 
	'katajs/oh/Presence.js'
    ],function() {		
	
		/**
		 * tests whether two objects intersect by their bounding boxes
		 */
		Helper.objectIntersectsObject= function(obj1, obj2){
			//if (obj1 instanceof XML3DObject (?) && obj2 instanceof XML3DObject
			var bb1=org.xml3d.util.getWorldBBox(obj1);
			var bb2=org.xml3d.util.getWorldBBox(obj2);
			
			return bb1.intersects(bb2);
		}
		/** algorithm from http://courses.csusm.edu/cs697exz/ray_box.htm **/
		Helper.rayObjIntersection = function(obj1, ray){
			if (obj1.getBoundingBox){
			var box = org.xml3d.util.getWorldBBox(obj1);	
			var x_l = box.min.x;
			var y_l = box.min.y;
			var z_l = box.min.z;
			var x_h = box.max.x;
			var y_h = box.max.y;
			var z_h = box.max.z;
			
			var x_0 = ray.origin.x;
			var y_0 = ray.origin.y;
			var z_0 = ray.origin.z;
			var x_d = ray.direction.x;
			var y_d = ray.direction.y;
			var z_d = ray.direction.z;
			
			var tnear = -(Number.MAX_VALUE);
			var tfar = Number.MAX_VALUE;
			
			if(x_d == 0){
				if (x_0 < x_l || x_0 > x_h) return null;
			}
			if(y_d == 0){
				if (y_0 < y_l || y_0 > y_h) return null;
			}
			if(z_d == 0){
				if (y_0 < y_l || y_0 > y_h) return null;
			}
			else{
				var t1 = (x_l - x_0)/(x_d*1.0) ;
				var t2 = (x_h - x_0)/(x_d*1.0) ;
					if (t1 > t2) {var tmp = t1; t1 = t2; t2 = tmp;}
					if (t1 > tnear) tnear = t1;
					if (t2 < tfar) tfar = t2;
					if (tnear > tfar) return null;
					if (tfar < 0) return null;
				
				t1 = (y_l - y_0)/(y_d*1.0); 
				t2 = (y_h - y_0)/(y_d*1.0); 
					if (t1 > t2) {var tmp = t1; t1 = t2; t2 = tmp;}
					if (t1 > tnear) tnear = t1;
					if (t2 < tfar) tfar = t2;
					if (tnear > tfar) return null;
					if (tfar < 0) return null;
					
				t1 = (z_l - z_0)/(z_d * 1.0); 
				t2 = (z_h - z_0)/(z_d * 1.0); 
					if (t1 > t2) {var tmp = t1; t1 = t2; t2 = tmp;}
					if (t1 > tnear) tnear = t1;
					if (t2 < tfar) tfar = t2;
					if (tnear > tfar) return null;
					if (tfar < 0) return null;
				
			} return tnear;}
		}
		
		
		Helper.rayIntersectsWalls = function(ray, type, hiddenWall){
			var objs = document.getElementsByTagName("group");
			var tnear = Number.MAX_VALUE;
			var wall;
			for (var i = 0; i<objs.length; i++){				
				var obj = objs[i];				
				if(type){
					if(obj.getAttribute("type") == type){
						if (hiddenWall && (hiddenWall.id != obj.id)){
							if(this.rayObjIntersection(obj,ray)){
								return obj;
							}
						}
						else if(!hiddenWall){
							if(this.rayObjIntersection(obj,ray)){
								return obj;
							}
						}
					}
				}				
				else if (obj.getAttribute("type") == "wall" || obj.getAttribute("type") == "ceiling" || obj.getAttribute("type") == "floor"){
					var t = this.rayObjIntersection(obj,ray)
					if(t && t<tnear){
						tnear = t ; 
						wall = obj;
					}
				}
			
			}
			if(wall){
				return {wall:wall, dist: tnear};
			}
			return false;
		}
		
		/**
		 * returns an array of group objects
		 * @param
		 *   wall: the type of the group. if it is specified only those groups are returned that have this type
		 */
		Helper.getWalls = function(wall){
			if(wall){
				switch (wall){
					case "onFloor": wall = "floor"; break;
					case "onWall": wall = "wall"; break;
					case "onCeiling": wall = "ceiling"; break;
				}
				var groups = document.getElementsByTagName("group");
				var res = new Array();
				for(var i = 0; i<groups.length;i++){
					var group = groups[i];				
				    if (group.getAttribute("type") == wall){
				    	res.push(group);
				    }
				}
				return res;
			}
			else{
				var groups = document.getElementsByTagName("group");
				var res = new Array();
				for(var i = 0; i<groups.length;i++){
					if((groups[i].hasAttribute("type"))){
						res.push(groups[i]);
					}
				}
				return res;
			}
		}
		
		/**
		 * checks for the given object if it intersects with any object in the scene.
		 * obj: a xml3d <group> object
		 */
		Helper.checkForIntersections = function(obj){
			var groups = document.getElementsByTagName("group");
			var res = new Array();
			for(var i = 0; i<groups.length;i++){
				var group = groups[i];				
			    if (group.hasAttribute("type") && group.id != obj.id){
			    	var b = this.objectIntersectsObject(obj, group);
			    	if (b) {			    		
			    		return group;
			    	}
			    }
			}
			return false;
		}
		
		/**
		 * these functions return the center of a given group in world and local coordinates respectively 
		 * obj: XML3D group element
		 */
		Helper.objWorldCenter = function(obj){
			var box = org.xml3d.util.getWorldBBox(obj);
			var max = box.max;
			var min = box.min;
			var x_h = min.x + ((box.max.x - box.min.x)/2);
			var y_h = min.y + ((box.max.y - box.min.y)/2);
			var z_h = min.z + ((box.max.z - box.min.z)/2);
			var ret = {x: x_h, y:y_h, z:z_h };
			return ret;
		}
		
		Helper.centerDistance = function(obj){
			var box = obj.getBoundingBox();
			var max = box.max;
			var min = box.min;
			var x_h = (Math.abs(box.max.x - box.min.x)/2);
			var y_h = (Math.abs(box.max.y - box.min.y)/2);
			var z_h = (Math.abs(box.max.z - box.min.z)/2);
			var ret = {x: x_h, y:y_h, z:z_h };
			return ret;
		}
		
		XML3DRotation.fromBasis = function(x, y, z) {
		    var normX = x.length();
		    var normY = y.length();
		    var normZ = z.length();

		    this.xml3d = document.getElementsByTagName("xml3d")[0];
		    
		    var m = this.xml3d.createXML3DMatrix();
		    m.m11 = x.x / normX;
		    m.m12 = y.x / normY;
		    m.m13 = z.x / normZ;
		    m.m21 = x.y / normX;
		    m.m22 = y.y / normY;
		    m.m23 = z.y / normZ;
		    m.m31 = x.z / normX;
		    m.m32 = y.z / normY;
		    m.m33 = z.z / normZ;

		    return XML3DRotation.fromMatrix(m);
		};
		
		Helper.getFurnitureGroup = function(obj){
			while(obj && (!(obj.hasAttribute("type")) || !(obj.getAttribute("type").substr(0,2) == "on"))){
				obj = obj.parentElement;
			}
			return obj;
		}
		
		/**
		 * @param 
		 * x y: where the mouse clicked on the screen
		 * type: the type of the walls that should be checked 
		 * 
		 */
		Helper.getHitPoint = function(x, y, type, hiddenWall){			
			this.xml3d = document.getElementsByTagName("xml3d")[0];
			
			var ray = this.xml3d.generateRay(x,y);
			var walls = this.getWalls(type);			
			var hitPoint = new Array();
			
			for(var i = 0; i<walls.length;i++){
				var wall = walls[i];				
				if((hiddenWall && (wall.id != hiddenWall.id)) || (!hiddenWall)){
					var tnear = this.rayObjIntersection(wall,ray);				
					if(tnear ){
						hitPoint.x = ray.origin.x + ray.direction.x*tnear;
						hitPoint.y = ray.origin.y + ray.direction.y*tnear;
						hitPoint.z = ray.origin.z + ray.direction.z*tnear;
						break;
					}
				}
				
			}
			return hitPoint;
		}
		
		/**
		 * 
		 * Checks if a ray with origin in camera position and direction in camera direction intersects with a wall
		 * Test in five direction: original direction of camera, and directions with modified x y z coordinates 
		 * 
		 */
		Helper.checkCameraRayWallIntersection = function(cam){
			this.xml3d = document.getElementsByTagName("xml3d")[0];
			this.camera = cam;
			
			var walls = Helper.getWalls("wall");						

			var ray = this.xml3d.createXML3DRay();
			ray.origin = this.camera.position;
			ray.direction = this.camera.direction;
			
			var dist= Number.MAX_VALUE;
			var wall = null;
			for (var i = 0; i<walls.length; i++){				
				var inter = this.rayObjIntersection(walls[i], ray);
				if(inter){
					if (inter<dist){
						dist = inter;
						wall = walls[i];
					}
				}
			}
			return wall;			
		}
		
		/**
		 * @param
		 * wall: a group element of the xml3d scene of type "wall"
		 * @return
		 * the coordinate thats constant in this wall, e.g. x if the wall is parallel to the y-z plane
		 * and the value of this component
		 */
		Helper.getConstantCoordinate = function(wall){
			var bb = org.xml3d.util.getWorldBBox(wall);
			if(bb.max.x == bb.min.x){
				return {coord: "x", value: bb.min.x};
			}else{
				if(bb.max.z == bb.min.z){
					return {coord: "z", value: bb.min.z};
				}	
			}			
		}
		
		/**
		 * computes the normal of the given wall
		 * @return
		 * the normal in form "x y z"
		 */
		Helper.getWallNormal = function(wall){
			var src = $(wall).children("mesh")[0].src;
			var data = document.getElementById(src);
			var children = $(data).children();
			var child;
			for (var i = 0; i<children.length;i++){
				if(children[i].getAttribute("name") == "normal"){
					child = children[i];
					break;
				}
			}
			var str = child.textContent.replace(/\s/g, "").split("");
			var normal="";
			var l = 0;
			for (var i = 0;l<3;i++){
				var z = str[i];			
				if(z == "-"){
					normal = normal + z;
				}
				else{
					normal = normal + z + " ";
					l++;
				}			
			}
			return normal;
		}
		
		Helper.greaterNumber = function(x,y){
			if (x>y) return x;
			else return y;
		}
		
		Helper.smallerNumber = function(x,y){
			if (x<y) return x;
			else return y;
		}
		
	
		
	
}, kata_base_offset + "scripts/Utils.js");
