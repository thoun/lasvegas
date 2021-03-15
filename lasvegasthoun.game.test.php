<?php
define("APP_GAMEMODULE_PATH", "misc/"); // include path to stubs, which defines "table.game.php" and other classes
require_once ('lasvegasthoun.game.php');

class LasVegasTestGetDicesOnCasino extends LasVegasThoun { // this is your game class defined in ggg.game.php
    function __construct() {
        parent::__construct();
        include '../material.inc.php';// this is how this normally included, from constructor
    }

    // override/stub methods here that access db and stuff
    function getGameStateValue($var) {
        if ($var == 'round')
            return 3;
        return 0;
    }
}

$test = new LasVegasTestGetDicesOnCasino(); // instantiate your class
$result = $test->getDicesOnCasino(); // call one of the methods to test
if ($result != 50)
    echo "Test1: FAILED";
else
    echo "Test1: PASSED";

// cd C:\Dev\BGA\lasvegasthoun 
// php ./lasvegasthoun.game.test.php