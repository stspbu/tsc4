import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type Task5Config = {};

export function task5ConfigToCell(config: Task5Config): Cell {
    return beginCell().endCell();
}

export class Task5 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task5(address);
    }

    static createFromConfig(config: Task5Config, code: Cell, workchain = 0) {
        const data = task5ConfigToCell(config);
        const init = { code, data };
        return new Task5(contractAddress(workchain, init), init);
    }

    static fib(n: number): bigint[] {
        let a = BigInt(0), b = BigInt(1);
        const lst = [a, b];

        for (let i = 2; i <= n; i++) {
            let tmp = a;
            a = b;
            b = tmp + b;

            lst.push(b);
        }

        return lst;
    }

    async getResult(provider: ContractProvider, n: number, k: number): Promise<bigint[]> {
        const {stack, gasUsed} = await provider.get('fibonacci_sequence', [
            {type: 'int', value: BigInt(n)},
            {type: 'int', value: BigInt(k)},
        ]);

        console.log(`gas: ${gasUsed}; ${n}`);

        const lst = Task5.fib(n + k - 1).slice(n);
        const result = stack.readTuple();

        let idx = 0;
        while (result.remaining > 0) {
            const x = result.readBigNumber();
            expect(x).toBe(lst[idx]);
            ++idx;
        }

        return lst;
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
