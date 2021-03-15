<?php
define("APP_GAMEMODULE_PATH", "misc/"); // include path to stubs, which defines "table.game.php" and other classes
require_once ('lasvegasthoun.game.php');

class LasVegasTestGetDicesOnCasino extends LasVegasThoun { // this is your game class defined in ggg.game.php
    function __construct() {
        // parent::__construct();
        // include '../material.inc.php';// this is how this normally included, from constructor
    }

    // override/stub methods here that access db and stuff
    /*function getGameStateValue($var) {
        if ($var == 'round')
            return 3;
        return 0;
    }*/

    function getCollectionFromDb($sql, $single = false) {
        $result = [];
        if ($sql == "SELECT player_id, count(*) as diceNumber FROM dices WHERE `placed` = true and `neutral` = false and `value` = 5 GROUP BY player_id") {
            $result[20] = [
                'player_id' => 20,
                'diceNumber' => 3
            ];
            $result[21] = [
                'player_id' => 21,
                'diceNumber' => 2
            ];
            return $result;                
        }
        if ($sql == "SELECT 0 as player_id, count(*) as diceNumber FROM dices WHERE `placed` = true and `neutral` = true and `value` = 5") {
            $result[0] = [
                'player_id' => 0,
                'diceNumber' => 3
            ];
            return $result;                
        }
        throw new Error('sql mock not found');
    }

    // class tests
    function testDicesOnCasino() {
        $result = $this->getDicesOnCasino(5); // call one of the methods to test
        echo json_encode($result, JSON_PRETTY_PRINT);
        $equal = count($result) == 3;
        $equal = $equal && $result[0]->playerId == 20;
        $equal = $equal && $result[1]->playerId == 0;
        $equal = $equal && $result[2]->playerId == 21;
        $equal = $equal && $result[0]->diceNumber == 3;
        $equal = $equal && $result[1]->diceNumber == 3;
        $equal = $equal && $result[2]->diceNumber == 2;

        if ($equal)
            echo "Test1: PASSED\n";
        else
            echo "Test1: FAILED\n";
    }

    function testAll() {
        $this->testDicesOnCasino();
    }
}

$test = new LasVegasTestGetDicesOnCasino();
$test->testAll();