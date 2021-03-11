declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const END_TURN_ANIMATIONS_DURATION = 1000;

const COLORS = [
    'ffffff',
    '000000',
    'ff0000',
    '008000',
    '0000ff',
    'ffa500',
    'e94190',
    '982fff',
    '72c3b1',
    'f07f16',
    'bdd002',
    '7b7b7b'
];

class LasVegas implements LasVegasGame {
    private gamedatas: LasVegasGamedatas;
    private casinos: Casino[] = [];
    private dicesCounters: Counter[] = [];
    private dicesCountersNeutral: Counter[] = [];
    private neutralColor: string;

    constructor() {
    }
    
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */

    public setup(gamedatas: LasVegasGamedatas) {
        
        console.log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        this.neutralColor = COLORS.find(color => !Object.values(this.gamedatas.players).some(player => player.color === color));

        Object.values(this.gamedatas.players).forEach(player => {
            let html = `<div class="dice-counters">${this.createDiceHtml(5, player.id, player.color)} <span id="dice-counter-${player.id}"></span>`;
            if (this.isVariant()) {
                html += `${this.createDiceHtml(5, player.id, this.neutralColor)} <span id="dice-counter-${player.id}-neutral"></span>`;
            }
            html += `</div>`;

            dojo.place(html, `player_board_${player.id}` );

            const dices: DicesCount = (player as any).dices;
            const counter = new ebg.counter();
            counter.create(`dice-counter-${player.id}`);
            counter.setValue(dices.player);
            this.dicesCounters[player.id] = counter;

            if (this.isVariant()) {
                const counter = new ebg.counter();
                counter.create(`dice-counter-${player.id}-neutral`);
                counter.setValue(dices.neutral);
                this.dicesCountersNeutral[player.id] = counter;
            }
        });

        for (let i=1; i<=6; i++) {
            const casino = new Casino(this, i, gamedatas.casinos[i]);
            this.casinos[i] = casino;
            casino.addHtml();

            Object.entries(gamedatas.casinos[i].dices).forEach(([playerId, dices]) => {
                const color = this.gamedatas.players[playerId].color;
                for (let j=0; j<dices.player; j++) {                    
                    this.casinos[i].addSpaceForPlayer(Number(playerId));
                    dojo.place(this.createDiceHtml(i, playerId, color),this.casinos[i].getPlayerSpaceId(Number(playerId)));
                }
            });

            Object.values(gamedatas.casinos[i].dices).forEach(dices => {
                for (let j=0; j<dices.neutral; j++) {
                    this.casinos[i].addSpaceForPlayer(0);
                    dojo.place(this.createDiceHtml(i, 0, this.neutralColor), this.casinos[i].getPlayerSpaceId(0));
                }
            });
        }

        this.placeFirstPlayerToken(this.gamedatas.firstPlayerId);

        document.getElementById('dices-selector').addEventListener('click', event => this.diceSelectorClick(event));

        this.setupNotifications();

        console.log( "Ending game setup" );

        //colors.forEach(color => dojo.place(this.createDiceHtml(5, color), `dices-test`));
    } 

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        console.log( 'Entering state: '+stateName );

        switch( stateName ) {
            case 'playerTurn':
                this.onEnteringPlayerTurn(args.args);
                break;
        }
    }

    onEnteringPlayerTurn(args: EnteringPlayerTurnArgs) {
        this.setTableDices(args.dices);

        if ((this as any).isCurrentPlayerActive()) {
            for (let i=1; i<=6; i++) {
                if ((this as any).isCurrentPlayerActive() && (args.dices.player.includes(i) || args.dices.neutral.includes(i))) {
                    this.casinos[i].setSelectable(true);
                }
            }
            dojo.addClass('dices-selector', 'selectable');
        }
    }
    

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {
        switch( stateName ) {
            case 'playerTurn':
                this.onLeavingPlayerTurn();
                break;
        }
    }

    onLeavingPlayerTurn() {
        this.casinos.forEach(casino => casino.setSelectable(false));
        dojo.removeClass('dices-selector', 'selectable');
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {

    } 
    

        ///////////////////////////////////////////////////
        //// Utility methods


       ///////////////////////////////////////////////////

       private isVariant() {
           return this.gamedatas.variant;
       }
    
        private takeAction(action: string, data?: any) {
            data = data || {};
            data.lock = true;
            (this as any).ajaxcall(`/lasvegasthoun/lasvegasthoun/${action}.html`, data, this, () => {});
        }

        private setTableDices(dices: Dices) {
            const playerId = (this as any).getActivePlayerId();
            const color = this.gamedatas.players[playerId].color;
            $('dices-selector').innerHTML = '';
            for (let i=1; i<=6; i++) {
                dices.player.filter(dice => dice == i).forEach(dice => {
                    dojo.place(this.createDiceHtml(dice, playerId, color), 'dices-selector');
                });
                dices.neutral.filter(dice => dice == i).forEach(dice => {
                    dojo.place(this.createDiceHtml(dice, 0, this.neutralColor), 'dices-selector');
                });
            }
        }

        public casinoSelected(casino: number) {
            if(!(this as any).checkAction('chooseCasino')) {
                return;
            }          

            this.moveDicesToCasino(casino, (this as any).getActivePlayerId());

            this.takeAction("chooseCasino", {
                casino
            });
        }

        private createDiceHtml(number: number | string, playerId: number | string, color: string) {
            const blackDot = [parseInt(color.substr(0, 2), 16), parseInt(color.substr(2, 2), 16), parseInt(color.substr(4, 2), 16)].reduce((a, b) => a+b) > 460;
            return `<div class="dice dice${number} ${blackDot ? 'black-dot' : 'white-dot'}" style="background-color: #${color}; border-color: #${color};" data-player-id="${playerId}"></div>`;
        }

        private moveDicesToCasino(casino: number, playerId_: number) {
            const dicesElement = Array.from(document.getElementById('dices-selector').getElementsByClassName( `dice${casino}`));

            new Set(dicesElement.map((element: HTMLDivElement) => Number(element.dataset.playerId))).forEach(playerId => 
                this.casinos[casino].addSpaceForPlayer(playerId)    
            );

            dicesElement.forEach((element: HTMLDivElement) => {
                element.style.zIndex = '10';
                const playerId = Number(element.dataset.playerId);
                const animation = (this as any).slideToObject( element, this.casinos[casino].getPlayerSpaceId(playerId) );
                dojo.connect(animation, 'onEnd', dojo.hitch(this, () => {
                    element.style.top = 'unset';
                    element.style.left = 'unset';
                    element.style.position = 'unset';
                    element.style.zIndex = 'unset';
                    document.getElementById(this.casinos[casino].getPlayerSpaceId(playerId)).appendChild(element);
                }));
                animation.play();
            });  

            Array.from(document.getElementById('dices-selector').getElementsByClassName( `dice`)).filter(element => !element.classList.contains(`dice${casino}`)).forEach((element: HTMLDivElement) => {
                //(this as any).slideToObjectAndDestroy(element, `overall_player_board_${playerId}`);
                (this as any).fadeOutAndDestroy(element);
            });
        }

        private diceSelectorClick(event: MouseEvent) {
            const numberMatch = (event.target as HTMLDivElement)?.classList?.value?.match(/\d/);
            if (numberMatch) {
                const number = parseInt(numberMatch[0]);
                this.casinos[number].onSelection();
            }
        }

        placeFirstPlayerToken(playerId: number) {
            const firstPlayerToken = document.getElementById('firstPlayerToken');
            if (firstPlayerToken) {
                const animation = (this as any).slideToObject( firstPlayerToken, `player_board_${playerId}` );
                dojo.connect(animation, 'onEnd', dojo.hitch(this, () => {
                    firstPlayerToken.style.top = 'unset';
                    firstPlayerToken.style.left = 'unset';
                    firstPlayerToken.style.position = 'unset';
                    firstPlayerToken.style.zIndex = 'unset';
                    document.getElementById(`player_board_${playerId}`).appendChild(firstPlayerToken);
                }));
                animation.play();
            } else {
                dojo.place( '<div id="firstPlayerToken"></div>', `player_board_${playerId}` );
            }
        }


       ///////////////////////////////////////////////////
       //// Reaction to cometD notifications

       /*
           setupNotifications:

           In this method, you associate each of your game notifications with your local method to handle it.

           Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                 your pylos.game.php file.

       */
        setupNotifications() {
            console.log( 'notifications subscriptions setup' );

            const notifs = [
                ['newTurn', 1],
                ['dicesPlayed', 1],
                ['removeDuplicates', END_TURN_ANIMATIONS_DURATION],
                ['collectBanknote', END_TURN_ANIMATIONS_DURATION],
                ['removeBanknote', END_TURN_ANIMATIONS_DURATION],
                ['removeDices', END_TURN_ANIMATIONS_DURATION],
            ];
        
            notifs.forEach((notif) => {
                dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
                (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
            });
        }

        notif_newTurn(notif: Notif<NotifNewTurnArgs>) {
            this.placeFirstPlayerToken(notif.args.playerId);
            this.casinos.forEach(casino => casino.setNewBanknotes(notif.args.casinos[casino.casino]));

            notif.args.neutralDices.forEach(neutralDice => {
                this.casinos[neutralDice].addSpaceForPlayer(0);
                dojo.place(this.createDiceHtml(neutralDice, 0, this.neutralColor), this.casinos[neutralDice].getPlayerSpaceId(0));
            });
        }

        notif_dicesPlayed(notif: Notif<NotifDicesPlayedArgs>) {
            this.moveDicesToCasino(notif.args.casino, notif.args.playerId);
            this.dicesCounters[notif.args.playerId].toValue(notif.args.remainingDices.player);
            if (this.isVariant()) {                
                this.dicesCountersNeutral[notif.args.playerId].toValue(notif.args.remainingDices.neutral);
            }
        }

        notif_removeDuplicates(notif: Notif<NotifRemoveDuplicatesArgs>) {
            notif.args.playersId.forEach(playerId => this.casinos[notif.args.casino].removeDices(playerId));
        }

        notif_collectBanknote(notif: Notif<NotifCollectBanknoteArgs>) {
            this.casinos[notif.args.casino].slideBanknoteTo(notif.args.id, notif.args.playerId);
            const points = notif.args.value * 10000;
            (this as any).scoreCtrl[notif.args.playerId].incValue(points);

            (this as any).displayScoring( `banknotes${notif.args.casino}`, this.gamedatas.players[notif.args.playerId].color, points, END_TURN_ANIMATIONS_DURATION);
            this.casinos[notif.args.casino].removeDices(notif.args.playerId);
        }

        notif_removeBanknote(notif: Notif<NotifRemoveBanknoteArgs>) {
            this.casinos[notif.args.casino].removeBanknote(notif.args.id);
        }

        notif_removeDices(notif: Notif<NotifRemoveDicesArgs>) {
            this.casinos.forEach(casino => casino.removeDices());
            this.dicesCounters.forEach(dicesCounter => dicesCounter.setValue(notif.args.resetDicesNumber.player));
            if (this.isVariant()) {
                this.dicesCountersNeutral.forEach(dicesCounter => dicesCounter.setValue(notif.args.resetDicesNumber.neutral));
            }
        }

}