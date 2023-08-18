import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Task5 } from '../wrappers/Task5';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task5', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task5');
    });

    let blockchain: Blockchain;
    let task5: SandboxContract<Task5>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task5 = blockchain.openContract(Task5.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task5.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task5.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task5 are ready to use
    });

    // n is fixed

    it('n=0, k=0', async() => {
        const result = await task5.getResult(0, 0);
        expect(result).toBeDefined();
    });

    it('n=0, k=1', async() => {
        const result = await task5.getResult(0, 1);
        expect(result).toBeDefined();
    });

    it('n=0, k=2', async() => {
        const result = await task5.getResult(0, 2);
        expect(result).toBeDefined();
    });

    // k is fixed

    it('n=0, k=10', async() => {
        const result = await task5.getResult(0, 10);
        expect(result).toBeDefined();
    });

    it('n=1, k=10', async() => {
        const result = await task5.getResult(1, 10);
        expect(result).toBeDefined();
    });

    it('n=2, k=10', async() => {
        const result = await task5.getResult(1, 10);
        expect(result).toBeDefined();
    });

    // others

    it('n=150, k=0', async() => {
        const result = await task5.getResult(150, 0);
        expect(result).toBeDefined();
    });

    it('n=10, k=15', async() => {
        const result = await task5.getResult(10, 15);
        expect(result[0]).toBe(55n);
        expect(result[1]).toBe(89n);
    });

    it('n=1, k=3', async() => {
        const result = await task5.getResult(1, 3);
        expect(result).toStrictEqual([1n, 1n, 2n]);
    });

    it('n=201, k=4', async() => {
        const result = await task5.getResult(201, 4);
        expect(result).toStrictEqual([
            453973694165307953197296969697410619233826n,
            734544867157818093234908902110449296423351n,
            1188518561323126046432205871807859915657177n,
            1923063428480944139667114773918309212080528n
        ]);
    });

    // overflow tests

    it('n=116, k=255', async() => {
        const result = await task5.getResult(116, 255);
        expect(result[0]).toBe(781774079430987230203437n);
        expect(result[result.length - 1]).toBe(94611056096305838013295371573764256526437182762229865607320618320601813254535n);
    });

    it('n=369, k=2', async() => {
        const result = await task5.getResult(369, 2);
        expect(result[0]).toBe(58472848379039952684853851736901133239741266891456844557261755914039063645794n);
        expect(result[1]).toBe(94611056096305838013295371573764256526437182762229865607320618320601813254535n);
    });

    it('n=370, k=1', async() => {
        const result = await task5.getResult(370, 1);
        expect(result[0]).toBe(94611056096305838013295371573764256526437182762229865607320618320601813254535n);
    });

    it('n=X, k=50', async() => {
        const k = 50;
        for (let n = 0; n < 371 - k; n++) {
            await task5.getResult(n, k);
        }
    });
});
