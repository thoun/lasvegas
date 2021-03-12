<?php
 /**
  *------
  * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
  * LasVegasThoun implementation : © <Your name here> <Your email address here>
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  * 
  * lasvegasthoun.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );
require_once("modules/banknote.php");
require_once("modules/dice.php");

class LasVegasThoun extends Table
{
	function __construct( )
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels( array( 
            "player_count" => 10,
            "round_number" => 11,
            "total_rounds" => 20,
            "variant" => 100
        ) );  
        
        $this->banknotes = self::getNew( "module.common.deck" );
        $this->banknotes->init( "banknotes" );
        $this->banknotes->autoreshuffle = true; // if deck is empty, auto re-fill from discard
	}
	
    protected function getGameName( )
    {
		// Used for translations and stuff. Please do not modify.
        return "lasvegasthoun";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = array() )
    {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = array();
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode( $values, ',' );
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/
        // Init global values with their initial values
        self::setGameStateInitialValue( 'player_count', count($players) );
        self::setGameStateInitialValue( 'total_rounds', 4 );
        self::setGameStateInitialValue( 'round_number', 0 );
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //self::initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //self::initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        // Create dices
        $sql = "INSERT INTO dices (`value`, `placed`, `player_id`, `neutral`) VALUES ";
        $values = array();
        foreach( $players as $player_id => $player ) {
            for ($i=0; $i<DICES_PER_PLAYER; $i++) {
                $values[] = "(0, false, $player_id, false)";
            }

            if ($this->isVariant()) {
                if ($this->getPlayerCount() == 2) {
                    // 2 players : 4 neutrals dices each
                    $neutralDices = 4;
                } else {
                    // 3/4 players : 2 neutrals dices each
                    $neutralDices = 2;
                    // 3 players : we add 2 dices to first player
                    if ($this->getPlayerCount() == 3 && intval(array_keys($players)[0]) == $player_id) {
                        $neutralDices = 4;
                    }
                }
                for ($i=0; $i<$neutralDices; $i++) {
                    $values[] = "(0, false, $player_id, true)";
                }
            }
        }
        $sql .= implode( $values, ',' );
        self::DbQuery( $sql );

        // Create banknotes
        $banknotes = array();
        foreach( $this->banknotesRepartition as $value => $number )  {
            $banknotes[] = array( 'type' => $value, 'type_arg' => null, 'nbr' => $number);
        }
        $this->banknotes->createCards( $banknotes, 'deck' );
        $this->banknotes->shuffle( 'deck' );

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas() {
        $result = array();
        $result['variant'] = $this->isVariant();
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score FROM player ORDER BY player_no ASC ";
        $result['players'] = self::getCollectionFromDb( $sql );

        foreach($result['players'] as $id => $player) {
            $result['players'][$id]['dices'] = new Dices(
                intval(self::getUniqueValueFromDB( "SELECT count(*) FROM dices WHERE `placed` = false and `neutral` = false and `player_id` = " . $player['id'] )),
                intval(self::getUniqueValueFromDB( "SELECT count(*) FROM dices WHERE `placed` = false and `neutral` = true and `player_id` = " . $player['id'] ))
            );
        }
  
        $playersDb = $result['players'];

        $result['firstPlayerId'] = intval(array_keys($playersDb)[min(self::getGameStateValue("round_number"), count($result['players']) - 1)]);

        $dices = $this->getDices(null, true);

		$result['casinos'] = [];
        for ($i=1; $i<=6; $i++) {
            $casino = new stdClass();

            $bankNotes = $this->getBankNotesFromDb($this->banknotes->getCardsInLocation( 'casino', $i ));
            $casino->banknotes = $bankNotes;

            $casinoDices = array();
            foreach( $playersDb as $player ) {
                $player_id = intval($player['id']);
                $casinoDices[$player_id] = new Dices(
                    count(array_filter($dices, function($dice) use ($player_id, $i) { return $dice->player_id == $player_id && $dice->neutral == false && $dice->value == $i; })),
                    count(array_filter($dices, function($dice) use ($player_id, $i) { return $dice->player_id == $player_id && $dice->neutral == true && $dice->value == $i; }))
                );
            }
            $casino->dices = $casinoDices;

            $result['casinos'][$i] = $casino;
        }
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
		$players_nbr = self::getGameStateValue("player_count");
		$total_rounds = self::getGameStateValue("total_rounds");
        $roundPercent = 100 / $total_rounds;

        $placedDices = intval(self::getUniqueValueFromDB("SELECT count(*) FROM dices INNER JOIN player ON dices.player_id = player.player_id WHERE `placed` = true and player_zombie = 0"));
        $neutralPlayers = $this->isVariant() ? 1 : 0;
        $totalDices = ($players_nbr + $neutralPlayers) * DICES_PER_PLAYER;

        self::debug('[GBA] other rounds percent : ' . $roundPercent * self::getGameStateValue('round_number') );
        self::debug('[GBA] current round percent : ' . ($placedDices * $roundPercent / $totalDices) );
        self::debug('[GBA] sum percent : ' . ($roundPercent * self::getGameStateValue('round_number')  + ($placedDices * $roundPercent / $totalDices)) );
        return $roundPercent * self::getGameStateValue('round_number')  + ($placedDices * $roundPercent / $totalDices);
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    /*
        In this space, you can put any utility methods useful for your game logic
    */

    function isVariant() {
        return self::getGameStateValue('variant') > 1;
    }

    function getPlayerCount() {
        return self::getGameStateValue('player_count');
    }

    function getBankNotesFromDb($dbBankNotes) {
        return array_map(function($dbBankNote) { return new BankNote($dbBankNote); }, array_values($dbBankNotes));
    }

    function getDices($player_id, $placed) {
        $sql = "SELECT `dice_id`, `value`, `placed`, `player_id`, `neutral` FROM dices WHERE ";
        if ($player_id) {
            $sql .= "player_id = $player_id AND ";
        }
        $sql .= "placed = ".json_encode($placed);
        $dbDices = self::getCollectionFromDB( $sql );
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }

    function getPlayerName($playerId) {
        return self::getUniqueValueFromDb( "SELECT player_name FROM player WHERE player_id = $playerId" );
    }

    function sendCollectNotifsForCasino($casino) {

        $dicesOnCasino = array_values($this->getDicesOnCasino($casino));

        $duplicatesValues = [];
        $duplicatesPlayersId = [];
        foreach($dicesOnCasino as $iDicesOnCasino) {
            
            if (count(array_values(array_filter($dicesOnCasino, function($elem) use ($iDicesOnCasino) { return $elem->diceNumber === $iDicesOnCasino->diceNumber; }))) > 1) {
                $duplicatesValues[] = $iDicesOnCasino->diceNumber;
                $duplicatesPlayersId[] = $iDicesOnCasino->playerId;
            }
        }
        $duplicatesValues = array_unique($duplicatesValues);

        if (count($duplicatesValues) > 0) {
            self::notifyAllPlayers('removeDuplicates', clienttranslate('Remove duplicates from casino ${casino}'), array(
                'casino' => $casino,
                'duplicatesValues' => $duplicatesValues,
                'playersId' => $duplicatesPlayersId
            ));

            foreach($duplicatesValues as $duplicatesValue) {
                $dicesOnCasino = array_values(array_filter($dicesOnCasino, function($elem) use ($duplicatesValue) { return $elem->diceNumber != $duplicatesValue; }));
            }
        }

        $banknotesOnCasino = $this->getBankNotesFromDb(array_reverse($this->banknotes->getCardsInLocation( 'casino', $casino, 'type' ))); // banknotes on casino, ordered DESC

        //self::dump('$dicesOnCasino '.$casino, $dicesOnCasino);
        //self::dump('$banknotesOnCasino '.$casino, $banknotesOnCasino);

        //self::debug("[GBA] casino=$casino countBanknotes=".count($banknotesOnCasino)." countDices=".count($dicesOnCasino));

        // give banknotes to players
        while (count($dicesOnCasino) > 0 && count($banknotesOnCasino) > 0) {
            $playerId = array_shift($dicesOnCasino)->playerId;
            $banknote = array_shift($banknotesOnCasino);
            $facialValue = $banknote->value * 10000;

            self::notifyAllPlayers('collectBanknote', clienttranslate('${player_name} wins ${value}0.000$ on casino ${casino}'), array(
                'casino' => $casino,
                'value' => $banknote->value,
                'id' => $banknote->id,
                'playerId' => $playerId,
                'player_name' => $playerId == 0 ? clienttranslate('Neutral player') : $this->getPlayerName($playerId)
            ));

            if ($playerId == 0) {
                $this->banknotes->moveCard($banknote->id, 'discard');
            } else {
                $this->banknotes->moveCard($banknote->id, 'player', $playerId);

                $sql = "UPDATE player SET player_score = player_score + " . $banknote->value . ", player_score_aux = player_score_aux + 1 WHERE player_id='$playerId'";
                self::DbQuery($sql);
            }
        }

        // remove remaining banknotes
        while (count($banknotesOnCasino) > 0) {
            $banknote = array_shift($banknotesOnCasino);

            self::notifyAllPlayers('removeBanknote', clienttranslate('Nobody wins ${value}0.000$ on casino ${casino}'), array(
                'casino' => $casino,
                'value' => $banknote->value,
                'id' => $banknote->id,
            ));

            $this->banknotes->moveCard($banknote->id, 'discard');
        }
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in lasvegasthoun.action.php)
    */

    function chooseCasino( $casino ) {
        $player_id = intval(self::getActivePlayerId());
        self::DbQuery( "UPDATE dices SET `placed` = true WHERE `value` = $casino AND `player_id` = $player_id" );
        self::DbQuery( "UPDATE dices SET `value` = 0 WHERE `placed` = false AND `player_id` = $player_id" );

        // notify dice played to players
        self::notifyAllPlayers('dicesPlayed', clienttranslate('${player_name} placed diced to casino ${casino}'), array(
            'casino' => intval($casino),
            'playerId' => $player_id,
            'player_name' => self::getActivePlayerName(),
            'remainingDices' => new Dices(
                intval(self::getUniqueValueFromDB( "SELECT count(*) FROM dices WHERE `placed` = false and `neutral` = false and `player_id` = ".$player_id )),
                intval(self::getUniqueValueFromDB( "SELECT count(*) FROM dices WHERE `placed` = false and `neutral` = true and `player_id` = ".$player_id ))
            )
        ));

        $this->gamestate->nextState('chooseCasino');
    }

    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
    
    function argPlayerTurn() {
        $player_id = self::getActivePlayerId();
        $dices = $this->getDices($player_id, false);

        foreach ($dices as &$dice){
            if ($dice->value == 0) {
                $dice->value = bga_rand( 1, 6 );
                self::DbQuery( "UPDATE dices SET `value`=".$dice->value." where `dice_id`=".$dice->id );
            }
        }

        $dicesPlayerValues = array_map(function($dice) { return $dice->value; }, array_values(array_filter($dices, function($dice) { return $dice->neutral == false; })));
        $dicesNeutralValues = array_map(function($dice) { return $dice->value; }, array_values(array_filter($dices, function($dice) { return $dice->neutral == true; })));
    
        // return values:
        return array(
            'dices' => new Dices($dicesPlayerValues, $dicesNeutralValues)
        );
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stPlaceBills() {
        // set first player
        $players = $this->loadPlayersBasicInfos();
        $firstPlayerId = intval(array_keys($players)[min(self::getGameStateValue("round_number"), count($players) - 1)]);
        $this->gamestate->changeActivePlayer( $firstPlayerId );

        // reset dices
        self::DbQuery( "UPDATE dices SET `placed` = false, `value` = 0" );

        $neutralDices = array();
        if ($this->isVariant() && $this->getPlayerCount() == 3) {
            $playerWithAdditionalDices = intval(array_keys($players)[0]);
            
            $sql = "SELECT dice_id FROM dices WHERE player_id = $playerWithAdditionalDices and `neutral` = true LIMIT 2";
            $neutralDicesDb = self::getCollectionFromDb( $sql );

            foreach ($neutralDicesDb as $neutralDiceDb) {
                $id = intval($neutralDiceDb['dice_id']);
                $value = bga_rand( 1, 6 );
                $neutralDices[] = $value;
                self::DbQuery( "UPDATE dices SET `placed` = true, `value` = $value WHERE `dice_id` = $id" );
            }
        }

        $casinos = [];

        // place bills on table
        for ($i=1; $i<=6; $i++) {
            $casinoValue = 0;
            while ($casinoValue < 5) {
                $bankNote = new BankNote($this->banknotes->pickCardForLocation( 'deck', 'casino', $i ));

                $casinoValue += $bankNote->value;

                $casinos[$i][] = $bankNote;
            }            
        }

        self::notifyAllPlayers('newTurn', clienttranslate('${player_name} is the first player'), array(
            'casinos' => $casinos,
            'playerId' => $firstPlayerId,
            'player_name' => $this->getPlayerName($firstPlayerId),
            'neutralDices' => $neutralDices
        ));
        
        // go to player turn
        $this->gamestate->nextState( '' );
    }

    function stNextPlayer() {
        $player_id = self::activeNextPlayer();
        self::giveExtraTime($player_id);

        //self::debug('[GBA] $player_id='.$player_id.' active player_id='.self::getActivePlayerId());
        //self::dump('[GBA] players', $this->loadPlayersBasicInfos());

        $sql = "SELECT count(*) FROM dices INNER JOIN player ON dices.player_id = player.player_id WHERE `placed` = false and player_zombie = 0";
        $dicesToPlace = intval(self::getUniqueValueFromDB( $sql ));
        //self::debug('[GBA] $dicesToPlace='.$dicesToPlace);

        if ($dicesToPlace == 0) {
            $this->gamestate->nextState('collectBills');
        } else {
            $protection = 0;
            $dicesToPlaceForPlayer = 0;
            while ($dicesToPlaceForPlayer == 0
            && $protection < 10 // infinite loop protection
            ) {
                $sql = "SELECT count(*) FROM dices INNER JOIN player ON dices.player_id = player.player_id WHERE `placed` = false and player_zombie = 0 and dices.`player_id` = ".self::getActivePlayerId();
                $dicesToPlaceForPlayer = intval(self::getUniqueValueFromDB( $sql ));
                // if player has no dice we skip to next player
                //self::debug('[GBA] goes on the loop');
                if ($dicesToPlaceForPlayer == 0) {
                    //self::debug('[GBA] $endForPlayer true');
                    self::activeNextPlayer();
                }
                $protection++;
            }


            $this->gamestate->nextState('nextPlayer');
        }
    }

    function getDicesOnCasino($casino)  {
        $sql = "SELECT player_id, count(*) as diceNumber FROM dices WHERE `placed` = true and `neutral` = false and `value` = $casino GROUP BY player_id";
        $playerdicesOnCasinoDb = self::getCollectionFromDb( $sql );
        $sql = "SELECT 0 as player_id, count(*) as diceNumber FROM dices WHERE `placed` = true and `neutral` = true and `value` = $casino";
        $neutraldicesOnCasinoDb = self::getCollectionFromDb( $sql );

        $dicesOnCasinoDb = intval($neutraldicesOnCasinoDb[0]['player_id']) > 0 ? 
            array_merge($playerdicesOnCasinoDb, $neutraldicesOnCasinoDb) : 
            $playerdicesOnCasinoDb;
        
        $dicesOnCasino = array_map(function($dicesOnCasino) { 
            $result = new stdClass();
            $result->playerId = intval($dicesOnCasino['player_id']);
            $result->diceNumber = intval($dicesOnCasino['diceNumber']);
            return $result;
        }, $dicesOnCasinoDb);

        usort($dicesOnCasino, function($a, $b) { return $b->diceNumber - $a->diceNumber; });

        return $dicesOnCasino;
    }

    function stCollectBills() {
        $round_number = self::getGameStateValue("round_number") + 1;
        $endGame = $round_number == self::getGameStateValue("total_rounds");
        if (!$endGame) {
            self::setGameStateValue("round_number", $round_number);
        }

        for ($i = 1; $i <= 6; $i++) {
            $this->sendCollectNotifsForCasino($i);
        }
        $neutralDices = 0;
        if ($this->isVariant()) {
            $neutralDices = $this->getPlayerCount() == 2 ? 4 : 2;
        }
        self::notifyAllPlayers('removeDices', clienttranslate('Remaining dices are removed from casinos'), array(
            'resetDicesNumber' => new Dices(
                DICES_PER_PLAYER,
                $neutralDices
            )
        ));

        $this->gamestate->nextState($endGame ? 'endGame' : 'placeBills' );
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player ) {
    	$this->gamestate->nextState("chooseCasino");
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb( $from_version ) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
