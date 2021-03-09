/**
 * Your game interfaces
 */

 interface Banknote {
    id: number;
    location: string;
    location_arg: number;
    value: number;
}
interface CasinoGamedatas {
    banknotes: Banknote[];
    dices: { [playerId: number]: number };
}

interface LasVegasGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: Player };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    casinos: CasinoGamedatas[];
}

interface LasVegasGame extends Game {
    casinoSelected: (casino: number) => void;
}

interface EnteringPlayerTurnArgs {
    dices: number[];
}

interface NotifNewTurnArgs {
    casinos: any;
    playerId: number;
}

interface NotifDicesPlayedArgs {
    casino: number;
    playerId: number;
}

interface NotifRemoveDuplicatesArgs {
    duplicates: number[];
}

interface NotifCollectBanknoteArgs {
    casino: number;
    playerId: number;
    id: number;
    value: number;
}

interface NotifRemoveBanknoteArgs {
    casino: number;
    id: number;
}

interface NotifRemoveDicesArgs {
    casino: number;
}