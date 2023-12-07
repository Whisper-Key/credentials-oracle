import { Field, SmartContract, state, State, method, PublicKey, CircuitString, Signature } from 'o1js';

/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */
export class ValidPassportCheck extends SmartContract {
   @state(PublicKey) creatorPublicKey = State<PublicKey>();

  init() {
    super.init();
    // set creator public key
    this.requireSignature();
  }

  @method verify(passportNumber: CircuitString, expiryDate: CircuitString, owner: PublicKey, signature: Signature) {
    const creator = this.creatorPublicKey.getAndAssertEquals();
    // determine how to verify the signature
    const validSignature = signature.verify(creator, passportNumber.toFields());
    validSignature.assertTrue();
    // verify expiry date
    
  }
}
