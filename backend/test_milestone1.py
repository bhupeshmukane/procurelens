import requests
from pathlib import Path

# Create a fresh evaluation
eval_res = requests.post('http://127.0.0.1:8000/api/evaluations', json={
    'title': 'Global Enterprise Infrastructure RFP',
    'category': 'Cloud Infrastructure',
    'description': 'Testing Milestone 1 PDF Upload and Page Anchoring'
}).json()
eval_id = eval_res['id']
print('Created new evaluation:', eval_id)

# Upload sample PDF 1
pdf_path = Path(__file__).resolve().parent / "app" / "samples" / "generated_pdfs" / "CloudCore_Enterprise_Proposal_2024.pdf"
with open(pdf_path, 'rb') as f:
    upload_res = requests.post(
        f'http://127.0.0.1:8000/api/evaluations/{eval_id}/documents/upload',
        files={'file': ('CloudCore_Enterprise_Proposal_2024.pdf', f, 'application/pdf')},
        data={'vendor_name': 'CloudCore'}
    ).json()

print('Upload result:', upload_res)
assert upload_res['page_count'] == 3, f"Expected 3 pages, got {upload_res['page_count']}"
assert upload_res['status'] == 'parsed', f"Expected parsed, got {upload_res['status']}"

# Check documents list
docs = requests.get(f'http://127.0.0.1:8000/api/evaluations/{eval_id}/documents').json()
print(f"Documents list count: {len(docs)}, Document: {docs[0]['filename']}, Pages: {docs[0]['page_count']}")

# Check page 2 text retrieval
page2 = requests.get(f"http://127.0.0.1:8000/api/documents/{upload_res['document_id']}/pages/2").json()
print("Page 2 retrieved text snippet:", page2['text_content'][:100])

print("\nMilestone 1 Verified: UPLOAD PDF -> PARSE PDF -> STORE PAGE TEXT -> DISPLAY DOCUMENT + PAGE COUNT -> SUCCESS!")
