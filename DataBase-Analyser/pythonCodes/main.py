import pandas as pd
import sqlite3
import json
import ollama

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

# Example Usage
file = 'inventory.db'  # Change to your file path
data = read_file(file)

# Pretty Print JSON Output
# print(json.dumps(data, indent=4, ensure_ascii=False))
