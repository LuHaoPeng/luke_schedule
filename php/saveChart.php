<?php
$data = $_POST['toStore'];
return file_put_contents('../data/chart.txt', $data);
?>