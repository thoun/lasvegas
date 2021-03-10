class Casino {
    public selectable: boolean = false;
    private stock: Stock;
    private banknotes: Banknote[];

    constructor(private game: LasVegasGame, public casino: number, public gamedatas: CasinoGamedatas) {
        this.banknotes = gamedatas.banknotes;
    }

    setNewBanknotes(banknotes: Banknote[]): void {
        banknotes.forEach(banknote => this.stock.addToStockWithId( banknote.value, `${banknote.id}`, 'topbar'));
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
        this.stock.create( this.game, $(`banknotes${this.casino}`), 350, 165 );
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for(let value=1; value<=9; value++) {
            this.stock.addItemType( value, 10 - value, `${g_gamethemeurl}img/banknotes.jpg`, value-1 );
        }

        this.setNewBanknotes(this.banknotes)
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

    slideBanknoteTo(banknoteId: number, playerId: number) {
        this.stock.removeFromStockById(`${banknoteId}`, `overall_player_board_${playerId}`);
    }

    removeBanknote(banknoteId: number) {
        this.stock.removeFromStockById(`${banknoteId}`);
    }

    removeDices(playerId?: number) {
        let elements = Array.from(document.getElementById(`casino${this.casino}`).getElementsByClassName(`dice`));
        if (playerId) {
            elements = elements.filter((element: HTMLDivElement) => parseInt(element.dataset.playerId) === playerId);
        }
        elements.forEach((element: HTMLDivElement) => (this.game as any).fadeOutAndDestroy(element));
    }
}
