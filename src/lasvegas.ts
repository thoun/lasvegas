declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const END_TURN_ANIMATIONS_DURATION = 1000;

const COLORS = [
    '000000',
    'ffffff',
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
    private diceAnimations: any[] = [];

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
        
        //console.log( "Starting game setup" );
        
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

            const suffix = document.createElement("span");
            suffix.id = `player_score_suffix_${player.id}`;
            suffix.style.marginLeft = '-4px';
            const playerScore = document.getElementById(`player_board_${player.id}`).getElementsByTagName('div')[0];
            playerScore.insertBefore(suffix, playerScore.getElementsByTagName('i')[0]);
        });

        setTimeout(() => {
            Object.values(this.gamedatas.players).forEach(player => {
                this.setScoreSuffix(Number(player.id));
            });
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
                this.casinos[i].reorderDices();
            });

            Object.values(gamedatas.casinos[i].dices).forEach(dices => {
                for (let j=0; j<dices.neutral; j++) {
                    this.casinos[i].addSpaceForPlayer(0);
                    dojo.place(this.createDiceHtml(i, 0, this.neutralColor), this.casinos[i].getPlayerSpaceId(0));
                }
                this.casinos[i].reorderDices();
            });
        }

        this.updateTurnNumber(this.gamedatas.roundNumber);
        this.placeFirstPlayerToken(this.gamedatas.firstPlayerId);

        document.getElementById('dices-selector').addEventListener('click', event => this.diceSelectorClick(event));

        this.setupNotifications();

        //console.log( "Ending game setup" );

        // COLORS.forEach(color => dojo.place(this.createDiceHtml(5, null, color), `dices-test`));
    } 

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        //console.log( 'Entering state: '+stateName );

        switch( stateName ) {
            case 'playerTurn':
                const someDiceAnimation = this.diceAnimations[0] ?? this.diceAnimations[1];
                if (someDiceAnimation) {
                    dojo.connect(someDiceAnimation, 'onEnd', dojo.hitch(this, () => this.onEnteringPlayerTurn(args.args)));
                } else {
                    this.onEnteringPlayerTurn(args.args);
                }
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

       private setScoreSuffix(playerId: number) {
           document.getElementById(`player_score_suffix_${playerId}`).innerHTML = (this as any).scoreCtrl[playerId].getValue() ? '0.000$' : '$';
       }

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
                this.casinos[i].reorderDices();
            }
            Array.from($('dices-selector').getElementsByClassName('dice')).forEach((dice: HTMLDivElement) => {
                dice.classList.add('rolled');
                setTimeout(() => {
                    dice.getElementsByClassName('die-list')[0].classList.add(Math.random() < 0.5 ? 'odd-roll' : 'even-roll');
                }, 100); 
            });
        }

        public casinoSelected(casino: number) {
            if(!(this as any).checkAction('chooseCasino')) {
                return;
            }          

            // this.moveDicesToCasino(casino, (this as any).getActivePlayerId());

            this.takeAction("chooseCasino", {
                casino
            });
        }

        private createDiceHtml(number: number | string, playerId: number | string, color: string) {
            const blackDot = [parseInt(color.substr(0, 2), 16), parseInt(color.substr(2, 2), 16), parseInt(color.substr(4, 2), 16)].reduce((a, b) => a+b) > 460;
            //return `<div class="dice dice${number} ${blackDot ? 'black-dot' : 'white-dot'}" style="background-color: #${color}; border-color: #${color};" data-player-id="${playerId}"></div>`;
            let html = `<div class="dice dice${number}" data-player-id="${playerId}">
            <ol class="die-list" data-roll="${number}">`;
            for (let die=1; die<=6; die++) {
                html += `<li class="die-item" data-side="${die}" style="background-color: #${color}; border-color: #${color};">`;
                for (let i=1; i<=die; i++) {
                    html += `<span class="dot ${blackDot ? 'black-dot' : 'white-dot'}"></span>`;
                }
                html += `</li>`;
            }
            html += `</ol></div>`;
            return html;
        }

        private moveDicesToCasino(casino: number, playerId_: number) {
            const dicesSelector = document.getElementById('dices-selector');
            const dicesElement = Array.from(dicesSelector.getElementsByClassName( `dice${casino}`));

            const playersIds = new Set(dicesElement.map((element: HTMLDivElement) => Number(element.dataset.playerId)));
            playersIds.forEach(playerId => this.casinos[casino].addSpaceForPlayer(playerId));

            Array.from(playersIds.keys()).forEach(playerId => {
                // we put animated dices on a temp span
                const dicesSpan = document.createElement("span");
                dicesSpan.style.zIndex = '10';
                dicesSpan.style.position = 'relative';
                dicesSelector.insertBefore(dicesSpan, dicesElement.filter((element: HTMLDivElement) => Number(element.dataset.playerId) == playerId)[0]); 
                dicesElement.filter((element: HTMLDivElement) => Number(element.dataset.playerId) == playerId).forEach(element => dicesSpan.appendChild(element));
                
                this.diceAnimations[playerId ? 1 : 0] = (this as any).slideToObject( dicesSpan, this.casinos[casino].getPlayerSpaceId(playerId) );
                dojo.connect(this.diceAnimations[playerId ? 1 : 0], 'onEnd', dojo.hitch(this, () => {
                    Array.from(dicesSpan.children).forEach(dice => document.getElementById(this.casinos[casino].getPlayerSpaceId(playerId)).appendChild(dice));
                    delete this.diceAnimations[playerId ? 1 : 0];
                    this.casinos[casino].reorderDices();
                }));
                this.diceAnimations[playerId ? 1 : 0].play();
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

        private updateTurnNumber(turnNumber: number) {            
            document.getElementById('hand-counter').innerHTML = `${turnNumber} / 4`;
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
            //console.log( 'notifications subscriptions setup' );

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
            this.updateTurnNumber(notif.args.roundNumber);
            this.placeFirstPlayerToken(notif.args.playerId);
            this.casinos.forEach(casino => casino.setNewBanknotes(notif.args.casinos[casino.casino]));

            notif.args.neutralDices.forEach(neutralDice => {
                this.casinos[neutralDice].addSpaceForPlayer(0);
                dojo.place(this.createDiceHtml(neutralDice, 0, this.neutralColor), this.casinos[neutralDice].getPlayerSpaceId(0));
                this.casinos[neutralDice].reorderDices();
            });
        }

        notif_dicesPlayed(notif: Notif<NotifDicesPlayedArgs>) {

            Array.from($('dices-selector').getElementsByClassName('dice')).forEach((dice: HTMLDivElement) => {
                dice.classList.remove('rolled');              
            });

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
            if (notif.args.playerId) {
                this.casinos[notif.args.casino].slideBanknoteTo(notif.args.id, notif.args.playerId);
                const points = notif.args.value;
                (this as any).scoreCtrl[notif.args.playerId].incValue(points);
                this.setScoreSuffix(notif.args.playerId);

                (this as any).displayScoring( `banknotes${notif.args.casino}`, this.gamedatas.players[notif.args.playerId].color, points*10000, END_TURN_ANIMATIONS_DURATION);
            } else {
                this.casinos[notif.args.casino].removeBanknote(notif.args.id);
            }
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

    private formatDicesLog(playedDices: DicesCount, casino: number, playerColor: string) {
        let str = '';
        if (playedDices.player) {
            str += `<span class="log-dice-counters">${playedDices.player} ${this.createDiceHtml(casino, 0, playerColor)}</span>`;
        }
        if (playedDices.neutral) {
            str += `<span class="log-dice-counters">${playedDices.neutral} ${this.createDiceHtml(casino, 0, this.neutralColor)}</span>`;
        }
        return str;
    }
    
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (args.playedDices_rec && typeof args.playedDices_rec !== 'string') {
                    const playedDices: DicesCount | string = args.playedDices_rec?.args?.playedDices ?? args.playedDices;
                    const casino: number = args.playedDices_rec?.args?.casino ?? args.casino;
                    const playerColor: string = args.playedDices_rec?.args?.playerColor ?? args.playerColor;
                    args.playedDices_rec = this.formatDicesLog(playedDices as DicesCount, casino, playerColor);
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}