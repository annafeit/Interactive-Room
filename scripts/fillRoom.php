<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt = $db->prepare("SELECT id, mesh, position, orientation FROM hosts join furniture where roomId == :roomId AND furnitureId == id");           
    $stmt->bindParam(':roomId', $_REQUEST['roomId']);    
    #execute statement
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r(json_encode($result));
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>