import json
import azure.functions as func
import json
from azure.storage.blob import BlobServiceClient
import logging
import os


def main(myTimer: func.TimerRequest, outputQueueItem: func.Out[str]) -> None:
    logging.info('Python timer trigger function started.')
    # Create a blob service client
    blob_storage_connection_string = os.environ["samplecloudfoodprint_STORAGE"]
    queue_name = os.environ["queue_name"]

    blob_service_client = BlobServiceClient.from_connection_string(blob_storage_connection_string)

    # Get a reference to the container
    container_client = blob_service_client.get_container_client(queue_name)

    # List all the blobs in the container
    blob_list = container_client.list_blobs()

    # Prepare the array of filenames
    filenames = [blob.name for blob in blob_list]
    logging.info(filenames)
    # Compose the message to be sent to the queue
    message = {
        "header": {
            "messageType": "newManifest",
            "keys": filenames
        }
    }
    logging.info(json.dumps(message))
    # Output the message to the queue
    outputQueueItem.set(json.dumps(message))
    logging.info("Successfully sent message to queue.")
