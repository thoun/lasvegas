const X_OVERLAP = 30;
const Y_OVERLAP = 0;

function updateDisplay(from: string) {
    if (!$(this.control_name)) {
        return;
    }
    const controlMarginBox = dojo.marginBox(this.control_name);
    let pageContentMarginWidth = controlMarginBox.w;
    if (this.autowidth) {
        const pageContentMarginBox = dojo.marginBox($("page-content"));
        pageContentMarginWidth = pageContentMarginBox.w;
    }
    let topDestination = 0;
    let leftDestination = 0;

    const itemWidth = this.item_width;
    const itemHeight = this.item_height;
    const itemMargin = this.item_margin;

    let controlWidth = 0;
    const topDestinations = [];
    const leftDestinations = [];

    this.items.forEach((item, iIndex) => {;
        if (typeof item.loc == "undefined") {
            leftDestination = iIndex * X_OVERLAP;
            controlWidth = Math.max(controlWidth, leftDestination + itemWidth);
            if (this.centerItems) {
                leftDestination += (pageContentMarginWidth - ((itemWidth + itemMargin) + (this.items.length-1) * X_OVERLAP)) / 2;
            }

            topDestinations[iIndex] = iIndex * Y_OVERLAP;
            leftDestinations[iIndex] = leftDestination;
        }
    });

    for (let i in this.items) {
        topDestination = topDestinations[i];
        leftDestination = leftDestinations[i];

        const item = this.items[i];
        const itemDivId = this.getItemDivId(item.id);

        let $itemDiv = $(itemDivId);
        if ($itemDiv) {
            if (typeof item.loc == "undefined") {
                dojo.fx.slideTo({
                    node: $itemDiv,
                    top: topDestination,
                    left: leftDestination,
                    duration: 1000,
                    unit: "px"
                }).play();
            } else {
                this.page.slideToObject($itemDiv, item.loc, 1000).play();
            }

            dojo.style($itemDiv, "width", itemWidth + "px");
            dojo.style($itemDiv, "height", itemHeight + "px");
            dojo.style($itemDiv, "z-index", i);
            // dojo.style($itemDiv, "background-size", "100% auto");
        } else {
            const type = this.item_type[item.type];
            if (!type) {
                console.error("Stock control: Unknow type: " + type);
            }
            if (typeof itemDivId == "undefined") {
                console.error("Stock control: Undefined item id");
            } else {
                if (typeof itemDivId == "object") {
                    console.error("Stock control: Item id with 'object' type");
                    console.error(itemDivId);
                }
            }
            let additional_style = "";
            const jstpl_stock_item_template = dojo.trim(dojo.string.substitute(this.jstpl_stock_item, {
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
                let backgroundPositionWidth = 0;
                let backgroundPositionHeight = 0;
                if (this.image_items_per_row) {
                    const rowNumber = Math.floor(type.image_position / this.image_items_per_row);
                    if (!this.image_in_vertical_row) {
                        backgroundPositionWidth = (type.image_position - (rowNumber * this.image_items_per_row)) * 100;
                        backgroundPositionHeight = rowNumber * 100;
                    } else {
                        backgroundPositionHeight = (type.image_position - (rowNumber * this.image_items_per_row)) * 100;
                        backgroundPositionWidth = rowNumber * 100;
                    }
                    dojo.style($itemDiv, "backgroundPosition", "-" + backgroundPositionWidth + "% -" + backgroundPositionHeight + "%");
                } else {
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
                    let anim = dojo.fx.slideTo({
                        node: $itemDiv,
                        top: topDestination,
                        left: leftDestination,
                        duration: 1000,
                        unit: "px"
                    });
                    anim = this.page.transformSlideAnimTo3d(anim, $itemDiv, 1000, null);
                    anim.play();
                } else {
                    this.page.slideToObject($itemDiv, item.loc, 1000).play();
                }
            } else {
                dojo.style($itemDiv, "opacity", 0);
                dojo.fadeIn({
                    node: $itemDiv
                }).play();
            }
        }
    }
    const controlHeight = (itemHeight + itemMargin) + (this.items.length - 1) * Y_OVERLAP;
    dojo.style(this.control_name, "height", controlHeight + "px");
    if (this.autowidth) {
        if (controlWidth > 0) {
            controlWidth += (this.item_width - itemWidth);
        }
        dojo.style(this.control_name, "width", controlWidth + "px");
    }

    dojo.style(this.control_name, "minHeight", (itemHeight + itemMargin) + "px");
}

class BanknotesStock {
    private stock: Stock;

    constructor(game: LasVegasGame, casino: number, banknotes: Banknote[]) {
        this.stock = new ebg.stock();
        this.stock.create( game, $(`banknotes${casino}`), 233, 110 );
        //this.stock.setOverlap(90,90);
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for(let value=1; value<=9; value++) {
            this.stock.addItemType( value, value, `${g_gamethemeurl}img/banknotes.jpg`, value-1 );
        }
        this.stock.updateDisplay = (from: string) => updateDisplay.apply(this.stock, [from]);

        this.setNewBanknotes(banknotes);
    }

    setNewBanknotes(banknotes: Banknote[]): void {
        banknotes.forEach(banknote => this.stock.addToStockWithId( banknote.value, `${banknote.id}`, 'topbar'));
    }

    slideBanknoteTo(banknoteId: number, playerId: number) {
        this.stock.removeFromStockById(`${banknoteId}`, `overall_player_board_${playerId}`);
    }

    removeBanknote(banknoteId: number) {
        this.stock.removeFromStockById(`${banknoteId}`);
    }
}
