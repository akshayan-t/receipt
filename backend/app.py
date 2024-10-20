from flask import Flask, jsonify
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import os
import base64
import re
from datetime import datetime
import pdfplumber
import unidecode

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def authenticate_gmail():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES,
                redirect_uri='http://localhost:5001/'
            )
            creds = flow.run_local_server(port=5002)
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
    service = build('gmail', 'v1', credentials=creds)
    return service

def decode_base64(encoded_data):
    decoded_bytes = base64.urlsafe_b64decode(encoded_data)
    return decoded_bytes.decode('utf-8')

def extract_sender_info(headers, snippet):
    sender_name = None
    sender_email = None
    for header in headers:
        if header['name'].lower() == 'from':
            sender_info = header['value']
            if "<" in sender_info and ">" in sender_info:
                sender_name = sender_info.split("<")[0].strip()
                sender_email = sender_info.split("<")[1].replace(">", "").strip()
            else:
                sender_email = sender_info.strip()

    if sender_name is None:
        at_match = re.search(r'at\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)', snippet)
        if at_match:
            sender_name = at_match.group(1).strip()

    return sender_name, sender_email

def extract_text_from_pdf(pdf_data):
    with open('temp.pdf', 'wb') as temp_pdf:
        temp_pdf.write(base64.urlsafe_b64decode(pdf_data))
    with pdfplumber.open('temp.pdf') as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
    os.remove('temp.pdf')
    return text

def extract_total_from_text(text):
    total_regex = r"\b(total|paid|total net|total\(cad\)|total \(cad\)|total\(usd\)|total \(usd\)|totalcad|totalusd|total cad|total usd)\b[\s:]*[$]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2}))"
    matches = re.finditer(total_regex, text, re.IGNORECASE)

    for match in matches:
        amount = match.group(2)
        if amount:
            return amount
    
    return None

@app.route('/api/receipts', methods=['GET'])
def get_receipts():
    service = authenticate_gmail()
    
    query = 'subject:receipt'
    results = service.users().messages().list(userId='me', q=query).execute()
    messages = results.get('messages', [])
    
    receipt_keywords = ['total', 'amount paid', 'transaction id', 'order id']
    receipts = []

    if messages:
        for msg in messages:
            email = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            email_data = email.get('payload', {}).get('body', {}).get('data', '')
            headers = email.get('payload', {}).get('headers', [])
            snippet = email.get('snippet', '')
            date_str = next(header['value'] for header in headers if header['name'].lower() == 'date')
            
            try:
                date_obj = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %z')
                formatted_date = date_obj.strftime('%d %b %Y')
            except ValueError:
                formatted_date = date_str

            sender_name, sender_email = extract_sender_info(headers, snippet)

            total_amount = None
            if not email_data:
                for part in email['payload'].get('parts', []):
                    if part['mimeType'] == 'text/plain':
                        email_data = part['body'].get('data', '')
                    if part['filename'] and part['mimeType'] == 'application/pdf' and 'attachmentId' in part['body']:
                        attachment = service.users().messages().attachments().get(
                            userId='me', messageId=msg['id'], id=part['body']['attachmentId']).execute()
                        pdf_text = extract_text_from_pdf(attachment['data'])
                        total_amount = extract_total_from_text(pdf_text)

            if email_data:
                email_content = decode_base64(email_data)
                if not total_amount:
                    total_amount = extract_total_from_text(email_content)

            is_receipt = any(keyword.lower() in snippet.lower() for keyword in receipt_keywords)

            if is_receipt or 'receipt' in snippet.lower():
                receipts.append({
                    "date": formatted_date, 
                    "sender_name": sender_name,
                    "sender_email": sender_email,
                    "receipt_link": f"https://mail.google.com/mail/u/0/#inbox/{msg['id']}",
                    "snippet": snippet,
                    "total": total_amount if total_amount else "N/A"
                })
    
    receipts = [receipt for receipt in receipts if receipt['total'] != "N/A"]

    print(f"Returning {len(receipts)} receipts")
    return jsonify(receipts)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
