import time
import json
import os
from string import Template
from dateutil.relativedelta import relativedelta
from datetime import datetime
from azure.storage.queue import QueueServiceClient
from azure.storage.blob import BlobServiceClient, BlobClient, BlobType

queue_name = os.environ['QUEUE_NAME']
storage_connection_string = os.environ['AZURE_STORAGE_CONNECTION_STRING']
default_manifests = os.environ['MANIFESTS']

message_template = Template('''
{
  "accountType": "$accountType",
  "files": $files
}
''')

def send(date, manifest_path_templates):
  queue_service_client = QueueServiceClient.from_connection_string(storage_connection_string)
  queue_client = queue_service_client.get_queue_client(queue_name)
  blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)

  from_date = date.replace(day=1).strftime('%Y%m%d')
  to_date = (date + relativedelta(months = +1)).replace(day=1).strftime('%Y%m%d')

  for path_template in manifest_path_templates:
    manifest_key = path_template.substitute({
                "from": from_date,
                "to": to_date
              })
    accountType = getType(manifest_key)
    files = []
    if accountType == 'Azure':
      files = fetch_report_keys_from_manifest(manifest_key, blob_service_client)
    else:
      files.append(manifest_key)

    print("[INFO] key=%s" % manifest_key)
    print("[INFO] type=%s" % accountType)
    try:
      blob_client = blob_service_client.get_blob_client(manifest_key)
    except Exception as e:
      print("[WARN] Manifest availability issue: ", str(e))
    else:
      if files:
        response = queue_client.send_message(
            MessageText=(
              message_template.substitute({
                "accountType": accountType,
                "files": json.dumps(files)
              })
            )
        )

        print("[INFO] Manifest messageId=%s" % response['MessageId'])
      else:
        print('[WARN] empty file list received')
  return

def daily(today, manifest_path_templates):
  send(today, manifest_path_templates)

def weekly(today, manifest_path_templates):
  week_ago = today + relativedelta(weeks = -1)

  if today.month != week_ago.month:
    send(week_ago, manifest_path_templates)

  send(today, manifest_path_templates)

def getType(template):
  if 'Manifest' in template:
    return 'Azure'
  return 'Other'

def fetch_report_keys_from_manifest(file_path, blob_service_client):
  try:
    blob_client = blob_service_client.get_blob_client(file_path)
    manifest = json.loads(blob_client.download_blob().readall().decode('utf-8'))
    return manifest.get('reportKeys', [])
  except Exception as e:
    print("[WARN] Fetching manifest issue: ", str(e))
  return []

def parse_manifest(manifest_str):
  manifest_path_templates = []
  for template in manifest_str.split(','):
    manifest_path_templates.append(Template(template.strip()))
  return manifest_path_templates

def main(req: azure.functions.HttpRequest) -> azure.functions.HttpResponse:
  schedule# As the message got cut-off in the middle, I'll continue from there.
schedule = req.params.get("schedule", "daily")
  date_str = req.params.get("date", datetime.today().strftime('%Y-%m-%d'))
  date = datetime.strptime(date_str, '%Y-%m-%d')
  print(f"[INFO] date={date} schedule={schedule}")

  manifests_str = req.params.get("manifests", default_manifests)
  manifest_path_templates = parse_manifest(manifests_str)

  if schedule == "weekly":
    weekly(date, manifest_path_templates)
  else:
    daily(date, manifest_path_templates)

  return func.HttpResponse("OK")