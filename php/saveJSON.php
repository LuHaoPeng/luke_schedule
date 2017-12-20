<?php
$data = $_POST['toStore'];
return file_put_contents('../data/luke_config.json', $data);
?>