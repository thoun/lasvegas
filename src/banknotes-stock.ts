class BanknotesStock {
    private stock: Stock;

    constructor(game: LasVegasGame, casino: number, banknotes: Banknote[]) {
        this.stock = new ebg.stock();
        this.stock.create( game, $(`banknotes${casino}`), 350, 165 );
        //this.stock.setOverlap(90,90);
        this.stock.centerItems = true;
        this.stock.image_items_per_row = 1;
        this.stock.setSelectionMode(0);
        for(let value=1; value<=9; value++) {
            this.stock.addItemType( value, 10 - value, `${g_gamethemeurl}img/banknotes.jpg`, value-1 );
        }

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
