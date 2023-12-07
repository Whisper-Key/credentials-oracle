import express, { Request, Response } from 'express';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 3001; // Set your desired port

// Middleware
app.use(cors());

app.get('/api/credentials', (req: Request, res: Response) => {
  res.send([{ id: 1, name: 'Passport', creator: 'B62qrZhVxxpGGTjWXntrDh5qCC3kboUQ1zjnayYLppMZZ4vfdX8F3x5' }, 
  { id: 2, name: 'DriversPermit', creator: 'B62qrZhVxxpGGTjWXntrDh5qCC3kboUQ1zjnayYLppMZZ4vfdX8F3x5' }
]);
});

app.get('/api/:credential/:owner', (req: Request, res: Response) => {
  res.send({ 
    credential: req.params.credential,
    owner: req.params.owner
  });
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
