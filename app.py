from flask import Flask, jsonify
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import os
import base64
import re
import time
import pdfkit
from fpdf import FPDF
import unidecode
import pdfplumber
from datetime import datetime

app = Flask(__name__)
CORS(app)

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

def save_pdf_attachment(attachment_data, filename):
    file_data = base64.urlsafe_b64decode(attachment_data)
    with open(filename, 'wb') as f:
        f.write(file_data)
    print(f"PDF attachment saved as {filename}")

def extract_text_from_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
    return text

def save_email_as_pdf(email_content, filename, message_id=None):
    unique_filename = filename
    if message_id:
        unique_filename = f"{filename.replace('.pdf', '')}_{message_id}.pdf"
    else:
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        unique_filename = f"{filename.replace('.pdf', '')}_{timestamp}.pdf"
    
    if '<html' in email_content.lower():
        pdfkit.from_string(email_content, unique_filename)
        print(f"Email content (HTML) saved as PDF: {unique_filename}")
    return unique_filename

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
    pdf_files_to_delete = []  

    if messages:
        for msg in messages:
            email = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
            email_content = None
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

            has_pdf_attachment = False
            total_amount = None

            if not email_data:
                for part in email['payload'].get('parts', []):
                    if part['mimeType'] == 'text/plain':
                        email_data = part['body'].get('data', '')
                    if part['filename'] and part['mimeType'] == 'application/pdf' and 'attachmentId' in part['body']:
                        attachment = service.users().messages().attachments().get(
                            userId='me', messageId=msg['id'], id=part['body']['attachmentId']).execute()
                        pdf_filename = f"{msg['id']}_ATT.pdf"
                        save_pdf_attachment(attachment['data'], pdf_filename)
                        pdf_text = extract_text_from_pdf(pdf_filename)  
                        total_amount = extract_total_from_text(pdf_text)  
                        has_pdf_attachment = True
                        if total_amount is None:
                            pdf_files_to_delete.append(pdf_filename)  

            if email_data:
                email_content = decode_base64(email_data)
                if not total_amount:  
                    total_amount = extract_total_from_text(email_content)
                    if total_amount is None:
                        pdf_files_to_delete.append(f"{msg['id']}.pdf")  
            else:
                email_content = "No readable content found."

            is_receipt = any(keyword.lower() in email_content.lower() for keyword in receipt_keywords)

            if is_receipt or 'receipt' in email['snippet'].lower() or has_pdf_attachment:
                if email_content != "No readable content found." and '<html' in email_content.lower():
                    email_pdf_filename = save_email_as_pdf(email_content, f"{msg['id']}.pdf", message_id=msg['id'])
                    if total_amount is None:
                        pdf_files_to_delete.append(email_pdf_filename)  

                receipts.append({
                    "date": formatted_date, 
                    "has_pdf": has_pdf_attachment,
                    "receipt_link": f"https://mail.google.com/mail/u/0/#inbox/{msg['id']}",
                    "sender_name": sender_name,
                    "sender_email": sender_email,
                    "snippet": snippet,
                    "total": total_amount if total_amount else "N/A"
                })
    
    receipts = [receipt for receipt in receipts if receipt['total'] != "N/A"]

    for pdf_file in pdf_files_to_delete:
        if os.path.exists(pdf_file):
            os.remove(pdf_file)
            print(f"Deleted PDF: {pdf_file}")

    return jsonify(receipts)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
