<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    
    #insert in "room" table
    $stmt = $db->prepare("INSERT INTO hosts (entryId, roomId, furnitureId, position, orientation) VALUES (null, :roomId, :furnitureId, :position, :orientation)");
    $stmt->bindParam(':furnitureId', $_REQUEST['furnitureId']);
    $stmt->bindParam(':roomId', $_REQUEST['roomId']);
    $stmt->bindParam(':position', $_REQUEST['position']);
    $stmt->bindParam(':orientation', $_REQUEST['orientation']);
    #execute statement
    $stmt->execute();

    #get furniture Entry ID
    $stmt3 = $db->prepare("select max(entryId) from hosts where furnitureId == :furnitureId and roomId == :roomId and position == :position");           
    $stmt3->bindParam(':furnitureId', $_REQUEST['furnitureId']);
    $stmt3->bindParam(':roomId', $_REQUEST['roomId']);
    $stmt3->bindParam(':position', $_REQUEST['position']);
    #execute statement
    $stmt3->execute();
    $result = $stmt3->fetchAll(PDO::FETCH_COLUMN, 0);
    print_r(json_encode($result));  
  }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }

  $db = null;
?> 