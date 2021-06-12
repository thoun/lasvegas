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
 * gameoptions.inc.php
 *
 * LasVegasThoun game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in lasvegasthoun.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

$condition = [
    1 => [],
    2 => [
        [
            'type' => 'maxplayers',
            'value' => 4,
            'message' => totranslate('Variant is limited to 4 players')
        ],
    ],
];

$game_options = [
    100 => [
        'name' => totranslate('Neutral player variant'),
        'values' => [
            1 => [
                'name' => totranslate('No'), 
                'description' => totranslate('Standard rules')
            ],
            2 => [
                'name' => totranslate('Yes'), 
                'description' => totranslate('Neutral player is added'), 
                'tmdisplay' => totranslate('Neutral player variant'),
                'nobeginner' => true 
            ],
        ],
        'displaycondition' => $condition,
        'startcondition' => $condition
    ],
];


