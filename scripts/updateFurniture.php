<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt2 = $db->prepare("UPDATE hosts SET position = :position , orientation = :orientation WHERE entryId == :dbID");           
    $stmt2->bindParam(':dbID', $_POST['dbID']);    
    $stmt2->bindParam(':position', $_POST['position']);    
    $stmt2->bindParam(':orientation', $_POST['orientation']);    
    #execute statement
    $stmt2->execute(); 
     
    }

  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>