import dotenv from 'dotenv';
import { Readable } from 'stream'

dotenv.config();

const { BlobServiceClient } = require('@azure/storage-blob');

// Function to download and console.log the file content
async function downloadBlob(containerName: string, blobName: string) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const response = await blockBlobClient.download(0);
    const content = await streamToString(response.readableStreamBody);
    console.log(`Downloaded '${blobName}' blob content:`, content);
  } catch (error) {
    console.error(`Error downloading '${blobName}' blob:`, error);
  }
}

// Helper function to read a stream and convert it to a string
async function streamToString(readableStream: Readable): Promise<string> {
    return new Promise((resolve: (value: string) => void, reject: (reason?: any) => void) => {
      const chunks: string[] = [];
      readableStream.on('data', (data: Buffer) => {
        chunks.push(data.toString());
      });
      readableStream.on('end', () => {
        resolve(chunks.join(''));
      });
      readableStream.on('error', reject);
    });
  }

// Main function
async function main() {
  const containerName = 'example-read-container';
  const blobName = 'sample-file.csv';

  await downloadBlob(containerName, blobName);
}

main().catch((error) => {
  console.error('Error running the sample:', error.message);
});