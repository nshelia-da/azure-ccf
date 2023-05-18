"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('Hello world!', process.env.AZURE_STORAGE_CONNECTION_STRING);
const { BlobServiceClient } = require('@azure/storage-blob');
// Function to download and console.log the file content
function downloadBlob(containerName, blobName) {
    return __awaiter(this, void 0, void 0, function* () {
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        try {
            const response = yield blockBlobClient.download(0);
            const content = yield streamToString(response.readableStreamBody);
            console.log(`Downloaded '${blobName}' blob content:`, content);
        }
        catch (error) {
            console.error(`Error downloading '${blobName}' blob:`, error);
        }
    });
}
// Helper function to read a stream and convert it to a string
function streamToString(readableStream) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on('data', (data) => {
                chunks.push(data.toString());
            });
            readableStream.on('end', () => {
                resolve(chunks.join(''));
            });
            readableStream.on('error', reject);
        });
    });
}
// Main function
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const containerName = 'example-read-container';
        const blobName = 'sample-file.csv';
        yield downloadBlob(containerName, blobName);
    });
}
main().catch((error) => {
    console.error('Error running the sample:', error.message);
});
