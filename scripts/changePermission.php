<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt2 = $db->prepare("UPDATE visits SET permission = :permission WHERE roomId == :roomId and visitor == :visitor");           
    $stmt2->bindParam(':roomId', $_POST['roomId']);    
    $stmt2->bindParam(':visitor', $_POST['visitor']);    
    $stmt2->bindParam(':permission', $_POST['permission']);    
    #execute statement
    $stmt2->execute();   
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>