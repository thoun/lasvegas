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
 * material.inc.php
 *
 * LasVegasThoun game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */


/*
54 banknotes (5 each of $60,000, $70,000, $80,000 and $90,000; 6 each of $10,000, $40,000 and $50,000; 8 each of $20,000 and $30,000)

key is facial value / 10.000, value is number of each
*/
$this->banknotesRepartition = array(
    6 => 5,
    7 => 5,
    8 => 5,
    9 => 5,
    1 => 6,
    4 => 6,
    5 => 6,
    2 => 8,
    3 => 8,
);




