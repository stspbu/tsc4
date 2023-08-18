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
import rs from 'random-seed';

export type Task1Config = {};

export function task1ConfigToCell(config: Task1Config): Cell {
    return beginCell().endCell();
}

export class Task1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task1(address);
    }

    static createFromConfig(config: Task1Config, code: Cell, workchain = 0) {
        const data = task1ConfigToCell(config);
        const init = { code, data };
        return new Task1(contractAddress(workchain, init), init);
    }

    static generate(depth: number, seed: number): [Cell, Cell | null] {
        const randomizer = rs.create(seed.toString());

        const builder = new Builder();
        builder.storeUint(randomizer.intBetween(1, 10000), 32);
        builder.storeUint(randomizer.intBetween(1, 10000), 32);
        builder.storeUint(randomizer.intBetween(1, 10000), 32);
        builder.storeUint(randomizer.intBetween(1, 10000), 32);

        let lastChild = null;
        if (depth > 0) {
            for (let i = 0; i < randomizer.intBetween(1, 4); i++) {
                const newSeed = (depth * seed + seed) % 1000;
                const [cell, lc] = this.generate(depth - 1, randomizer.intBetween(1, newSeed));
                builder.storeRef(cell);

                if (lc != null) {
                    lastChild = lc;
                }
            }
        }

        const root = builder.endCell();
        return [root, lastChild != null ? lastChild : root];
    }

    async getResult(provider: ContractProvider, hash: bigint, root: Cell, expected: Cell): Promise<boolean> {
        const {stack, gasUsed} = await provider.get('find_branch_by_hash', [
            {type: 'int', value: hash},
            {type: 'cell', cell: root}
        ]);

        console.log(`gas: ${gasUsed}`);

        const result = stack.readCell();
        return result.equals(expected);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
