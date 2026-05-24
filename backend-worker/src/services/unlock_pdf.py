import sys
from pypdf import PdfReader, PdfWriter

def unlock_pdf(input_path, output_path, password):
    try:
        reader = PdfReader(input_path)
        
        if reader.is_encrypted:
            res = reader.decrypt(password)
            if res == 0: # 0 means failed decryption
                print("ERROR: Invalid password")
                sys.exit(1)
                
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        with open(output_path, "wb") as f:
            writer.write(f)
            
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python unlock_pdf.py <input.pdf> <output.pdf> <password>")
        sys.exit(1)
        
    in_pdf = sys.argv[1]
    out_pdf = sys.argv[2]
    pwd = sys.argv[3]
    unlock_pdf(in_pdf, out_pdf, pwd)
