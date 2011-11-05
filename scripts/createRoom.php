<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    
    #insert in "room" table
    $stmt = $db->prepare("INSERT INTO room (id, mesh, preview, title, lastUpdate) VALUES (null, :mesh, :preview, :title, datetime('now'))");
    $stmt->bindParam(':mesh', $_REQUEST['mesh']);
    $stmt->bindParam(':preview', $_REQUEST['preview']);
    $stmt->bindParam(':title', $_REQUEST['title']);
    #execute statement
    $stmt->execute();
   
    #insert in "owns" table
    $stmt2 = $db->prepare("INSERT INTO owns (roomId, owner) VALUES ( (select max(id) from room where mesh == :mesh and preview == :preview and title == :title), :username)");           
    $stmt2->bindParam(':username', $_REQUEST['username']);  
    $stmt2->bindParam(':mesh', $_REQUEST['mesh']);
    $stmt2->bindParam(':preview', $_REQUEST['preview']);
    $stmt2->bindParam(':title', $_REQUEST['title']);  
    #execute statement
    $stmt2->execute();
    
    #get roomId
    $stmt3 = $db->prepare("select max(id) from room where mesh == :mesh and preview == :preview and title == :title");           
    $stmt3->bindParam(':mesh', $_REQUEST['mesh']);
    $stmt3->bindParam(':preview', $_REQUEST['preview']);
    $stmt3->bindParam(':title', $_REQUEST['title']);  
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