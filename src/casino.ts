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
        //this.stock.setOverlap(90,90);
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

    getPlayerSpaceId(playerId: number): string {
        return `casino${this.casino}-player-${playerId}`;
    }

    removeDices(playerId?: number) {
        if (playerId ?? null === null) {
            Array.from(document.getElementById(`casino${this.casino}`).getElementsByClassName(`casino-player`))
                .forEach((element: HTMLDivElement) => (this.game as any).fadeOutAndDestroy(element));
        } else {
            (this.game as any).fadeOutAndDestroy(document.getElementById(this.getPlayerSpaceId(playerId)));
        }
    }

    addSpaceForPlayer(playerId: number) {
        const id = this.getPlayerSpaceId(playerId);
        if (!document.getElementById(id)) {
            dojo.place(`<div id="${id}" class="casino-player" dataset-player-id="${playerId}"></div>`, `casino${this.casino}`);
        }
    }

    reorderDices() {
        const parentNode = document.getElementById(`casino${this.casino}`);
        const elements = Array.from(parentNode.getElementsByClassName(`casino-player`));
        const orderedElements = elements.slice().sort((a: HTMLDivElement, b: HTMLDivElement) => {
            if (a.childElementCount !== b.childElementCount) {
                console.log('return', b.childElementCount - a.childElementCount);
                return b.childElementCount - a.childElementCount;
            } else if (Number(a.dataset.playerId)) {
                return 1;
            } else if (Number(b.dataset.playerId)) {
                return -1;
            } else {
                return 0;
            }
        });
        
        orderedElements.forEach((element: HTMLDivElement, index: number) => {
            if (element !== elements[index]) {
                parentNode.insertBefore(element, index === orderedElements.length-1 ? null : elements[index+1]);
            }
        });
    }
}
