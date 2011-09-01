$(document).ready(
	function() {
		$("#menu-type").accordion({
			autoHeight: false,
			navigation: true
		});				
		
		/*****	Room Navigation Menu	*****/
		$("#chooseRoom").click(function(){
			if ($("#chooseRoom").hasClass("choosingRoomClicked")){
				$("#chooseRoom").removeClass("choosingRoomClicked");
				$("#chooseMenu").hide();
			}
			else{
				$("#chooseRoom").addClass("choosingRoomClicked");			
				$("#newRoom").removeClass("choosingRoomClicked");
				$("#friendRoom").removeClass("choosingRoomClicked");
				$("#chooseMenu").show();
			}
		});
		
		$("#newRoom").click(function(){
			if ($("#newRoom").hasClass("choosingRoomClicked")){
				$("#newRoom").removeClass("choosingRoomClicked");
			}
			else{
				$("#newRoom").addClass("choosingRoomClicked");			
				$("#chooseRoom").removeClass("choosingRoomClicked");				
				$("#friendRoom").removeClass("choosingRoomClicked");
			}
		});
		
		$("#friendRoom").click(function(){
			if ($("#friendRoom").hasClass("choosingRoomClicked")){
				$("#friendRoom").removeClass("choosingRoomClicked");
			}
			else{
				$("#friendRoom").addClass("choosingRoomClicked");				
				$("#newRoom").removeClass("choosingRoomClicked");
				$("#chooseRoom").removeClass("choosingRoomClicked");
			}
		});
			
		
		/** Test Scrollbar **/


		
		$('#content').serialScroll({
			items:'li',
			prev:'#roomBrowser #prev',
			next:'#roomBrowser #next',
			offset:-105, //when scrolling to object, stop 105 before reaching it (from the left)
			start:1, //as we are centering it, start at the 2nd
			duration:1200,
			force:true,
			stop:true,
			lock:false,
			cycle:false, //don't pull back once you reach the end
			//easing:'easeOutQuart', //use this easing equation for a funny effect
			
		});
	}
);
	
		
function init(){			
	 $("#all").hide();
	 $("#choose").hide();	
}	


function categoryClicked(element){
	document.getElementById("menu-furniture").innerHTML = element.innerHTML;
}