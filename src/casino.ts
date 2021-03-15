class Casino {
    public selectable: boolean = false;
    private stock: BanknotesStock;
    private banknotes: Banknote[];

    constructor(private game: LasVegasGame, public casino: number, public gamedatas: CasinoGamedatas) {
        this.banknotes = gamedatas.banknotes;
    }

    setNewBanknotes(banknotes: Banknote[]): void {
        this.stock.setNewBanknotes(banknotes);
    }

    addHtml() {
        dojo.place(
            `<div id="casino_wrapper${this.casino}" class="casino_wrapper">
                <div id="casino${this.casino}" class="casino"></div>
                <div id="banknotes${this.casino}" class="banknotes"></div>
            </div>`,
            'casinos');
        document.getElementById(`casino${this.casino}`).addEventListener('click', () => this.onSelection());

        this.stock = new BanknotesStock(this.game, this.casino, this.banknotes);
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
        this.stock.slideBanknoteTo(banknoteId, playerId);
    }

    removeBanknote(banknoteId: number) {
        this.stock.removeBanknote(banknoteId);
    }

    getPlayerSpaceId(playerId: number): string {
        return `casino${this.casino}-player-${playerId}`;
    }

    removeDices(playerId: number = null) {
        if (playerId === null) {
            Array.from(document.getElementById(`casino${this.casino}`).getElementsByClassName(`casino-player`))
                .forEach((element: HTMLDivElement) => {
                    try {
                        (this.game as any).fadeOutAndDestroy(element);
                    } catch (e) {
                        // element could be destroyed during animation if he was removed by playerId, then we ignore fadeOutAndDestroy error
                    }
                });
        } else {
            try {
                (this.game as any).fadeOutAndDestroy(document.getElementById(this.getPlayerSpaceId(playerId)));
            } catch (e) {
                // element could be destroyed during animation if he was removed by playerId, then we ignore fadeOutAndDestroy error
            }
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
