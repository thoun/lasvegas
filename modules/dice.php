<?php
class Dice {
    public $id;
    public $value;
    public $placed;
    public $player_id;

    public function __construct($dbDice) {
        $this->id = intval($dbDice['dice_id']);
        $this->value = intval($dbDice['value']);
        $this->placed = boolval($dbDice['placed']);
        $this->player_id = intval($dbDice['player_id']);
    } 
}
?>
