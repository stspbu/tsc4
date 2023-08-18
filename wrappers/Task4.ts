import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode
} from 'ton-core';

export type Task4Config = {};

export function task4ConfigToCell(config: Task4Config): Cell {
    return beginCell().endCell();
}

export class Task4 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task4(address);
    }

    static createFromConfig(config: Task4Config, code: Cell, workchain = 0) {
        const data = task4ConfigToCell(config);
        const init = { code, data };
        return new Task4(contractAddress(workchain, init), init);
    }

    static printText(c: Cell) {
        let result = "";
        let s = c.beginParse();
        while (s.remainingBits && s.remainingRefs) {
            if (s.remainingBits) {
                const x = s.loadUint(8);
                result += String.fromCharCode(x);
            }  else {
                s = s.loadRef().beginParse();
            }
        }
        console.log(result);
    }

    static createTextCell(text: string, first: boolean = true): Cell {
        const b = new Builder();

        if (first) {
            b.storeUint(0, 32);
        }

        for (let i = 0; i < text.length; i++) {
            if (b.availableBits >= 8) {
                b.storeUint(text.charCodeAt(i), 8);
            } else {
                b.storeRef(Task4.createTextCell(text.substring(i), false));
                break;
            }
        }

        return b.endCell();
    }

    async getEncoded(provider: ContractProvider, text: Cell, shift: number): Promise<Cell> {
        const {stack, gasUsed} = await provider.get('caesar_cipher_encrypt', [
            {type: 'int', value: BigInt(shift)}, {type: 'cell', cell: text}
        ]);
        console.log(`gas: ${gasUsed}`);
        return stack.readCell();
    }

    async getDecoded(provider: ContractProvider, text: Cell, shift: number): Promise<Cell> {
        const {stack, gasUsed} = await provider.get('caesar_cipher_decrypt', [
            {type: 'int', value: BigInt(shift)}, {type: 'cell', cell: text}
        ]);
        console.log(`gas: ${gasUsed}`);
        return stack.readCell();
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
