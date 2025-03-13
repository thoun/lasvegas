<?php
class Dice {
    public $id;
    public $value;
    public $placed;
    public $player_id;
    public $neutral;

    public function __construct($dbDice) {
        $this->id = intval($dbDice['dice_id']);
        $this->value = intval($dbDice['value']);
        $this->placed = boolval($dbDice['placed']);
        $this->player_id = intval($dbDice['player_id']);
        $this->neutral = boolval($dbDice['neutral']);
    } 
}

class Dices { // can be a count or an array of values, php doesn't care
    public $player;
    public $neutral;

    public function __construct($player, $neutral) {
        $this->player = $player;
        $this->neutral = $neutral;
    } 
}
?>
