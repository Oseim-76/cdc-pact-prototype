import { createConsumerApp } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
const app = createConsumerApp();

app.listen(PORT, () => {
  console.log(`Consumer API running on port ${PORT}`);
  console.log(`Producer URL: ${process.env.PRODUCER_URL ?? 'http://localhost:3001'}`);
});
