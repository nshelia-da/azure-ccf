import dotenv from 'dotenv';
import { Readable } from 'stream'
const { QueueServiceClient } = require("@azure/storage-queue");

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
    return content;
  } catch (error) {
    console.error(`Error downloading '${blobName}' blob:`, error);
  }
}



// Function to upload the content to another container
async function uploadBlob(containerName: string, blobName: string, content: string) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.upload(content, Buffer.byteLength(content));
    console.log(`Uploaded '${blobName}' blob to '${containerName}' container.`);
  } catch (error) {
    console.error(`Error uploading '${blobName}' blob:`, error);
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
  const sourceContainerName = 'example-read-container';
  const destinationContainerName = 'example-write-container';
  const blobName = 'sample-file.csv';

  const content:any = await downloadBlob(sourceContainerName, blobName);
  await uploadBlob(destinationContainerName, blobName, content);
}

// main().catch((error) => {
//   console.error('Error running the sample:', error.message);
// });


const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"]; // replace with your Connection String
const queueName = "example-queue"; // replace with your Queue name
async function listenQueue() {
  const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
  const queueClient = queueServiceClient.getQueueClient(queueName);

  const receiveResponse = await queueClient.receiveMessages();
  
  if (receiveResponse.receivedMessageItems.length == 1) {
    const receivedMessageItem = receiveResponse.receivedMessageItems[0];
    console.log(receivedMessageItem)
    console.log(`Read message with content: ${Buffer.from(receivedMessageItem.messageText, 'base64')}`);
  }
}

listenQueue().catch((err) => {
  console.error("Error running sample:", err.message);
});