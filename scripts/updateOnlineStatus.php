<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt = $db->prepare("UPDATE owns SET online = :online WHERE owner == :username and roomId == :id" );     
    $stmt->bindParam(':username', $_POST['username']);    
    $stmt->bindParam(':online', $_POST['online']);    
    $stmt->bindParam(':id', $_POST['roomId']);    
    #execute statement
    $stmt->execute();
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>