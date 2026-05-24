import sys
from pypdf import PdfReader, PdfWriter

def protect_pdf(input_path, output_path, password):
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # Encrypt with AES-256 (default for pypdf 3.0+ when encrypting)
        writer.encrypt(user_password=password, owner_password=password, algorithm="AES-256")

        with open(output_path, "wb") as f:
            writer.write(f)
            
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python protect_pdf.py <input.pdf> <output.pdf> <password>")
        sys.exit(1)
        
    in_pdf = sys.argv[1]
    out_pdf = sys.argv[2]
    pwd = sys.argv[3]
    protect_pdf(in_pdf, out_pdf, pwd)
