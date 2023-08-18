import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import {Builder, Cell, toNano} from 'ton-core';
import { Task4 } from '../wrappers/Task4';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task4', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task4');
    });

    let blockchain: Blockchain;
    let task4: SandboxContract<Task4>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4 = blockchain.openContract(Task4.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4 are ready to use
    });

    it('shift=0', async () => {
        const c = Task4.createTextCell("success");

        const encoded = await task4.getEncoded(c, 0);
        expect(c.equals(encoded)).toBe(true);
    });

    it('shift=0 + no real text', async () => {
        const c = Task4.createTextCell("#123#212#321#");

        const encoded = await task4.getEncoded(c, 0);
        expect(c.equals(encoded)).toBe(true);
    });

    it('empty', async () => {
        const c = (new Builder()).storeUint(0, 32).endCell();

        const result = await task4.getEncoded(c, 12);
        expect(c.equals(result)).toBe(true);
    });

    it('enc->dec', async () => {
        const c = Task4.createTextCell('success');
        const c2 = Task4.createTextCell('zbjjlzz');

        const encoded = await task4.getEncoded(c, 7);
        const decoded = await task4.getDecoded(encoded, 7);

        expect(c2.equals(encoded)).toBe(true);
        expect(c.equals(decoded)).toBe(true);
    });

    it('large enc->dec', async() => {
        const rawText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, ' +
            'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ' +
            'nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in ' +
            'reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ' +
            'pariatur. Excepteur sint occaecat cupidatat non proident, sunt in ' +
            'culpa qui officia deserunt mollit anim id est laborum.';

        const encodedText = 'Svylt pwzbt kvsvy zpa htla, jvuzljalaby hkpwpzjpun lspa, ' +
            'zlk kv lpbztvk altwvy pujpkpkbua ba shivyl la kvsvyl thnuh hspxbh. ' +
            'Ba lupt hk tpupt clupht, xbpz uvzaybk lelyjpahapvu bsshtjv shivypz ' +
            'upzp ba hspxbpw le lh jvttvkv jvuzlxbha. Kbpz hbal pybyl kvsvy pu ' +
            'ylwyloluklypa pu cvsbwahal clspa lzzl jpssbt kvsvyl lb mbnpha ubssh ' +
            'whyphaby. Lejlwalby zpua vjjhljha jbwpkhaha uvu wyvpklua, zbua pu ' +
            'jbswh xbp vmmpjph klzlybua tvsspa hupt pk lza shivybt.';

        const c = Task4.createTextCell(rawText);
        const c2 = Task4.createTextCell(encodedText);

        const encoded = await task4.getEncoded(c, 33);
        const decoded = await task4.getDecoded(encoded, 33);

        expect(c2.equals(encoded)).toBe(true);
        expect(c.equals(decoded)).toBe(true);
    });
});
