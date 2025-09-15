import app from './app';

const port = Number(process.env.PORT) || 3008;

app.listen(port, '0.0.0.0', () => {
  console.log(`API Gateway is running on http://0.0.0.0:${port} (IPv4)`);
});
