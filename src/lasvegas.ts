declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

class LasVegas implements Game {

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

        console.log( "Ending game setup" );
    } 

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        console.log( 'Entering state: '+stateName );

        switch( stateName )
        {

        /* Example:

        case 'myGameState':

            // Show some HTML block at this game state
            dojo.style( 'my_html_block_id', 'display', 'block' );

            break;
        */
        case 'playerTurn':
            if ( (this as any).isCurrentPlayerActive() )
            {
            }
            break;
        }
    }
    

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {

    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {

    } 
    

        ///////////////////////////////////////////////////
        //// Utility methods


       ///////////////////////////////////////////////////
       //// Player's action

       /*

           Here, you are defining methods to handle player's action (ex: results of mouse click on
           game objects).

           Most of the time, these methods:
           _ check the action is possible at this game state.
           _ make a call to the game server

       */


       ///////////////////////////////////////////////////
       //// Reaction to cometD notifications

       /*
           setupNotifications:

           In this method, you associate each of your game notifications with your local method to handle it.

           Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                 your pylos.game.php file.

       */
       setupNotifications()
       {
           console.log( 'notifications subscriptions setup' );

           // TODO: here, associate your game notifications with local methods

           // Example 1: standard notification handling
           // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );

           // Example 2: standard notification handling + tell the user interface to wait
           //            during 3 seconds after calling the method in order to let the players
           //            see what is happening in the game.
           dojo.subscribe( 'banknotesPlaced', this, "notif_banknotesPlaced" );
           (this as any).notifqueue.setSynchronous( 'banknotesPlaced', 3000 );
           //
           //(this as any).notifqueue.setSynchronous( 'finalScore', 1500 );
       }

       notif_banknotesPlaced(a, b) {
           console.log(a, b);
       }

       // TODO: from this point and below, you can write your game notifications handling methods

 }