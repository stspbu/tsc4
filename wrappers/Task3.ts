import {
    Address,
    beginCell, Builder,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode
} from 'ton-core';

export type Task3Config = {};

export function task3ConfigToCell(config: Task3Config): Cell {
    return beginCell().endCell();
}

export class Task3 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task3(address);
    }

    static createFromConfig(config: Task3Config, code: Cell, workchain = 0) {
        const data = task3ConfigToCell(config);
        const init = { code, data };
        return new Task3(contractAddress(workchain, init), init);
    }

    static readCellData(c: Cell, prefix: string = '-', separator: string = '\n'): string {
        const s = c.beginParse();

        const arr = [];
        while (s.remainingBits > 0) {
            arr.push(s.loadUint(1));
        }

        let result = prefix + arr.join('');

        if (s.remainingRefs > 0) {
            const child = s.loadRef();
            const serialized = this.readCellData(child, prefix + prefix, separator);

            result += separator + serialized;
        }

        return result;
    }

    static fromString(data: string) : Cell {
        const arr = [];

        let b = new Builder();
        for (let i = 0; i < data.length; i++) {
            if (!b.availableBits) {
                arr.push(b);
                b = new Builder();
            }

            if (data[i] == '1') {
                b.storeBit(1);
            } else {
                b.storeBit(0);
            }
        }

        arr.push(b);

        for (let j = arr.length - 1; j > 0; j--) {
            const c = arr[j].endCell();
            arr[j - 1].storeRef(c);
        }

        return arr[0].endCell();
    }

    static shiftCellData(c: Cell): Cell {
        if (c.refs.length <= 0) {
            return c;
        }

        const data = Task3.readCellData(c, '', '');
        return this.fromString(data);
    }

    async getResult(provider: ContractProvider, flag: number, value: number, bs: Cell): Promise<Cell> {
        const {stack, gasUsed} = await provider.get('find_and_replace', [
            {type: 'int', value: BigInt(flag)},
            {type: 'int', value: BigInt(value)},    // 340282366920938463463374607431768211455n = 128bits with ones
            {type: 'cell', cell: bs}
        ]);

        console.log(`gas: ${gasUsed}`);

        return Task3.shiftCellData(stack.readCell());
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
