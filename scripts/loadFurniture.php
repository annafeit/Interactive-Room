<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt2 = $db->prepare("SELECT preview FROM furniture  join furnituregroupcontent  where groupName == 	:name and id == furnitureId ");           
    $stmt2->bindParam(':name', $_POST['name']);    
    #execute statement
    $stmt2->execute();
    $result = $stmt2->fetchAll(PDO::FETCH_COLUMN, 0);
    print_r(json_encode($result));
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>