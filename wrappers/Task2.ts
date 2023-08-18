import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Tuple,
    TupleItemInt
} from 'ton-core';

export type Task2Config = {};

export function task2ConfigToCell(config: Task2Config): Cell {
    return beginCell().endCell();
}

export class Task2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task2(address);
    }

    static createFromConfig(config: Task2Config, code: Cell, workchain = 0) {
        const data = task2ConfigToCell(config);
        const init = { code, data };
        return new Task2(contractAddress(workchain, init), init);
    }

    static solve(a: number[][], b: number[][]): number[][] {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            const row = [];
            for (let j = 0; j < b[i].length; j++) {
                let s = 0;
                for (let k = 0; k < b.length; k++) {
                    s += a[i][k] * b[k][j];
                }
                row.push(s);
            }
            result.push(row);
        }
        return result;
    }

    static serializeToTuple(arr: number[][]): Tuple {
        const matrix: Tuple[] = [];
        for (let i = 0; i < arr.length; i++) {
            const row: TupleItemInt[] = [];
            for (let j = 0; j < arr[i].length; j++) {
                row.push({type: 'int', value: BigInt(arr[i][j])});
            }
            matrix.push({type: 'tuple', items: row});
        }
        return {type: 'tuple', items: matrix};
    }

    async getResult(provider: ContractProvider, a: number[][], b: number[][]): Promise<boolean> {
        const {stack, gasUsed} = await provider.get('matrix_multiplier', [
            Task2.serializeToTuple(a), Task2.serializeToTuple(b)
        ]);

        console.log(`gas: ${gasUsed}`);

        const expected = Task2.solve(a, b);
        const result = stack.readTuple();

        for (let i = 0; i < expected.length; i++) {
            const row = result.readTuple();
            for (let j = 0; j < expected[i].length; j++) {
                const val = row.readNumber();
                if (val != expected[i][j]) {
                    return false;
                }
            }
            expect(row.remaining).toBe(0);
        }
        expect(result.remaining).toBe(0);

        return true;
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
