import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const publicDirectory = fileURLToPath(new URL('./dist/', import.meta.url));
const server = createServer((request, response) => {
  handler(request, response, {
    public: publicDirectory,
    cleanUrls: true,
    directoryListing: false,
  }).catch(error => {
    console.error('Static file request failed:', error.message);
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
});

server.listen(port, '0.0.0.0', () => console.log(`Shalt listening on port ${port}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
