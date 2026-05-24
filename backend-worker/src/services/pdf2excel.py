import sys
import pdfplumber
import pandas as pd
import os

def pdf_to_excel(input_path, output_path):
    try:
        if not os.path.exists(input_path):
            print(f"Error: File not found {input_path}")
            sys.exit(1)
            
        all_tables = []
        
        with pdfplumber.open(input_path) as pdf:
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for j, table in enumerate(tables):
                    if not table:
                        continue
                        
                    # Clean up the table data
                    cleaned_table = []
                    for row in table:
                        cleaned_row = [str(cell).replace('\n', ' ').strip() if cell else '' for cell in row]
                        cleaned_table.append(cleaned_row)
                        
                    df = pd.DataFrame(cleaned_table[1:], columns=cleaned_table[0]) if len(cleaned_table) > 1 else pd.DataFrame(cleaned_table)
                    all_tables.append(df)
                    
        if not all_tables:
            print(f"Warning: No tables found in {input_path}. Creating an empty Excel file.")
            df = pd.DataFrame([["No tables detected in the PDF."]])
            all_tables.append(df)
            
        # Write to Excel
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for idx, df in enumerate(all_tables):
                sheet_name = f'Table_{idx+1}'
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
        print(f"Success: {output_path}")
        sys.exit(0)
    except Exception as e:
        print(f"Error extracting tables: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python pdf2excel.py <input.pdf> <output.xlsx>")
        sys.exit(1)
        
    input_pdf = sys.argv[1]
    output_xlsx = sys.argv[2]
    
    pdf_to_excel(input_pdf, output_xlsx)
