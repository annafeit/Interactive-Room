
<?php
  try{
    #open Database and set error mode to normal exceptions
    $db = new PDO('sqlite:../DB/DBInteractiveRoom');  
    $db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    #prepare Statement
    $stmt = $db->prepare("INSERT INTO user (username, password) VALUES (:name, :pwd)");
    $stmt->bindParam(':name', $_POST['newUsername']);
    $stmt->bindParam(':pwd', $_POST['newPassword']);
    $stmt->execute();
        
    $stmt2 = $db->prepare("SELECT * FROM user WHERE username == :name ");           
    $stmt2->bindParam(':name', $_POST['newUsername']);    
    #execute statement
    $stmt2->execute();
    $result = $stmt2->fetchAll(PDO::FETCH_COLUMN, 0);
    print_r($result);

  }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }

  $db = null;
?> 