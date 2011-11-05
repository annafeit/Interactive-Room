<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt2 = $db->prepare("SELECT * from user where username==:username and online=='1' ");           
    $stmt2->bindParam(':username', $_POST['username']);        
    #execute statement
    $stmt2->execute();
    $result = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    print_r(json_encode($result));
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>