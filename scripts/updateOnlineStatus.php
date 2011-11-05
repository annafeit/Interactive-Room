<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt = $db->prepare("UPDATE user SET online = :online WHERE username == :username");     
    $stmt->bindParam(':username', $_POST['username']);    
    $stmt->bindParam(':online', $_POST['online']);    
    #execute statement
    $stmt->execute();
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>