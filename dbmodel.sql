
-- ------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- LasVegas implementation : © thoun <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

CREATE TABLE IF NOT EXISTS `dices` (
  `value` TINYINT(1) unsigned NOT NULL,
  `placed` TINYINT(1) unsigned NOT NULL DEFAULT false,
  `player_id` INT(10) unsigned NOT NULL,
  PRIMARY KEY (`player_id`, `value`)
) ENGINE=InnoDB;

-- we use deck, as banknotes is similar to card
-- card_type : value / 10.000 (1..9)
-- card_type_arg : ignored
-- card_location : deck / casino / player
-- card_location_arg : casino number (1..6) or player id

CREATE TABLE IF NOT EXISTS `banknotes` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` tinyint(1) unsigned NOT NULL,
  `card_type_arg` tinyint(1) unsigned NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` INT(10) unsigned NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB;
