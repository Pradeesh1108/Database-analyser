import pandas as pd
import sqlite3

def load_csv(file):
    data = pd.read_csv(file)
    columns = data.columns
    return (columns, data)

def load_excel(file):
    data = pd.read_excel(file)
    columns = data.columns
    return (columns, data)

def load_sqlite(file):
    db = sqlite3.connect(file)
    cur = db.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    table_data = {}
    table_columns = {}

    for table in tables:
        table_name = table[0]
        cur.execute(f"SELECT * FROM {table_name} LIMIT 0")
        columns = [description[0] for description in cur.description]
        data = pd.read_sql_query(f"SELECT * FROM {table_name}", db)
        table_columns[table_name] = columns
        table_data[table_name] = data

    db.close()
    return (table_columns, table_data)


