<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt = $db->prepare("SELECT * FROM user WHERE password == :password AND username == :username");     
    $stmt->bindParam(':username', $_POST['username']);    
    $stmt->bindParam(':password', $_POST['password']);    
    #execute statement
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    print_r(json_encode($result));         
    }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }
  #close database
  $db = null;
?>