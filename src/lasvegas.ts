declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

class Casino {
    public selectable: boolean = false;
    private stock: Stock;
    private banknotes: number[];

    constructor(private game: LasVegasGame, public casino: number, public gamedatas: CasinoGamedatas) {
        this.banknotes = gamedatas.banknotes;
    }

    addHtml() {
        dojo.place(
            `<div id="casino_wrapper${this.casino}" class="casino_wrapper">
                <div id="casino${this.casino}" class="casino"></div>
                <div id="banknotes${this.casino}" class="banknotes"></div>
            </div>`,
            'casinos');
        document.getElementById(`casino${this.casino}`).addEventListener('click', () => this.onSelection());

        this.stock = new ebg.stock();
        this.stock.create( this.game, $(`banknotes${this.casino}`), 350, 100 );
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for( var value=1; value<=9; value++ ) {
            this.stock.addItemType( value, 10 - value, g_gamethemeurl+'img/banknotes.png', value-1 );
        }
        this.banknotes.forEach((banknote, index) => this.stock.addToStockWithId( banknote, `${index*10 + banknote}`, 'topbar'));
    }

    setSelectable(selectable: boolean) {
        this.selectable = selectable;
        dojo.toggleClass(`casino${this.casino}`, 'selectable', selectable);
    }

    onSelection() {
        if (this.selectable) {
            this.game.casinoSelected(this.casino);
        }
    }
}

class LasVegas implements LasVegasGame {
    private gamedatas: LasVegasGamedatas;
    private casinos: Casino[] = [];

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
        
        console.log(gamedatas);
        this.gamedatas = gamedatas;

        for (let i=1; i<=6; i++) {
            const casino = new Casino(this, i, gamedatas.casinos[i]);
            this.casinos[i] = casino;
            casino.addHtml();

            Object.entries(gamedatas.casinos[i].dices).forEach(([playerId, dices]) => {
                const color = this.gamedatas.players[playerId].color;
                for (let j=0; j<dices; j++) {
                    dojo.place(this.createDiceHtml(i, color), `casino${i}`);
                }
            });
        }

        console.log( "Ending game setup" );
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
                if ((this as any).isCurrentPlayerActive() && args.dices.includes(i)) {
                    this.casinos[i].setSelectable(true);
                }
            }
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
        this.setTableDices();

        this.casinos.forEach(casino => casino.setSelectable(false));
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {

    } 
    

        ///////////////////////////////////////////////////
        //// Utility methods


       ///////////////////////////////////////////////////
    
        private takeAction(action: string, data?: any) {
            data = data || {};
            data.lock = true;
            (this as any).ajaxcall(`/lasvegasthoun/lasvegasthoun/${action}.html`, data, this, () => {});
        }

        private setTableDices(dices?: number[]) {
            const color = this.gamedatas.players[(this as any).getActivePlayerId()].color;
            $('dices-selector').innerHTML = '';
            dices?.forEach(dice => {
                dojo.place(this.createDiceHtml(dice, color), 'dices-selector');
            });
        }

        public casinoSelected(casino: number) {
            if(!(this as any).checkAction('chooseCasino')) {
                return;
            }

            Array.from(document.getElementById('dices-selector').getElementsByClassName( `dice${casino}`)).forEach((element: HTMLDivElement) => {
                element.style.zIndex = '10';
                const animation = (this as any).slideToObject( element, `casino${casino}` );
                dojo.connect(animation, 'onEnd', dojo.hitch(this, () => {
                    element.style.top = 'unset';
                    element.style.left = 'unset';
                    element.style.position = 'unset';
                    element.style.zIndex = 'unset';
                    document.getElementById(`casino${casino}`).appendChild(element);
                }));
                animation.play();
            });            

            this.takeAction("chooseCasino", {
                casino
            });
        }

        private createDiceHtml(number: number, color: string) {
            return `<div class="dice dice${number}"><div class="dice-overlay" style="background: #${color}"></div></div>`
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

            // TODO: here, associate your game notifications with local methods

            // Example 1: standard notification handling
            dojo.subscribe( 'newTurn', this, "notif_newTurn" );
            dojo.subscribe( 'dicesPlayed', this, "notif_dicesPlayed" );
            dojo.subscribe( 'removeDuplicates', this, "notif_removeDuplicates" );
            dojo.subscribe( 'collectBanknotes', this, "notif_collectBanknotes" );

            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            //dojo.subscribe( 'banknotesPlaced', this, "notif_banknotesPlaced" );
            //(this as any).notifqueue.setSynchronous( 'banknotesPlaced', 3000 );
            //
            //(this as any).notifqueue.setSynchronous( 'finalScore', 1500 );

            // TODO use asynchronous
        }

        notif_newTurn(a, b) {
            console.log(a, b);
        }

        notif_dicesPlayed(a, b) {
            console.log(a, b);
        }

        notif_removeDuplicates(a, b) {
            console.log(a, b);
        }

        notif_collectBanknotes(a, b) {
            console.log(a, b);
        }
 }