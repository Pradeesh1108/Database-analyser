import pandas as pd
import sqlite3
from fastapi import FastAPI, Body, UploadFile
import os
from dotenv import dotenv_values
import google.generativeai as genai

app = FastAPI()

api_key = dotenv_values(".env").get("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file. Please make sure the .env file exists and contains a valid GEMINI_API_KEY.")

def setup_gemini():
    """Configure and return the Gemini model"""
    genai.configure(api_key=api_key)
    # For free API key, use the standard Gemini model
    # Use the Gemini 2.0 Flash model
    model_name = 'models/gemini-2.0-flash'
    print(f"Using model: {model_name}")
    return genai.GenerativeModel(model_name)

model = setup_gemini()

def preprocess_user_query(query):
    """
    Validate if user query is related to database analysis.
    Returns (is_valid, message)
    """
    query = query.lower()
    
    # Define relevant keywords for allowed topics
    db_keywords = ['database', 'db', 'sqlite', 'sql', 'table', 'query']
    excel_csv_keywords = ['excel', 'csv', 'column', 'row', 'formula', 'spreadsheet']
    analysis_keywords = ['analysis', 'analyze', 'statistics', 'report', 'summary']
    
    # Check if query is related to allowed topics
    is_relevant = (
        any(kw in query for kw in db_keywords) or
        any(kw in query for kw in excel_csv_keywords) or
        any(kw in query for kw in analysis_keywords)
    )
    
    # Check for image generation requests
    asks_for_image = any(kw in query for kw in ['image', 'picture', 'graph', 'chart', 'plot'])
    
    if asks_for_image:
        return False, "I cannot generate or provide images. I can only analyze database, CSV, or Excel files."
    
    if not is_relevant:
        return False, "I can only answer questions related to database analysis, SQL queries, or Excel/CSV formulas and operations."
    
    return True, ""

def read_file(file):
    datas = {}
    # Handling CSV files
    if file.endswith('.csv'):
        df = pd.read_csv(file)
        datas["csv_data"] = {
            "column_names": df.columns.tolist(),
            "column_length": len(df.columns),
            "row_contents": df.values.tolist(),
            "row_length": len(df)
        }
    # Handling Excel files
    elif file.endswith('.xlsx'):
        xls = pd.ExcelFile(file)
        for sheet in xls.sheet_names:
            df = xls.parse(sheet)
            datas[sheet] = {
                "column_names": df.columns.tolist(),
                "column_length": len(df.columns),
                "row_contents": df.values.tolist(),
                "row_length": len(df)
            }

    # Handling SQLite Database
    elif file.endswith('.db'):
        conn = sqlite3.connect(file)
        cur = conn.cursor()

        # Get all table names
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cur.fetchall()]

        for table in tables:
            # Get column names
            cur.execute(f"PRAGMA table_info({table});")
            columns = [row[1] for row in cur.fetchall()]

            # Get table rows
            cur.execute(f"SELECT * FROM {table}")
            rows = cur.fetchall()

            # Store data
            datas[table] = {
                "column_names": columns,
                "column_length": len(columns),
                "row_contents": rows,
                "row_length": len(rows)
            }

        conn.close()

    return datas


def create_data_context(file_data):
    """Create a text description of the data for Gemini"""
    context = "Data structure:\n"
    
    for table_name, table_data in file_data.items():
        context += f"\nTable/Sheet: {table_name}\n"
        context += f"Columns ({table_data['column_length']}): {', '.join(str(col) for col in table_data['column_names'])}\n"
        context += f"Number of rows: {table_data['row_length']}\n"
        
        # Add sample data (first few rows) if available
        if table_data['row_length'] > 0:
            context += "Sample data (first 3 rows):\n"
            for i, row in enumerate(table_data['row_contents'][:3]):
                context += f"Row {i+1}: {row}\n"
    
    return context

FILE_DATA = ''

@app.post('/upload')
async def upload_file(file: UploadFile):
    global FILE_DATA
    # Create a temp directory if it doesn't exist
    os.makedirs("temp", exist_ok=True)
    
    # Save the uploaded file to a temp location
    temp_file_path = f"temp/{file.filename}"
    with open(temp_file_path, "wb") as f:
        f.write(await file.read())
    
    # Process the file using existing function
    try:
        file_data = read_file(temp_file_path)
        FILE_DATA = file_data
        return {
            "success": True,
            "message": "File uploaded and processed successfully",
        }
    except Exception as e:
        FILE_DATA  = ""
        return {
            "success": False,
            "message": f"Error processing file: {str(e)}"
        }
    finally:
        os.remove(temp_file_path)

@app.post('/chat/{query}')
def process_user_query(query: str, file_data: dict = Body(...)):
    """Process user query and get response from Gemini"""
    global model
    print("Query :",query)
    print("Content :", file_data)

    is_valid, message = preprocess_user_query(query)
    
    if not is_valid:
        return message
    
    # Set up prompt for Gemini with context about the data
    data_context = create_data_context(file_data)
    
    prompt = f"""
    You are a database and data analysis assistant. Analyze the data provided and answer the user's query.
    
    DATA CONTEXT:
    {data_context}
    
    USER QUERY:
    {query}
    
    Provide a detailed and helpful response based on the data.
    """
    
    try:
        response = model.generate_content(prompt)
        return {
            "success":True,
            "message":response.text
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing data: {str(e)}"
        } 
