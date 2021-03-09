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
            this.stock.addItemType(value, 10 - value, g_gamethemeurl + "img/banknotes.png", value - 1);
        }
        this.banknotes.forEach(function (banknote) { return _this.stock.addToStockWithId(banknote.value, "" + banknote.id, 'topbar'); });
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
    Casino.prototype.slideBanknoteTo = function (banknoteId, playerId) {
        this.stock.removeFromStockById("" + banknoteId, "playertable-" + playerId);
    };
    Casino.prototype.removeBanknote = function (banknoteId) {
        this.stock.removeFromStockById("" + banknoteId);
    };
    Casino.prototype.removeDices = function () {
        var _this = this;
        Array.from(document.getElementById("casino" + this.casino).getElementsByClassName("dice")).forEach(function (element) {
            _this.game.fadeOutAndDestroy(element);
        });
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
        this.setupNotifications();
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
        //this.setTableDices();
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
        if (!this.checkAction('chooseCasino')) {
            return;
        }
        this.moveDicesToCasino(casino, this.getActivePlayerId());
        this.takeAction("chooseCasino", {
            casino: casino
        });
    };
    LasVegas.prototype.createDiceHtml = function (number, color) {
        return "<div class=\"dice dice" + number + "\"><div class=\"dice-overlay\" style=\"background: #" + color + "\"></div></div>";
    };
    LasVegas.prototype.moveDicesToCasino = function (casino, playerId) {
        var _this = this;
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
        Array.from(document.getElementById('dices-selector').getElementsByClassName("dice")).filter(function (element) { return !element.classList.contains("dice" + casino); }).forEach(function (element) {
            //(this as any).slideToObjectAndDestroy(element, `overall_player_board_${playerId}`);
            _this.fadeOutAndDestroy(element);
        });
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
        var _this = this;
        console.log('notifications subscriptions setup');
        var notifs = [
            ['newTurn', 1],
            ['dicesPlayed', 1],
            ['removeDuplicates', 500],
            ['collectBanknote', 500],
            ['removeBanknote', 500],
            ['removeDices', 500],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    LasVegas.prototype.notif_newTurn = function (notif) {
        console.log('notif_newTurn', notif.args);
        var firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            var animation = this.slideToObject(firstPlayerToken, "player_board_" + notif.args.playerId);
            dojo.connect(animation, 'onEnd', dojo.hitch(this, function () {
                firstPlayerToken.style.top = 'unset';
                firstPlayerToken.style.left = 'unset';
                firstPlayerToken.style.position = 'unset';
                firstPlayerToken.style.zIndex = 'unset';
                document.getElementById("player_board_" + notif.args.playerId).appendChild(firstPlayerToken);
            }));
            animation.play();
        }
        else {
            dojo.place('<div id="firstPlayerToken">FP</div>', "player_board_" + notif.args.playerId);
        }
    };
    LasVegas.prototype.notif_dicesPlayed = function (notif) {
        console.log('notif_dicesPlayed', notif.args);
        this.moveDicesToCasino(notif.args.casino, notif.args.playerId);
    };
    LasVegas.prototype.notif_removeDuplicates = function (notif) {
        console.log('notif_removeDuplicates', notif.args.duplicates);
    };
    LasVegas.prototype.notif_collectBanknote = function (notif) {
        console.log('notif_collectBanknote', notif.args);
        this.casinos[notif.args.casino].slideBanknoteTo(notif.args.id, notif.args.playerId);
        this.scoreCtrl[notif.args.playerId].incValue(notif.args.value * 10000);
    };
    LasVegas.prototype.notif_removeBanknote = function (notif) {
        console.log('notif_removeBanknote', notif.args);
    };
    LasVegas.prototype.notif_removeDices = function (notif) {
        console.log('notif_removeDices', notif.args);
        this.casinos[notif.args.casino].removeDices();
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
