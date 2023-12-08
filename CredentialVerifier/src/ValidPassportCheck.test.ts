import { ValidPassportCheck } from './ValidPassportCheck';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Signature } from 'o1js';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('ValidPassportCheck', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ValidPassportCheck;

  beforeAll(async () => {
    if (proofsEnabled) await ValidPassportCheck.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new ValidPassportCheck(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `ValidPassportCheck` smart contract', async () => {
    await localDeploy();
    const num = zkApp.creatorPublicKey.get();
    expect(num).toEqual(Field(1));
  });

  it('correctly updates the num state on the `ValidPassportCheck` smart contract', async () => {
    await localDeploy();
    const number = Field(1234);
    const privateKey = PrivateKey.random();
    const signature = Signature.create(privateKey, [number]);

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.verify(number, senderAccount, signature);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.creatorPublicKey.get();
    expect(updatedNum).toEqual(Field(3));
  });
});
