import express, { Request, Response } from 'express';
import cors from 'cors';
import { CredentialRepository, SignedCredential } from 'contract-is-key';
import { PrivateKey, PublicKey } from 'o1js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 3001; // Set your desired port

// Middleware
app.use(cors());

app.get('/api/credentials', async (req: Request, res: Response) => {
  const repo = await new CredentialRepository();
  const credentials = await repo.GetAllCredentials();
  const projection = credentials.map(c => ({ name: c.name, owner: c.owner, description: c.description, contractPublicKey: c.contractPublicKey }));
  res.send(projection);
});

app.get('/api/:credential/:owner', async (req: Request, res: Response) => {

    // temp hack to get specific contract
    req.params.credential = "ChromeCredential";
  const repo = await new CredentialRepository();
  const metadata = await repo.GetCredentialByName(req.params.credential);
  const privateKey = process.env.ORACLE_KEY!;
  console.log("private key", privateKey);
  const signedCredential = new SignedCredential(metadata, privateKey);

  const credentialStore = await repo.GetCredentialStore(req.params.credential);
  const credential = await credentialStore.get(req.params.owner);
  console.log("credential", credential);
  if (!credential) {
    res.status(404).send(`Credential not found for ${req.params.owner}`);
    return;
  } else {

    const zkAppAddress = PublicKey.fromBase58(metadata.contractPublicKey);
    const proofsEnabled = false;
    const path = `../public/credentials/${req.params.credential}Contract.js`

    const { CredentialProxy } = await import(/* webpackIgnore: true */path);
    console.log("Dyanmic proxy loaded");
    console.log("path:", path);
    const proxy = new CredentialProxy(zkAppAddress, req.params.credential, req.params.owner, proofsEnabled);
    const entity = await proxy.getEntityFromObject(credential);
    const signed = signedCredential.sign(entity);
    res.send(signed);
  }
});


// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Oops... Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
