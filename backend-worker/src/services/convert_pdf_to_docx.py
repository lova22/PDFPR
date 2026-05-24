import sys
from pdf2docx import Converter

def convert(pdf_file, docx_file):
    try:
        cv = Converter(pdf_file)
        cv.convert(docx_file, start=0, end=None)
        cv.close()
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python convert_pdf_to_docx.py <input.pdf> <output.docx>")
        sys.exit(1)
    
    convert(sys.argv[1], sys.argv[2])
