import { Field, SmartContract, state, State, method, PublicKey, CircuitString, Signature, PrivateKey } from 'o1js';


export class ValidPassportCheck extends SmartContract {
   @state(PublicKey) creatorPublicKey = State<PublicKey>();

  init() {
    super.init();
    this.requireSignature();
  }

  
  @method initState(oracleKey: PublicKey) {
    this.creatorPublicKey.set(oracleKey);
  }

  @method verify(passportNumber: Field, owner: PublicKey, signature: Signature) {
    const creator = this.creatorPublicKey.getAndAssertEquals();
    // determine how to verify the signature
    const validSignature = signature.verify(creator, [passportNumber]);
    validSignature.assertTrue();
    // verify expiry date
  }
  @method verifyComplex(passportNumber: Field, expiryDate: CircuitString, owner: PublicKey, signature: Signature) {
    const creator = this.creatorPublicKey.getAndAssertEquals();
    // determine how to verify the signature
    const validSignature = signature.verify(creator, [passportNumber].concat(expiryDate.toFields()).concat(owner.toFields()));
    validSignature.assertTrue();
    // verify expiry date
  }
}
