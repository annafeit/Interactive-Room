var Helper={};

Kata.require([ 
	'katajs/oh/Presence.js'
    ],function() {
		/**
		 * tests whether two objects intersect by their bounding boxes
		 */
		Helper.objectIntersectsObject= function(obj1, obj2){
			//if (obj1 instanceof XML3DObject (?) && obj2 instanceof XML3DObject
			var bb1=obj1.getBoundingBox();//org.xml3d.util.getWorldBBox(obj1);
			var bb2=obj2.getBoundingBox();//org.xml3d.util.getWorldBBox(obj2);
			
			if( bb1.min.x>bb2.max.x || bb1.min.y > bb2.max.y  || bb1.min.z > bb2.max.z ||
			    bb2.min.x>bb1.max.x || bb2.min.y > bb1.max.y  || bb2.min.z > bb1.max.z 	){
				return false;
			}
			else{
				return true;
			}
		}
		
		/**
		 *TODO doesn't always work correctly, find out why + make only nearest wall transparent
		 * test if a ray intersects an object
		 */
		Helper.rayIntersectsObject = function(obj1, ray){
			var vec = new Array();
			vec.x = 'x';
			vec.x = 'y';
			vec.x = 'z';
			if (obj1.getBoundingBox){
				var bb = org.xml3d.util.getWorldBBox(obj1);	
				var o = ray.origin;
				var d = ray.direction;
				var tnear = -(Number.MAX_VALUE);
				var tfar = Number.MAX_VALUE;
				for (i in vec){
					if (d[i] == 0){
						//parallel to plane that's normal to x/y/z axis
						if (o[i] < bb.min[i] || o[i] > bb.max[i]){
							//can't intersect with box
							return false;
						}
					}
					else{
						//not parallel
						var tmpnear = (bb.min[i] - o[i]) / d[i];
						var tmpfar = (bb.max[i] - o[i]) / d[i];
						if (tmpnear > tmpfar) {
							var tmp = tmpnear;
							tmpnear = tmpfar;
							tmpfar = tmp;	//tmpnear indicates the intersection distances to the nearest plane					
						}
						if (tmpnear > tnear) tnear = tmpnear;				//tnear indicates the greatest intersection point with near plane in any dimension
						if (tmpfar < tfar) tfar = tmpfar;					//tnear indicates the smallest intersection point with far plane in any dimension
						if (tfar <0) {										//box is behind camera
							return false;
						}
					}
				}
				if (tnear < tfar){
					return true;
				}
				else{
					return false;
				}
			}
			
		}
		
		Helper.rayIntersectsScene = function(ray){
			var objs = document.getElementsByTagName("group");			
			for (var i = 0; i<objs.length; i++){				
				var obj = objs[i];				
				if (obj.hasAttribute("type")){
					if(this.rayIntersectsObject(obj,ray)){
						return true;
					}
				}
			
			}
			return false;
		}
	
		
	
});
