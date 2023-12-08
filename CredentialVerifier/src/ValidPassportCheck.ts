import { Field, SmartContract, state, State, method, PublicKey, CircuitString, Signature } from 'o1js';

export class ValidPassportCheck extends SmartContract {
   @state(PublicKey) creatorPublicKey = State<PublicKey>();

  init() {
    super.init();
    // set creator public key
    this.requireSignature();
  }

  @method verify(passportNumber: Field, owner: PublicKey, signature: Signature) {
    const creator = this.creatorPublicKey.getAndAssertEquals();
    // determine how to verify the signature
    const validSignature = signature.verify(creator, [passportNumber]);
    validSignature.assertTrue();
    // verify expiry date
  }
}
