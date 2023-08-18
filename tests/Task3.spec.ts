import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Builder, Cell, toNano } from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
// import rs from 'random-seed';

describe('Task3', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task3');
    });

    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task3 = blockchain.openContract(Task3.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task3.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task3.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task3 are ready to use
    });

    it('empty', async() => {
        const source = new Cell();
        const expected = new Cell();

        const result = await task3.getResult(0b1, 0b11, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('short: 10->11', async() => {
        const source = new Builder()
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const expected = new Builder()
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .endCell();

        const result = await task3.getResult(0b10, 0b11, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('short: 1->111', async() => {
        const source = new Builder()
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const expected = new Builder()
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const result = await task3.getResult(0b1, 0b111, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('short: 111->1', async() => {
        const source = new Builder()
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const expected = new Builder()
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const result = await task3.getResult(0b111, 0b1, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('short: 101->111', async() => {
        const source = new Builder()
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const expected = new Builder()
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const result = await task3.getResult(0b101, 0b111, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('given: 1101110101010->1001010', async() => {
        // 1101110101010 -> 1001010
        // 11011101 -> 10

        const source = new Builder().storeUint(0b1101110101010, 13).endCell();
        const expected = new Builder().storeUint(0b1001010, 7).endCell();

        const result = await task3.getResult(0b11011101, 0b10, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('given: 101110101->111111111', async() => {
        // 1010000[1|01110101]|00011111|10000000 -> 10100001|11111111|00011111|10000000
        // [10111010|1] -> [11111111|1]

        const source = new Builder()
            .storeBuffer(Buffer.from([0b10100001, 0b01110101, 0b00011111, 0b10000000]), 4)
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([0b10100001, 0b11111111, 0b00011111, 0b10000000]), 4)
            .endCell();

        const result = await task3.getResult(0b101110101, 0b111111111, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('split: 1010->1111', async() => {
        // 10100101|01110101
        // 11110111|11111111

        const source = new Builder()
            .storeBuffer(Buffer.from([0b10100101]), 1)
            .storeRef(new Builder()
                .storeBuffer(Buffer.from([0b01110101]), 1))
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([0b11110111, 0b11111111]), 2)
            .endCell();

        const result = await task3.getResult(0b1010, 0b1111, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('split: 1->11', async() => {
        // 11111111|11111111 x 11111111|11111111
        // x2

        const source = new Builder()
            .storeBuffer(Buffer.from([0b11111111, 0b11111111]), 2)
            .storeRef(new Builder()
                .storeBuffer(Buffer.from([0b11111111, 0b11111111]), 2))
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([0b11111111, 0b11111111, 0b11111111, 0b11111111]), 4)
            .endCell();

        const result = await task3.getResult(0b1010, 0b1111, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('S: value bigger then first cell', async() => {
        //  11111111|11111111|01111111 -> 11111101|111111
        // [11111111|111]->1

        const source = new Builder()
            .storeBuffer(Buffer.from([0b11111111]), 1)
            .storeRef(new Builder()
                .storeBuffer(Buffer.from([0b11111111, 0b01111111]), 2))
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([0b11111101]), 1)
            .storeUint(63, 6)
            .endCell();

        const result = await task3.getResult(0b11111111111, 0b1, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('S: full cells 16 bytes', async() => {
        //  11111111|11111111|01111111 -> 11111101|111111
        // [11111111|10]->1

        const source = new Builder()
            .storeBuffer(Buffer.from([
                0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111
            ]), 16)
            .storeRef(new Builder()
                .storeBuffer(Buffer.from([
                    0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111
                ]), 16))
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([
                0b10101010, 0b10101010, 0b10101010, 0b10101010,
                0b10101010, 0b10101010, 0b10101010, 0b10101010
            ]), 8)
            .endCell();

        const result = await task3.getResult(0b11111111, 0b10, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('S: small expand', async() => {
        const source = new Builder()
            .storeBuffer(Buffer.from([0b00011111]), 1)
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([0b00010110]), 1)
            .storeUint(0b11, 2)
            .endCell();

        const result = await task3.getResult(0b11, 0b101, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('S: ends with zero', async() => {
        const source = new Builder()
            .storeUint(0b1010, 4)
            .storeUint(0, 8)
            .storeUint(1, 1)
            .endCell();

        const expected = new Builder()
            .storeUint(0b11111111, 8)
            .storeUint(0b00000000, 8)
            .storeUint(1, 1)
            .endCell();

        const result = await task3.getResult(0b10, 0b1111, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('S: 2 cells expand', async() => {
        const source = new Builder()
            .storeBuffer(Buffer.from([
                0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111
            ]), 9)
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110,
                0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111, 0b11111110, 0b11111111,
            ]), 127)
            .storeUint(0b1111111, 7)
            .storeRef(new Builder()
                .storeBuffer(Buffer.from([
                    0b01111111, 0b11111111, 0b01111111, 0b11111111, 0b01111111, 0b11111111, 0b01111111, 0b11111111,
                    0b01111111, 0b11111111, 0b01111111, 0b11111111, 0b01111111, 0b11111111, 0b01111111, 0b11111111,
                ]))
                .storeUint(0b0, 1)
            )
            .endCell();

        const result = await task3.getResult(0b1, 0b1111111111111110, source);
        expect(result.equals(expected)).toBe(true);
    });

    it('S: huge expand', async() => {
        const source = new Builder()
            .storeBuffer(Buffer.from([
                0b10011010, 0b10011010, 0b10011010, 0b10011010, 0b10011010, 0b10011010, 0b10011010, 0b10011010,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
            ]), 127)
            .storeUint(0, 7)
            .endCell();

        const expected = new Builder()
            .storeBuffer(Buffer.from([
                0b11111010, 0b11111111, 0b11111111, 0b11111111, 0b01111110, 0b10111111, 0b11111111, 0b11111111,
                0b11111110, 0b10111111, 0b11111111, 0b11111111, 0b11111110, 0b10111111, 0b11111111, 0b11111111,
                0b11011111, 0b10101111, 0b11111111, 0b11111111, 0b11111111, 0b10101111, 0b11111111, 0b11111111,
                0b11111111, 0b10101111, 0b11111111, 0b11111111, 0b11110111, 0b11101011, 0b11111111, 0b11111111,
                0b11111111, 0b11101011, 0b11111111, 0b11111111, 0b11111111, 0b11101011, 0b11111111, 0b11111111,
                0b11111101, 0b11111010, 0b11111111, 0b11111111, 0b11111111, 0b11111010, 0b11111111, 0b11111111,
                0b11111111, 0b11111010, 0b11111111, 0b11111111, 0b11111111, 0b01111110, 0b10111111, 0b11111111,
                0b11111111, 0b11111110, 0b10111111, 0b11111111, 0b11111111, 0b11111110, 0b10111111, 0b11111111,
                0b11111111, 0b11011111, 0b10101111, 0b11111111, 0b11111111, 0b11111111, 0b10101111, 0b11111111,
                0b11111111, 0b11111111, 0b10101111, 0b11111111, 0b11111111, 0b11110111, 0b11101011, 0b11111111,
                0b11111111, 0b11111111, 0b11101011, 0b11111111, 0b11111111, 0b11111111, 0b11101011, 0b11111111,
                0b11111111, 0b11111101, 0b11111010, 0b11111111, 0b11111111, 0b11111111, 0b11111010, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111
            ]), 127)
            .storeUint(0b1111111, 7)
            .storeRef(new Builder()
                .storeBuffer(Buffer.from([
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111, 0b11111111,
                    0b11111111, 0b11111010, 0b11111111, 0b11111111, 0b11111111
                ]), 93)
                .storeUint(0b000000, 6)
            )
            .endCell();

        const result = await task3.getResult(0b10, 0b11111010111111111111111111111111, source);
        expect(result.equals(expected)).toBe(true);
    });

    // it('S: generator', async() => {
    //     const randomizer = rs.create("asdfbjsf");
    //
    //     while (true) {
    //         let flen = randomizer.intBetween(1, 52);
    //         let flag = '1';
    //         for (let i = 0; i < flen - 1; i++) {
    //             flag += randomizer.intBetween(0, 1) > 0 ? '1' : '0';
    //         }
    //
    //         let fval = randomizer.intBetween(1, 52);
    //         let val = '1';
    //         for (let i = 0; i < fval; i++) {
    //             val += randomizer.intBetween(0, 1) > 0 ? '1' : '0';
    //         }
    //
    //         let content = '';
    //         for (let i = 0; i < randomizer.intBetween(10, 10000); i++) {
    //             if (randomizer.intBetween(0, 100) > 10) {
    //                 content += randomizer.intBetween(0, 1) > 0 ? '1' : '0';
    //             } else {
    //                 content += flag;
    //             }
    //         }
    //
    //         // const flag = "1010011011100011000010110001010011111001110001101001011100";
    //         // const val = "11010000001100100";
    //         // const content = '1101001101110001100001011000101001111100111000110100101110010111010011011100011000010110001010011111001110001101001011100010011001110101100011001010100110111000110000101100010100111110011100011010010111001110110100110111000110000101100010100111110011100011010010111001000101001101110001100001011000101001111100111000110100101110000110010101010011011100011000010110001010011111001110001101001011100010000111010110100110111000110000101100010100111110011100011010010111001010000110100110111000110000101100010100111110011100011010010111001000010000101100001111101001101110001100001011000101001111100111000110100101110010100110111000110000101100010100111110011100011010010111001010100110111000110000101100010100111110011100011010010111000100101000010101001101110001100001011000101001111100111000110100101110010110101001101110001100001011000101001111100111000110100101110001010011011100011000010110001010011111001110001101001011100101010011011100011000010110001010011111001110001101001011100110110011010100110111000110000101100010100111110011100011010010111000000010010101001101110001100001011000101001111100111000110100101110000';
    //
    //         const source = Task3.fromString(content);
    //         const expected = Task3.fromString(content.replaceAll(flag, val));
    //
    //         try {
    //             var result = await task3.getResult(parseInt(flag, 2), parseInt(val, 2), source);
    //         } catch(e) {
    //             console.log(`flag: ${flag}`);
    //             console.log(`flag2: ${parseInt(flag, 2)}`);
    //             console.log(`val: ${val}`);
    //             console.log(`val2: ${parseInt(val, 2)}`);
    //             console.log(`content: ${content}`);
    //             throw e;
    //         }
    //
    //         if (result.equals(expected)) {
    //             // console.log("OK");
    //         } else {
    //             console.log(`flag: ${flag}`);
    //             console.log(`flag2: ${parseInt(flag, 2)}`);
    //             console.log(`val: ${val}`);
    //             console.log(`val2: ${parseInt(val, 2)}`);
    //             console.log(`content: ${content}`);
    //
    //             // 101100110110100111011111000001010010000100010010011100000
    //             // 101100110110100111011111000001010010000100010010011100111
    //
    //             console.log(Task3.readCellData(expected));
    //             console.log(Task3.readCellData(result));
    //             break;
    //         }
    //     }
    //
    //     // const source = Task3.fromString("10101010101010");
    //     // const expected = Task3.fromString("1111111");
    //     //
    //     // const result = await task3.getResult(0b10, 0b1, source);
    //     // expect(result.equals(expected)).toBe(true);
    // });

    /* fail cases */

    it('F: short: 1->11', async() => {
        const source = new Builder()
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(0)
            .endCell();

        const expected = new Builder()
            .storeBit(1)
            .storeBit(1)
            .storeBit(0)
            .storeBit(1)
            .storeBit(1)
            .endCell();

        const result = await task3.getResult(0b1, 0b11, source);
        expect(result.equals(expected)).toBe(false);
    });
});
