import pdfplumber
import sys
def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            text += page_text
    return text

# Usage
pdf_file_path = sys.argv[1]
pdf_text = extract_text_from_pdf(pdf_file_path)
print(pdf_text)
