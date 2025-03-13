<?php
class BankNote {
    public $id;
    public $location;
    public $location_arg;
    public $value;

    public function __construct($dbBankNote) {
        $this->id = intval($dbBankNote['id']);
        $this->location = $dbBankNote['location'];
        $this->location_arg = intval($dbBankNote['location_arg']);
        $this->value = intval($dbBankNote['type']);
    } 
}
?>
