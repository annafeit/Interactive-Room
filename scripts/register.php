<html>
<body>
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
        
  }
  catch(Exception $e){
    print 'Exception: '.$e->getMessage();
  }

  $db = null;
?> 
</body>
</html>