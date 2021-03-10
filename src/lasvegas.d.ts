/**
 * Your game interfaces
 */

interface Dices {
    player: number[];
    neutral: number[];
}
interface DicesCount {
    player: number;
    neutral: number;
}

interface Banknote {
    id: number;
    location: string;
    location_arg: number;
    value: number;
}
interface CasinoGamedatas {
    banknotes: Banknote[];
    dices: { [playerId: number]: DicesCount };
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
    variant: boolean;
    casinos: CasinoGamedatas[];
    firstPlayerId: number;
}

interface LasVegasGame extends Game {
    casinoSelected: (casino: number) => void;
}

interface EnteringPlayerTurnArgs {
    dices: Dices;
}

interface NotifNewTurnArgs {
    casinos: any;
    playerId: number;
    neutralDices: number[];
}

interface NotifDicesPlayedArgs {
    casino: number;
    playerId: number;
    remainingDices: DicesCount;
}

interface NotifRemoveDuplicatesArgs {
    casino: number;
    duplicatesValues: number[];
    playersId: number[];
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
    resetDicesNumber: number;
}