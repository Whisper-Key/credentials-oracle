import express, { Request, Response } from 'express';
import cors from 'cors';
import { CredentialRepository } from 'contract-is-key';
const app = express();
const port = process.env.PORT || 3001; // Set your desired port

// Middleware
app.use(cors());

app.get('/api/credentials', async (req: Request, res: Response) => {
  const repo =  await new CredentialRepository();
  const credentials = await repo.GetAllCredentials();
  const projection = credentials.map(c => ({ name: c.name, owner: c.owner, description: c.description, contractPublicKey: c.contractPublicKey }));
  res.send(projection);
});

app.get('/api/:credential/:owner', async (req: Request, res: Response) => {

  const repo =  await new CredentialRepository();
  const credentialStore = await repo.GetCredentialStore(req.params.credential);
  const credential = await credentialStore.get(req.params.owner);

  res.send(credential);
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
