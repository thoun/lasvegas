var Casino = /** @class */ (function () {
    function Casino(game, casino, gamedatas) {
        this.game = game;
        this.casino = casino;
        this.gamedatas = gamedatas;
        this.selectable = false;
        this.banknotes = gamedatas.banknotes;
    }
    Casino.prototype.addHtml = function () {
        var _this = this;
        dojo.place("<div id=\"casino_wrapper" + this.casino + "\" class=\"casino_wrapper\">\n                <div id=\"casino" + this.casino + "\" class=\"casino\"></div>\n                <div id=\"banknotes" + this.casino + "\" class=\"banknotes\"></div>\n            </div>", 'casinos');
        document.getElementById("casino" + this.casino).addEventListener('click', function () { return _this.onSelection(); });
        this.stock = new ebg.stock();
        this.stock.create(this.game, $("banknotes" + this.casino), 350, 100);
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for (var value = 1; value <= 9; value++) {
            this.stock.addItemType(value, 10 - value, g_gamethemeurl + 'img/banknotes.png', value - 1);
        }
        this.banknotes.forEach(function (banknote, index) { return _this.stock.addToStockWithId(banknote, "" + (index * 10 + banknote), 'topbar'); });
    };
    Casino.prototype.setSelectable = function (selectable) {
        this.selectable = selectable;
        dojo.toggleClass("casino" + this.casino, 'selectable', selectable);
    };
    Casino.prototype.onSelection = function () {
        if (this.selectable) {
            this.game.casinoSelected(this.casino);
        }
    };
    return Casino;
}());
var LasVegas = /** @class */ (function () {
    function LasVegas() {
        this.casinos = [];
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
    LasVegas.prototype.setup = function (gamedatas) {
        var _this = this;
        console.log("Starting game setup");
        console.log(gamedatas);
        this.gamedatas = gamedatas;
        var _loop_1 = function (i) {
            var casino = new Casino(this_1, i, gamedatas.casinos[i]);
            this_1.casinos[i] = casino;
            casino.addHtml();
            Object.entries(gamedatas.casinos[i].dices).forEach(function (_a) {
                var playerId = _a[0], dices = _a[1];
                var color = _this.gamedatas.players[playerId].color;
                for (var j = 0; j < dices; j++) {
                    dojo.place(_this.createDiceHtml(i, color), "casino" + i);
                }
            });
        };
        var this_1 = this;
        for (var i = 1; i <= 6; i++) {
            _loop_1(i);
        }
        console.log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    LasVegas.prototype.onEnteringState = function (stateName, args) {
        console.log('Entering state: ' + stateName);
        switch (stateName) {
            case 'playerTurn':
                this.onEnteringPlayerTurn(args.args);
                break;
        }
    };
    LasVegas.prototype.onEnteringPlayerTurn = function (args) {
        this.setTableDices(args.dices);
        if (this.isCurrentPlayerActive()) {
            for (var i = 1; i <= 6; i++) {
                if (this.isCurrentPlayerActive() && args.dices.includes(i)) {
                    this.casinos[i].setSelectable(true);
                }
            }
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    LasVegas.prototype.onLeavingState = function (stateName) {
        switch (stateName) {
            case 'playerTurn':
                this.onLeavingPlayerTurn();
                break;
        }
    };
    LasVegas.prototype.onLeavingPlayerTurn = function () {
        this.setTableDices();
        this.casinos.forEach(function (casino) { return casino.setSelectable(false); });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    LasVegas.prototype.onUpdateActionButtons = function (stateName, args) {
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    LasVegas.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/lasvegasthoun/lasvegasthoun/" + action + ".html", data, this, function () { });
    };
    LasVegas.prototype.setTableDices = function (dices) {
        var _this = this;
        var color = this.gamedatas.players[this.getActivePlayerId()].color;
        $('dices-selector').innerHTML = '';
        dices === null || dices === void 0 ? void 0 : dices.forEach(function (dice) {
            dojo.place(_this.createDiceHtml(dice, color), 'dices-selector');
        });
    };
    LasVegas.prototype.casinoSelected = function (casino) {
        var _this = this;
        if (!this.checkAction('chooseCasino')) {
            return;
        }
        Array.from(document.getElementById('dices-selector').getElementsByClassName("dice" + casino)).forEach(function (element) {
            element.style.zIndex = '10';
            var animation = _this.slideToObject(element, "casino" + casino);
            dojo.connect(animation, 'onEnd', dojo.hitch(_this, function () {
                element.style.top = 'unset';
                element.style.left = 'unset';
                element.style.position = 'unset';
                element.style.zIndex = 'unset';
                document.getElementById("casino" + casino).appendChild(element);
            }));
            animation.play();
        });
        this.takeAction("chooseCasino", {
            casino: casino
        });
    };
    LasVegas.prototype.createDiceHtml = function (number, color) {
        return "<div class=\"dice dice" + number + "\"><div class=\"dice-overlay\" style=\"background: #" + color + "\"></div></div>";
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
              your pylos.game.php file.

    */
    LasVegas.prototype.setupNotifications = function () {
        console.log('notifications subscriptions setup');
        // TODO: here, associate your game notifications with local methods
        // Example 1: standard notification handling
        dojo.subscribe('newTurn', this, "notif_newTurn");
        dojo.subscribe('dicesPlayed', this, "notif_dicesPlayed");
        dojo.subscribe('removeDuplicates', this, "notif_removeDuplicates");
        dojo.subscribe('collectBanknotes', this, "notif_collectBanknotes");
        // Example 2: standard notification handling + tell the user interface to wait
        //            during 3 seconds after calling the method in order to let the players
        //            see what is happening in the game.
        //dojo.subscribe( 'banknotesPlaced', this, "notif_banknotesPlaced" );
        //(this as any).notifqueue.setSynchronous( 'banknotesPlaced', 3000 );
        //
        //(this as any).notifqueue.setSynchronous( 'finalScore', 1500 );
        // TODO use asynchronous
    };
    LasVegas.prototype.notif_newTurn = function (a, b) {
        console.log(a, b);
    };
    LasVegas.prototype.notif_dicesPlayed = function (a, b) {
        console.log(a, b);
    };
    LasVegas.prototype.notif_removeDuplicates = function (a, b) {
        console.log(a, b);
    };
    LasVegas.prototype.notif_collectBanknotes = function (a, b) {
        console.log(a, b);
    };
    return LasVegas;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.lasvegasthoun", ebg.core.gamegui, new LasVegas());
});
