var Casino = /** @class */ (function () {
    function Casino(game, casino, gamedatas) {
        this.game = game;
        this.casino = casino;
        this.gamedatas = gamedatas;
        this.selectable = false;
        this.banknotes = gamedatas.banknotes;
    }
    Casino.prototype.setNewBanknotes = function (banknotes) {
        var _this = this;
        banknotes.forEach(function (banknote) { return _this.stock.addToStockWithId(banknote.value, "" + banknote.id, 'topbar'); });
    };
    Casino.prototype.addHtml = function () {
        var _this = this;
        dojo.place("<div id=\"casino_wrapper" + this.casino + "\" class=\"casino_wrapper\">\n                <div id=\"casino" + this.casino + "\" class=\"casino\"></div>\n                <div id=\"banknotes" + this.casino + "\" class=\"banknotes\"></div>\n            </div>", 'casinos');
        document.getElementById("casino" + this.casino).addEventListener('click', function () { return _this.onSelection(); });
        this.stock = new ebg.stock();
        this.stock.create(this.game, $("banknotes" + this.casino), 350, 165);
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for (var value = 1; value <= 9; value++) {
            this.stock.addItemType(value, 10 - value, g_gamethemeurl + "img/banknotes.jpg", value - 1);
        }
        this.setNewBanknotes(this.banknotes);
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
        this.stock.removeFromStockById("" + banknoteId, "overall_player_board_" + playerId);
    };
    Casino.prototype.removeBanknote = function (banknoteId) {
        this.stock.removeFromStockById("" + banknoteId);
    };
    Casino.prototype.removeDices = function (playerId) {
        var _this = this;
        var elements = Array.from(document.getElementById("casino" + this.casino).getElementsByClassName("dice"));
        if (playerId) {
            elements = elements.filter(function (element) { return parseInt(element.dataset.playerId) === playerId; });
        }
        elements.forEach(function (element) { return _this.game.fadeOutAndDestroy(element); });
    };
    return Casino;
}());
var END_TURN_ANIMATIONS_DURATION = 1000;
var LasVegas = /** @class */ (function () {
    function LasVegas() {
        this.casinos = [];
        this.dicesCounters = [];
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
        Object.values(this.gamedatas.players).forEach(function (player) {
            dojo.place("<div class=\"dice-counters\">\n                <div class=\"dice-counter\">\n                    " + _this.createDiceHtml(5, player.id, player.color) + " <span id=\"dice-counter-" + player.id + "\"></span>\n                </div>\n            </div>", "player_board_" + player.id);
            var counter = new ebg.counter();
            counter.create("dice-counter-" + player.id);
            counter.setValue(player.dices);
            _this.dicesCounters[player.id] = counter;
        });
        var _loop_1 = function (i) {
            var casino = new Casino(this_1, i, gamedatas.casinos[i]);
            this_1.casinos[i] = casino;
            casino.addHtml();
            Object.entries(gamedatas.casinos[i].dices).forEach(function (_a) {
                var playerId = _a[0], dices = _a[1];
                var color = _this.gamedatas.players[playerId].color;
                for (var j = 0; j < dices; j++) {
                    dojo.place(_this.createDiceHtml(i, playerId, color), "casino" + i);
                }
            });
        };
        var this_1 = this;
        for (var i = 1; i <= 6; i++) {
            _loop_1(i);
        }
        this.placeFirstPlayerToken(this.gamedatas.firstPlayerId);
        document.getElementById('dices-selector').addEventListener('click', function (event) { return _this.diceSelectorClick(event); });
        this.setupNotifications();
        console.log("Ending game setup");
        /*const colors = [
            'ff0000',
            '008000',
            '0000ff',
            'ffa500',
            '000000',
            'ffffff',
            'e94190',
            '982fff',
            '72c3b1',
            'f07f16',
            'bdd002',
            '7b7b7b'
        ];
        colors.forEach(color => dojo.place(this.createDiceHtml(5, color), `dices-test`));*/
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
            dojo.addClass('dices-selector', 'selectable');
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
        dojo.removeClass('dices-selector', 'selectable');
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
        var playerId = this.getActivePlayerId();
        var color = this.gamedatas.players[playerId].color;
        $('dices-selector').innerHTML = '';
        dices === null || dices === void 0 ? void 0 : dices.forEach(function (dice) {
            dojo.place(_this.createDiceHtml(dice, playerId, color), 'dices-selector');
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
    LasVegas.prototype.createDiceHtml = function (number, playerId, color) {
        var blackDot = [parseInt(color.substr(0, 2), 16), parseInt(color.substr(2, 2), 16), parseInt(color.substr(4, 2), 16)].reduce(function (a, b) { return a + b; }) > 460;
        return "<div class=\"dice dice" + number + " " + (blackDot ? 'black-dot' : 'white-dot') + "\" style=\"background-color: #" + color + "; border-color: #" + color + ";\" data-player-id=\"" + playerId + "\"></div>";
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
    LasVegas.prototype.diceSelectorClick = function (event) {
        var _a, _b, _c;
        var numberMatch = (_c = (_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.classList) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.match(/\d/);
        if (numberMatch) {
            var number = parseInt(numberMatch[0]);
            this.casinos[number].onSelection();
        }
    };
    LasVegas.prototype.placeFirstPlayerToken = function (playerId) {
        var firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            var animation = this.slideToObject(firstPlayerToken, "player_board_" + playerId);
            dojo.connect(animation, 'onEnd', dojo.hitch(this, function () {
                firstPlayerToken.style.top = 'unset';
                firstPlayerToken.style.left = 'unset';
                firstPlayerToken.style.position = 'unset';
                firstPlayerToken.style.zIndex = 'unset';
                document.getElementById("player_board_" + playerId).appendChild(firstPlayerToken);
            }));
            animation.play();
        }
        else {
            dojo.place('<div id="firstPlayerToken"></div>', "player_board_" + playerId);
        }
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
            ['removeDuplicates', END_TURN_ANIMATIONS_DURATION],
            ['collectBanknote', END_TURN_ANIMATIONS_DURATION],
            ['removeBanknote', END_TURN_ANIMATIONS_DURATION],
            ['removeDices', END_TURN_ANIMATIONS_DURATION],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    LasVegas.prototype.notif_newTurn = function (notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
        this.casinos.forEach(function (casino) { return casino.setNewBanknotes(notif.args.casinos[casino.casino]); });
    };
    LasVegas.prototype.notif_dicesPlayed = function (notif) {
        this.moveDicesToCasino(notif.args.casino, notif.args.playerId);
        this.dicesCounters[notif.args.playerId].toValue(notif.args.remainingDices);
    };
    LasVegas.prototype.notif_removeDuplicates = function (notif) {
        var _this = this;
        notif.args.playersId.forEach(function (playerId) { return _this.casinos[notif.args.casino].removeDices(playerId); });
    };
    LasVegas.prototype.notif_collectBanknote = function (notif) {
        this.casinos[notif.args.casino].slideBanknoteTo(notif.args.id, notif.args.playerId);
        var points = notif.args.value * 10000;
        this.scoreCtrl[notif.args.playerId].incValue(points);
        this.displayScoring("banknotes" + notif.args.casino, this.gamedatas.players[notif.args.playerId].color, points, END_TURN_ANIMATIONS_DURATION);
        this.casinos[notif.args.casino].removeDices(notif.args.playerId);
    };
    LasVegas.prototype.notif_removeBanknote = function (notif) {
        this.casinos[notif.args.casino].removeBanknote(notif.args.id);
    };
    LasVegas.prototype.notif_removeDices = function (notif) {
        this.casinos.forEach(function (casino) { return casino.removeDices(); });
        this.dicesCounters.forEach(function (dicesCounter) { return dicesCounter.setValue(notif.args.resetDicesNumber); });
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
