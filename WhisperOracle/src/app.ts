import express from 'express';
import bodyParser from 'body-parser'
import { credsRouter } from './routes/credentialsRoute.js';
import { messagingRouter } from './routes/messagingRoute.js';
import { credsStatsRouter } from './routes/credentialStatsRoute.js';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CircuitString, Field, MerkleMap, Mina, PrivateKey, PublicKey, UInt32, fetchAccount } from 'o1js';
import swaggerUi from 'swagger-ui-express';
import specs from './config/swaggerConfig.js'; // Import the generated Swagger specs
import { CredentialRepository, SignedCredential } from 'contract-is-key';
import { EventNotification } from './models/EventNotification.js';
import { EventPolling } from './models/EventPolling.js';
import { checkDeploymentStatus } from './controllers/credentialsController.js'
import cron from 'node-cron';
import { profileRouter } from './routes/profileRoute.js';
import { BlockHeightRepository } from './models/BlockHeightRepository.js';
import { inboxRouter } from './routes/inboxRoute.js';
import { escrowRouter } from './routes/escrowRoute.js';
import { checkEscrowDeploymentStatus } from './controllers/credentialsController.js';

const app = express();
const port = process.env.PORT || 3001; // Set your desired port

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Create Credential NOTIFICATIONS 
// cron.schedule('*/5 * * * *', () => {
//   checkDeploymentStatus(new EventNotification());
// });

// Create Escrow Contract Generation Notifications
// cron.schedule('*/5 * * * *', () => {
//   checkEscrowDeploymentStatus(new EventNotification());
// });

// Issue credential NOTIFICATIONS
const polling = new EventPolling("*/10 * * * * *", new CredentialRepository(), new EventNotification(), new BlockHeightRepository());
//polling.start();

app.use('/api/credentials', credsRouter);

app.use('/api/messaging', messagingRouter);

app.use('/api/profile', profileRouter);
app.use('/api/inbox', inboxRouter);

app.use('/api/credential-stats', credsStatsRouter);

app.use('/api/escrow', escrowRouter);

app.use('/api/poll/created', async (req, res, next) => {
  checkDeploymentStatus(new EventNotification());
  res.status(200).send('checking created status');

});

app.use('/api/poll/escrow-created', async (req, res, next) => {
  checkEscrowDeploymentStatus(new EventNotification());
  res.status(200).send('checking escrow contract creation status');
});

app.use('/api/poll/issued', async (req, res, next) => {
  const polling = new EventPolling("*/10 * * * * *", new CredentialRepository(), new EventNotification(), new BlockHeightRepository());
  polling.job();
  res.status(200).send('checking issued status');

});


app.use('/api/events/:name', async (req, res, next) => {
  const name = req.params.name;
  const Berkeley = Mina.Network({
    mina: 'https://proxy.berkeley.minaexplorer.com/graphql',
    archive: 'https://archive.berkeley.minaexplorer.com/',
  });
  Mina.setActiveInstance(Berkeley);

  const repo = new CredentialRepository();
  const credMetadata = await repo.GetCredential(name);
  // const templatePath = path.resolve(`public/credentials/${name}Contract.js`);
  const templatePath = `../../public/credentials/${req.params.name}Contract.js`

  const { CredentialProxy } = await import(/* webpackIgnore: true */templatePath);
  const zkAppAddress = PublicKey.fromBase58(credMetadata!.contractPublicKey);

  console.log("credMetadata.contractPublicKey:", credMetadata!.contractPublicKey);
  const proxy = new CredentialProxy(zkAppAddress, name, PublicKey.empty, true);
  const blockHeight = UInt32.from(34964);
  const events = await proxy.fetchEvents(UInt32.from(0));
  res.send(events);

});


// Serve Swagger documentation using swagger-ui-express
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/api/scripts/:name', (req, res, next) => {
  res.type('.js');
  const templatePath = path.resolve(`public/credentials/${req.params.name}Contract.js`);
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  res.send(templateContent);
})

app.get('/api/:credential/:owner', async (req, res) => {
  // temp hack to get specific contract
  // req.params.credential = "ChromeCredential";
  try {
    const repo = await new CredentialRepository();
    const metadata = await repo.GetCredentialByName(req.params.credential);
    console.log("metadata", metadata);
    const privateKey = process.env.FEE_PAYER!;
    console.log("private key", privateKey);
    const signedCredential = new SignedCredential(metadata!, privateKey);
    const credentialStore = await repo.GetCredentialStore(req.params.credential);
    const credential = await credentialStore.get(req.params.owner);
    console.log("credential", credential);
    if (!credential) {
      res.status(404).send(`Credential not found for ${req.params.owner}`);
      return;
    } else {
      const zkAppAddress = PublicKey.fromBase58(metadata!.contractPublicKey);
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
  } catch (error) {
    res.status(500).send(`Error: ${error}`);

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
