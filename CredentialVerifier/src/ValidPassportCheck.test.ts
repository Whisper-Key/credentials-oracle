import { ValidPassportCheck } from './ValidPassportCheck';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Signature } from 'o1js';
import dotenv from 'dotenv';
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
    oracleKey: PrivateKey,
    zkApp: ValidPassportCheck;

  beforeAll(async () => {
    if (proofsEnabled) await ValidPassportCheck.compile();
    dotenv.config()
  });

  beforeEach(() => {
    console.log(process.env.ORACLE_KEY);
    oracleKey = PrivateKey.fromBase58(process.env.ORACLE_KEY!);

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
      zkApp.initState(oracleKey.toPublicKey());
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `ValidPassportCheck` smart contract', async () => {
    await localDeploy();
    const num = zkApp.creatorPublicKey.get();
    console.log(process.env.ORACLE_KEY);
    expect(num.toBase58()).toEqual(oracleKey.toPublicKey().toBase58());
  });

  it('correctly verifies the signature on the `ValidPassportCheck` smart contract', async () => {
    await localDeploy();
    const number = Field(1234);
    const signature = Signature.create(oracleKey, [number]);

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.verify(number, senderAccount, signature);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // const updatedNum = zkApp.creatorPublicKey.get();
    // expect(updatedNum).toEqual(Field(3));
  });
});
