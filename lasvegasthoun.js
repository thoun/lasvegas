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
        if (playerId === void 0) { playerId = null; }
        if (playerId === null) {
            Array.from(document.getElementById("casino" + this.casino).getElementsByClassName("casino-player"))
                .forEach(function (element) {
                try {
                    _this.game.fadeOutAndDestroy(element);
                }
                catch (e) {
                    // element could be destroyed during animation if he was removed by playerId, then we ignore fadeOutAndDestroy error
                }
            });
        }
        else {
            try {
                this.game.fadeOutAndDestroy(document.getElementById(this.getPlayerSpaceId(playerId)));
            }
            catch (e) {
                // element could be destroyed during animation if he was removed by playerId, then we ignore fadeOutAndDestroy error
            }
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        this.diceAnimations = [];
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
        this.getGameAreaElement().insertAdjacentHTML('beforeend', "\n            <div id=\"dices-selector-and-counter\">\n                <div id=\"dices-selector\" class=\"whiteblock\"></div>\n                <div id=\"hand-counter\" class=\"whiteblock\"></div>\n            </div>\n\n            <div id=\"casinos\"></div>\n        ");
        this.neutralColor = COLORS.find(function (color) { return !Object.values(_this.gamedatas.players).some(function (player) { return player.color === color; }); });
        Object.values(this.gamedatas.players).forEach(function (player) {
            var html = "<div class=\"dice-counters\">" + _this.createDiceHtml(5, player.id, player.color) + " <span id=\"dice-counter-" + player.id + "\"></span>";
            if (_this.isVariant()) {
                html += _this.createDiceHtml(5, player.id, _this.neutralColor) + " <span id=\"dice-counter-" + player.id + "-neutral\"></span>";
            }
            html += "</div>";
            _this.getPlayerPanelElement(player.id).insertAdjacentHTML('beforeend', html);
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
        // COLORS.forEach(color => dojo.place(this.createDiceHtml(5, null, color), `dices-test`));
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    LasVegas.prototype.onEnteringState = function (stateName, args) {
        //console.log( 'Entering state: '+stateName );
        var _this = this;
        var _a;
        switch (stateName) {
            case 'playerTurn':
                var someDiceAnimation = (_a = this.diceAnimations[0]) !== null && _a !== void 0 ? _a : this.diceAnimations[1];
                if (someDiceAnimation) {
                    dojo.connect(someDiceAnimation, 'onEnd', dojo.hitch(this, function () { return _this.onEnteringPlayerTurn(args.args); }));
                }
                else {
                    this.onEnteringPlayerTurn(args.args);
                }
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
        Array.from($('dices-selector').getElementsByClassName('dice')).forEach(function (dice) {
            dice.classList.add('rolled');
            setTimeout(function () {
                dice.getElementsByClassName('die-list')[0].classList.add(Math.random() < 0.5 ? 'odd-roll' : 'even-roll');
            }, 100);
        });
    };
    LasVegas.prototype.casinoSelected = function (casino) {
        // this.moveDicesToCasino(casino, (this as any).getActivePlayerId());
        this.bgaPerformAction("actChooseCasino", {
            casino: casino
        });
    };
    LasVegas.prototype.createDiceHtml = function (number, playerId, color) {
        var blackDot = [parseInt(color.substr(0, 2), 16), parseInt(color.substr(2, 2), 16), parseInt(color.substr(4, 2), 16)].reduce(function (a, b) { return a + b; }) > 460;
        //return `<div class="dice dice${number} ${blackDot ? 'black-dot' : 'white-dot'}" style="background-color: #${color}; border-color: #${color};" data-player-id="${playerId}"></div>`;
        var html = "<div class=\"dice dice" + number + "\" data-player-id=\"" + playerId + "\">\n            <ol class=\"die-list\" data-roll=\"" + number + "\">";
        for (var die = 1; die <= 6; die++) {
            html += "<li class=\"die-item\" data-side=\"" + die + "\" style=\"background-color: #" + color + "; border-color: #" + color + ";\">";
            for (var i = 1; i <= die; i++) {
                html += "<span class=\"dot " + (blackDot ? 'black-dot' : 'white-dot') + "\"></span>";
            }
            html += "</li>";
        }
        html += "</ol></div>";
        return html;
    };
    LasVegas.prototype.moveDicesToCasino = function (casino, playerId_) {
        var _this = this;
        var dicesSelector = document.getElementById('dices-selector');
        var dicesElement = Array.from(dicesSelector.getElementsByClassName("dice" + casino));
        var playersIds = new Set(dicesElement.map(function (element) { return Number(element.dataset.playerId); }));
        playersIds.forEach(function (playerId) { return _this.casinos[casino].addSpaceForPlayer(playerId); });
        Array.from(playersIds.keys()).forEach(function (playerId) {
            // we put animated dices on a temp span
            var dicesSpan = document.createElement("span");
            dicesSpan.style.zIndex = '10';
            dicesSpan.style.position = 'relative';
            dicesSelector.insertBefore(dicesSpan, dicesElement.filter(function (element) { return Number(element.dataset.playerId) == playerId; })[0]);
            dicesElement.filter(function (element) { return Number(element.dataset.playerId) == playerId; }).forEach(function (element) { return dicesSpan.appendChild(element); });
            _this.diceAnimations[playerId ? 1 : 0] = _this.slideToObject(dicesSpan, _this.casinos[casino].getPlayerSpaceId(playerId));
            dojo.connect(_this.diceAnimations[playerId ? 1 : 0], 'onEnd', dojo.hitch(_this, function () {
                Array.from(dicesSpan.children).forEach(function (dice) { return document.getElementById(_this.casinos[casino].getPlayerSpaceId(playerId)).appendChild(dice); });
                delete _this.diceAnimations[playerId ? 1 : 0];
                _this.casinos[casino].reorderDices();
            }));
            _this.diceAnimations[playerId ? 1 : 0].play();
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
        this.bgaSetupPromiseNotifications();
    };
    LasVegas.prototype.notif_newTurn = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.updateTurnNumber(args.roundNumber);
                this.placeFirstPlayerToken(args.playerId);
                this.casinos.forEach(function (casino) { return casino.setNewBanknotes(args.casinos[casino.casino]); });
                args.neutralDices.forEach(function (neutralDice) {
                    _this.casinos[neutralDice].addSpaceForPlayer(0);
                    dojo.place(_this.createDiceHtml(neutralDice, 0, _this.neutralColor), _this.casinos[neutralDice].getPlayerSpaceId(0));
                    _this.casinos[neutralDice].reorderDices();
                });
                return [2 /*return*/];
            });
        });
    };
    LasVegas.prototype.notif_dicesPlayed = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                Array.from($('dices-selector').getElementsByClassName('dice')).forEach(function (dice) {
                    dice.classList.remove('rolled');
                });
                this.moveDicesToCasino(args.casino, args.playerId);
                this.dicesCounters[args.playerId].toValue(args.remainingDices.player);
                if (this.isVariant()) {
                    this.dicesCountersNeutral[args.playerId].toValue(args.remainingDices.neutral);
                }
                return [2 /*return*/];
            });
        });
    };
    LasVegas.prototype.notif_removeDuplicates = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        args.playersId.forEach(function (playerId) { return _this.casinos[args.casino].removeDices(playerId); });
                        return [4 /*yield*/, this.wait(END_TURN_ANIMATIONS_DURATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LasVegas.prototype.notif_collectBanknote = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var points;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args.playerId) {
                            this.casinos[args.casino].slideBanknoteTo(args.id, args.playerId);
                            points = args.value;
                            this.scoreCtrl[args.playerId].incValue(points);
                            this.setScoreSuffix(args.playerId);
                            this.displayScoring("banknotes" + args.casino, this.gamedatas.players[args.playerId].color, points * 10000, END_TURN_ANIMATIONS_DURATION);
                        }
                        else {
                            this.casinos[args.casino].removeBanknote(args.id);
                        }
                        this.casinos[args.casino].removeDices(args.playerId);
                        return [4 /*yield*/, this.wait(END_TURN_ANIMATIONS_DURATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LasVegas.prototype.notif_removeBanknote = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.casinos[args.casino].removeBanknote(args.id);
                        return [4 /*yield*/, this.wait(END_TURN_ANIMATIONS_DURATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LasVegas.prototype.notif_removeDices = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.casinos.forEach(function (casino) { return casino.removeDices(); });
                        this.dicesCounters.forEach(function (dicesCounter) { return dicesCounter.setValue(args.resetDicesNumber.player); });
                        if (this.isVariant()) {
                            this.dicesCountersNeutral.forEach(function (dicesCounter) { return dicesCounter.setValue(args.resetDicesNumber.neutral); });
                        }
                        return [4 /*yield*/, this.wait(END_TURN_ANIMATIONS_DURATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
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
