var X_OVERLAP = 30;
var Y_OVERLAP = 0;
function updateDisplay(from) {
    var _this = this;
    if (!$(this.control_name)) {
        return;
    }
    var controlMarginBox = dojo.marginBox(this.control_name);
    var pageContentMarginWidth = controlMarginBox.w;
    if (this.autowidth) {
        var pageContentMarginBox = dojo.marginBox($("page-content"));
        pageContentMarginWidth = pageContentMarginBox.w;
    }
    var topDestination = 0;
    var leftDestination = 0;
    var itemWidth = this.item_width;
    var itemHeight = this.item_height;
    var itemMargin = this.item_margin;
    var controlWidth = 0;
    var topDestinations = [];
    var leftDestinations = [];
    this.items.forEach(function (item, iIndex) {
        ;
        if (typeof item.loc == "undefined") {
            leftDestination = iIndex * X_OVERLAP;
            controlWidth = Math.max(controlWidth, leftDestination + itemWidth);
            if (_this.centerItems) {
                leftDestination += (pageContentMarginWidth - ((itemWidth + itemMargin) + (_this.items.length - 1) * X_OVERLAP)) / 2;
            }
            topDestinations[iIndex] = iIndex * Y_OVERLAP;
            leftDestinations[iIndex] = leftDestination;
        }
    });
    for (var i in this.items) {
        topDestination = topDestinations[i];
        leftDestination = leftDestinations[i];
        var item = this.items[i];
        var itemDivId = this.getItemDivId(item.id);
        var $itemDiv = $(itemDivId);
        if ($itemDiv) {
            if (typeof item.loc == "undefined") {
                dojo.fx.slideTo({
                    node: $itemDiv,
                    top: topDestination,
                    left: leftDestination,
                    duration: 1000,
                    unit: "px"
                }).play();
            }
            else {
                this.page.slideToObject($itemDiv, item.loc, 1000).play();
            }
            dojo.style($itemDiv, "width", itemWidth + "px");
            dojo.style($itemDiv, "height", itemHeight + "px");
            dojo.style($itemDiv, "z-index", i);
            // dojo.style($itemDiv, "background-size", "100% auto");
        }
        else {
            var type = this.item_type[item.type];
            if (!type) {
                console.error("Stock control: Unknow type: " + type);
            }
            if (typeof itemDivId == "undefined") {
                console.error("Stock control: Undefined item id");
            }
            else {
                if (typeof itemDivId == "object") {
                    console.error("Stock control: Item id with 'object' type");
                    console.error(itemDivId);
                }
            }
            var additional_style = "";
            var jstpl_stock_item_template = dojo.trim(dojo.string.substitute(this.jstpl_stock_item, {
                id: itemDivId,
                width: itemWidth,
                height: itemHeight,
                top: topDestination,
                left: leftDestination,
                image: type.image,
                position: "z-index:" + i,
                extra_classes: this.extraClasses,
                additional_style: additional_style
            }));
            dojo.place(jstpl_stock_item_template, this.control_name);
            $itemDiv = $(itemDivId);
            if (typeof item.loc != "undefined") {
                this.page.placeOnObject($itemDiv, item.loc);
            }
            if (this.selectable == 0) {
                dojo.addClass($itemDiv, "stockitem_unselectable");
            }
            dojo.connect($itemDiv, "onclick", this, "onClickOnItem");
            if (Number(type.image_position) !== 0) {
                var backgroundPositionWidth = 0;
                var backgroundPositionHeight = 0;
                if (this.image_items_per_row) {
                    var rowNumber = Math.floor(type.image_position / this.image_items_per_row);
                    if (!this.image_in_vertical_row) {
                        backgroundPositionWidth = (type.image_position - (rowNumber * this.image_items_per_row)) * 100;
                        backgroundPositionHeight = rowNumber * 100;
                    }
                    else {
                        backgroundPositionHeight = (type.image_position - (rowNumber * this.image_items_per_row)) * 100;
                        backgroundPositionWidth = rowNumber * 100;
                    }
                    dojo.style($itemDiv, "backgroundPosition", "-" + backgroundPositionWidth + "% -" + backgroundPositionHeight + "%");
                }
                else {
                    backgroundPositionWidth = type.image_position * 100;
                    dojo.style($itemDiv, "backgroundPosition", "-" + backgroundPositionWidth + "% 0%");
                }
            }
            if (this.onItemCreate) {
                this.onItemCreate($itemDiv, item.type, itemDivId);
            }
            if (typeof from != "undefined") {
                this.page.placeOnObject($itemDiv, from);
                if (typeof item.loc == "undefined") {
                    var anim = dojo.fx.slideTo({
                        node: $itemDiv,
                        top: topDestination,
                        left: leftDestination,
                        duration: 1000,
                        unit: "px"
                    });
                    anim = this.page.transformSlideAnimTo3d(anim, $itemDiv, 1000, null);
                    anim.play();
                }
                else {
                    this.page.slideToObject($itemDiv, item.loc, 1000).play();
                }
            }
            else {
                dojo.style($itemDiv, "opacity", 0);
                dojo.fadeIn({
                    node: $itemDiv
                }).play();
            }
        }
    }
    var controlHeight = (itemHeight + itemMargin) + (this.items.length - 1) * Y_OVERLAP;
    dojo.style(this.control_name, "height", controlHeight + "px");
    if (this.autowidth) {
        if (controlWidth > 0) {
            controlWidth += (this.item_width - itemWidth);
        }
        dojo.style(this.control_name, "width", controlWidth + "px");
    }
    dojo.style(this.control_name, "minHeight", (itemHeight + itemMargin) + "px");
}
var BanknotesStock = /** @class */ (function () {
    function BanknotesStock(game, casino, banknotes) {
        var _this = this;
        this.stock = new ebg.stock();
        this.stock.create(game, $("banknotes" + casino), 233, 110);
        //this.stock.setOverlap(90,90);
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for (var value = 1; value <= 9; value++) {
            this.stock.addItemType(value, value, g_gamethemeurl + "img/banknotes.jpg", value - 1);
        }
        this.stock.updateDisplay = function (from) { return updateDisplay.apply(_this.stock, [from]); };
        this.setNewBanknotes(banknotes);
    }
    BanknotesStock.prototype.setNewBanknotes = function (banknotes) {
        var _this = this;
        banknotes.forEach(function (banknote) { return _this.stock.addToStockWithId(banknote.value, "" + banknote.id, 'topbar'); });
    };
    BanknotesStock.prototype.slideBanknoteTo = function (banknoteId, playerId) {
        this.stock.removeFromStockById("" + banknoteId, "overall_player_board_" + playerId);
    };
    BanknotesStock.prototype.removeBanknote = function (banknoteId) {
        this.stock.removeFromStockById("" + banknoteId);
    };
    return BanknotesStock;
}());
var Casino = /** @class */ (function () {
    function Casino(game, casino, gamedatas) {
        this.game = game;
        this.casino = casino;
        this.gamedatas = gamedatas;
        this.selectable = false;
        this.banknotes = gamedatas.banknotes;
    }
    Casino.prototype.setNewBanknotes = function (banknotes) {
        this.stock.setNewBanknotes(banknotes);
    };
    Casino.prototype.addHtml = function () {
        var _this = this;
        dojo.place("<div id=\"casino_wrapper" + this.casino + "\" class=\"casino_wrapper\">\n                <div id=\"casino" + this.casino + "\" class=\"casino\"></div>\n                <div id=\"banknotes" + this.casino + "\" class=\"banknotes\"></div>\n            </div>", 'casinos');
        document.getElementById("casino" + this.casino).addEventListener('click', function () { return _this.onSelection(); });
        this.stock = new BanknotesStock(this.game, this.casino, this.banknotes);
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
        this.stock.slideBanknoteTo(banknoteId, playerId);
    };
    Casino.prototype.removeBanknote = function (banknoteId) {
        this.stock.removeBanknote(banknoteId);
    };
    Casino.prototype.getPlayerSpaceId = function (playerId) {
        return "casino" + this.casino + "-player-" + playerId;
    };
    Casino.prototype.removeDices = function (playerId) {
        var _this = this;
        if (playerId !== null && playerId !== void 0 ? playerId : null === null) {
            Array.from(document.getElementById("casino" + this.casino).getElementsByClassName("casino-player"))
                .forEach(function (element) { return _this.game.fadeOutAndDestroy(element); });
        }
        else {
            this.game.fadeOutAndDestroy(document.getElementById(this.getPlayerSpaceId(playerId)));
        }
    };
    Casino.prototype.addSpaceForPlayer = function (playerId) {
        var id = this.getPlayerSpaceId(playerId);
        if (!document.getElementById(id)) {
            dojo.place("<div id=\"" + id + "\" class=\"casino-player\" dataset-player-id=\"" + playerId + "\"></div>", "casino" + this.casino);
        }
    };
    Casino.prototype.reorderDices = function () {
        var parentNode = document.getElementById("casino" + this.casino);
        var elements = Array.from(parentNode.getElementsByClassName("casino-player"));
        var orderedElements = elements.slice().sort(function (a, b) {
            if (a.childElementCount !== b.childElementCount) {
                return b.childElementCount - a.childElementCount;
            }
            else if (Number(a.dataset.playerId)) {
                return 1;
            }
            else if (Number(b.dataset.playerId)) {
                return -1;
            }
            else {
                return 0;
            }
        });
        orderedElements.forEach(function (element, index) {
            if (element !== elements[index]) {
                parentNode.insertBefore(element, index === orderedElements.length - 1 ? null : elements[index + 1]);
            }
        });
    };
    return Casino;
}());
var END_TURN_ANIMATIONS_DURATION = 1000;
var COLORS = [
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
var LasVegas = /** @class */ (function () {
    function LasVegas() {
        this.casinos = [];
        this.dicesCounters = [];
        this.dicesCountersNeutral = [];
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
        //console.log( "Starting game setup" );
        var _this = this;
        this.gamedatas = gamedatas;
        this.neutralColor = COLORS.find(function (color) { return !Object.values(_this.gamedatas.players).some(function (player) { return player.color === color; }); });
        Object.values(this.gamedatas.players).forEach(function (player) {
            var html = "<div class=\"dice-counters\">" + _this.createDiceHtml(5, player.id, player.color) + " <span id=\"dice-counter-" + player.id + "\"></span>";
            if (_this.isVariant()) {
                html += _this.createDiceHtml(5, player.id, _this.neutralColor) + " <span id=\"dice-counter-" + player.id + "-neutral\"></span>";
            }
            html += "</div>";
            dojo.place(html, "player_board_" + player.id);
            var dices = player.dices;
            var counter = new ebg.counter();
            counter.create("dice-counter-" + player.id);
            counter.setValue(dices.player);
            _this.dicesCounters[player.id] = counter;
            if (_this.isVariant()) {
                var counter_1 = new ebg.counter();
                counter_1.create("dice-counter-" + player.id + "-neutral");
                counter_1.setValue(dices.neutral);
                _this.dicesCountersNeutral[player.id] = counter_1;
            }
            var suffix = document.createElement("span");
            suffix.id = "player_score_suffix_" + player.id;
            suffix.style.marginLeft = '-4px';
            var playerScore = document.getElementById("player_board_" + player.id).getElementsByTagName('div')[0];
            playerScore.insertBefore(suffix, playerScore.getElementsByTagName('i')[0]);
        });
        setTimeout(function () {
            Object.values(_this.gamedatas.players).forEach(function (player) {
                _this.setScoreSuffix(Number(player.id));
            });
        });
        var _loop_1 = function (i) {
            var casino = new Casino(this_1, i, gamedatas.casinos[i]);
            this_1.casinos[i] = casino;
            casino.addHtml();
            Object.entries(gamedatas.casinos[i].dices).forEach(function (_a) {
                var playerId = _a[0], dices = _a[1];
                var color = _this.gamedatas.players[playerId].color;
                for (var j = 0; j < dices.player; j++) {
                    _this.casinos[i].addSpaceForPlayer(Number(playerId));
                    dojo.place(_this.createDiceHtml(i, playerId, color), _this.casinos[i].getPlayerSpaceId(Number(playerId)));
                }
                _this.casinos[i].reorderDices();
            });
            Object.values(gamedatas.casinos[i].dices).forEach(function (dices) {
                for (var j = 0; j < dices.neutral; j++) {
                    _this.casinos[i].addSpaceForPlayer(0);
                    dojo.place(_this.createDiceHtml(i, 0, _this.neutralColor), _this.casinos[i].getPlayerSpaceId(0));
                }
                _this.casinos[i].reorderDices();
            });
        };
        var this_1 = this;
        for (var i = 1; i <= 6; i++) {
            _loop_1(i);
        }
        this.updateTurnNumber(this.gamedatas.roundNumber);
        this.placeFirstPlayerToken(this.gamedatas.firstPlayerId);
        document.getElementById('dices-selector').addEventListener('click', function (event) { return _this.diceSelectorClick(event); });
        this.setupNotifications();
        //console.log( "Ending game setup" );
        //colors.forEach(color => dojo.place(this.createDiceHtml(5, color), `dices-test`));
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    LasVegas.prototype.onEnteringState = function (stateName, args) {
        //console.log( 'Entering state: '+stateName );
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
                if (this.isCurrentPlayerActive() && (args.dices.player.includes(i) || args.dices.neutral.includes(i))) {
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
    LasVegas.prototype.setScoreSuffix = function (playerId) {
        document.getElementById("player_score_suffix_" + playerId).innerHTML = this.scoreCtrl[playerId].getValue() ? '0.000$' : '$';
    };
    LasVegas.prototype.isVariant = function () {
        return this.gamedatas.variant;
    };
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
        var _loop_2 = function (i) {
            dices.player.filter(function (dice) { return dice == i; }).forEach(function (dice) {
                dojo.place(_this.createDiceHtml(dice, playerId, color), 'dices-selector');
            });
            dices.neutral.filter(function (dice) { return dice == i; }).forEach(function (dice) {
                dojo.place(_this.createDiceHtml(dice, 0, _this.neutralColor), 'dices-selector');
            });
            this_2.casinos[i].reorderDices();
        };
        var this_2 = this;
        for (var i = 1; i <= 6; i++) {
            _loop_2(i);
        }
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
    LasVegas.prototype.moveDicesToCasino = function (casino, playerId_) {
        var _this = this;
        var dicesElement = Array.from(document.getElementById('dices-selector').getElementsByClassName("dice" + casino));
        new Set(dicesElement.map(function (element) { return Number(element.dataset.playerId); })).forEach(function (playerId) {
            return _this.casinos[casino].addSpaceForPlayer(playerId);
        });
        dicesElement.forEach(function (element) {
            element.style.zIndex = '10';
            var playerId = Number(element.dataset.playerId);
            var animation = _this.slideToObject(element, _this.casinos[casino].getPlayerSpaceId(playerId));
            dojo.connect(animation, 'onEnd', dojo.hitch(_this, function () {
                element.style.top = 'unset';
                element.style.left = 'unset';
                element.style.position = 'unset';
                element.style.zIndex = 'unset';
                document.getElementById(_this.casinos[casino].getPlayerSpaceId(playerId)).appendChild(element);
                _this.casinos[casino].reorderDices();
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
    LasVegas.prototype.updateTurnNumber = function (turnNumber) {
        document.getElementById('hand-counter').innerHTML = turnNumber + " / 4";
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
        //console.log( 'notifications subscriptions setup' );
        var _this = this;
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
        var _this = this;
        this.updateTurnNumber(notif.args.roundNumber);
        this.placeFirstPlayerToken(notif.args.playerId);
        this.casinos.forEach(function (casino) { return casino.setNewBanknotes(notif.args.casinos[casino.casino]); });
        notif.args.neutralDices.forEach(function (neutralDice) {
            _this.casinos[neutralDice].addSpaceForPlayer(0);
            dojo.place(_this.createDiceHtml(neutralDice, 0, _this.neutralColor), _this.casinos[neutralDice].getPlayerSpaceId(0));
            _this.casinos[neutralDice].reorderDices();
        });
    };
    LasVegas.prototype.notif_dicesPlayed = function (notif) {
        this.moveDicesToCasino(notif.args.casino, notif.args.playerId);
        this.dicesCounters[notif.args.playerId].toValue(notif.args.remainingDices.player);
        if (this.isVariant()) {
            this.dicesCountersNeutral[notif.args.playerId].toValue(notif.args.remainingDices.neutral);
        }
    };
    LasVegas.prototype.notif_removeDuplicates = function (notif) {
        var _this = this;
        notif.args.playersId.forEach(function (playerId) { return _this.casinos[notif.args.casino].removeDices(playerId); });
    };
    LasVegas.prototype.notif_collectBanknote = function (notif) {
        this.casinos[notif.args.casino].slideBanknoteTo(notif.args.id, notif.args.playerId);
        var points = notif.args.value;
        this.scoreCtrl[notif.args.playerId].incValue(points);
        this.setScoreSuffix(notif.args.playerId);
        this.displayScoring("banknotes" + notif.args.casino, this.gamedatas.players[notif.args.playerId].color, points * 10000, END_TURN_ANIMATIONS_DURATION);
        this.casinos[notif.args.casino].removeDices(notif.args.playerId);
    };
    LasVegas.prototype.notif_removeBanknote = function (notif) {
        this.casinos[notif.args.casino].removeBanknote(notif.args.id);
    };
    LasVegas.prototype.notif_removeDices = function (notif) {
        this.casinos.forEach(function (casino) { return casino.removeDices(); });
        this.dicesCounters.forEach(function (dicesCounter) { return dicesCounter.setValue(notif.args.resetDicesNumber.player); });
        if (this.isVariant()) {
            this.dicesCountersNeutral.forEach(function (dicesCounter) { return dicesCounter.setValue(notif.args.resetDicesNumber.neutral); });
        }
    };
    LasVegas.prototype.formatDicesLog = function (playedDices, casino, playerColor) {
        var str = '';
        if (playedDices.player) {
            str += "<span class=\"log-dice-counters\">" + playedDices.player + " " + this.createDiceHtml(casino, 0, playerColor) + "</span>";
        }
        if (playedDices.neutral) {
            str += "<span class=\"log-dice-counters\">" + playedDices.neutral + " " + this.createDiceHtml(casino, 0, this.neutralColor) + "</span>";
        }
        return str;
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    LasVegas.prototype.format_string_recursive = function (log, args) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            if (log && args && !args.processed) {
                if (args.playedDices_rec && typeof args.playedDices_rec !== 'string') {
                    var playedDices = (_c = (_b = (_a = args.playedDices_rec) === null || _a === void 0 ? void 0 : _a.args) === null || _b === void 0 ? void 0 : _b.playedDices) !== null && _c !== void 0 ? _c : args.playedDices;
                    var casino = (_f = (_e = (_d = args.playedDices_rec) === null || _d === void 0 ? void 0 : _d.args) === null || _e === void 0 ? void 0 : _e.casino) !== null && _f !== void 0 ? _f : args.casino;
                    var playerColor = (_j = (_h = (_g = args.playedDices_rec) === null || _g === void 0 ? void 0 : _g.args) === null || _h === void 0 ? void 0 : _h.playerColor) !== null && _j !== void 0 ? _j : args.playerColor;
                    args.playedDices_rec = this.formatDicesLog(playedDices, casino, playerColor);
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
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
