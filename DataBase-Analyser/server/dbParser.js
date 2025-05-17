import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import sqlite3Raw from 'sqlite3';
import csv from 'csv-parser';
import xlsx from 'xlsx';

const sqlite3 = sqlite3Raw.verbose();

/**
 * Parse different types of database files
 */
export default class DatabaseParser {
  /**
   * Parse a database file and extract its structure and sample data
   * @param {string} filePath - Path to the database file
   * @returns {Promise<object>} Database structure and sample data
   */
  async parseFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.db':
      case '.sqlite':
        return await this.parseSQLiteFile(filePath);
      case '.csv':
        return await this.parseCSVFile(filePath);
      case '.xlsx':
        return await this.parseExcelFile(filePath);
      case '.sql':
        return await this.parseSQLFile(filePath);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }
  
  /**
   * Parse a SQLite database file
   * @param {string} filePath - Path to the SQLite file
   * @returns {Promise<object>} Database structure and sample data
   */
  async parseSQLiteFile(filePath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Error opening SQLite database: ${err.message}`));
          return;
        }
        
        const result = { tables: {} };
        
        // Get all table names
        db.all(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
          async (err, tables) => {
            if (err) {
              db.close();
              reject(new Error(`Error retrieving tables: ${err.message}`));
              return;
            }
            
            try {
              // For each table, get its structure and sample data
              for (const table of tables) {
                const tableName = table.name;
                
                // Get table schema
                const schema = await this.getTableSchema(db, tableName);
                
                // Get sample data (first 5 rows)
                const sampleData = await this.getTableSampleData(db, tableName, 5);
                
                // Get row count
                const rowCount = await this.getTableRowCount(db, tableName);
                
                // Store table info
                result.tables[tableName] = {
                  schema,
                  sampleData,
                  rowCount
                };
              }
              
              db.close();
              resolve(result);
            } catch (error) {
              db.close();
              reject(error);
            }
          }
        );
      });
    });
  }
  
  /**
   * Get schema of a SQLite table
   * @param {sqlite3.Database} db - SQLite database connection
   * @param {string} tableName - Name of the table
   * @returns {Promise<Array>} Table schema
   */
  getTableSchema(db, tableName) {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          reject(new Error(`Error getting table schema: ${err.message}`));
          return;
        }
        
        // Extract column information
        const schema = columns.map(column => ({
          name: column.name,
          type: column.type,
          notNull: column.notnull === 1,
          defaultValue: column.dflt_value,
          isPrimaryKey: column.pk === 1
        }));
        
        resolve(schema);
      });
    });
  }
  
  /**
   * Get sample data from a SQLite table
   * @param {sqlite3.Database} db - SQLite database connection
   * @param {string} tableName - Name of the table
   * @param {number} limit - Number of rows to retrieve
   * @returns {Promise<Array>} Sample data rows
   */
  getTableSampleData(db, tableName, limit) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName} LIMIT ${limit}`, (err, rows) => {
        if (err) {
          reject(new Error(`Error getting sample data: ${err.message}`));
          return;
        }
        
        resolve(rows);
      });
    });
  }
  
  /**
   * Get row count of a SQLite table
   * @param {sqlite3.Database} db - SQLite database connection
   * @param {string} tableName - Name of the table
   * @returns {Promise<number>} Row count
   */
  getTableRowCount(db, tableName) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
        if (err) {
          reject(new Error(`Error getting row count: ${err.message}`));
          return;
        }
        
        resolve(result.count);
      });
    });
  }
  
  /**
   * Parse a CSV file
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<object>} CSV structure and sample data
   */
  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const rows = [];
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rows.push(data);
        })
        .on('end', () => {
          try {
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            
            resolve({
              tables: {
                csv_data: {
                  schema: headers.map(name => ({
                    name,
                    type: 'TEXT',
                    notNull: false
                  })),
                  sampleData: rows.slice(0, 5),
                  rowCount: rows.length
                }
              }
            });
          } catch (error) {
            reject(new Error(`Error parsing CSV: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`Error reading CSV file: ${error.message}`));
        });
    });
  }
  
  /**
   * Parse an Excel file
   * @param {string} filePath - Path to the Excel file
   * @returns {Promise<object>} Excel structure and sample data
   */
  async parseExcelFile(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const result = { tables: {} };
      
      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          
          result.tables[sheetName] = {
            schema: headers.map(name => ({
              name,
              type: 'TEXT',
              notNull: false
            })),
            sampleData: jsonData.slice(0, 5),
            rowCount: jsonData.length
          };
        } else {
          // Empty sheet
          result.tables[sheetName] = {
            schema: [],
            sampleData: [],
            rowCount: 0
          };
        }
      });
      
      return result;
    } catch (error) {
      throw new Error(`Error parsing Excel file: ${error.message}`);
    }
  }
  
  /**
   * Parse a SQL dump file
   * @param {string} filePath - Path to the SQL file
   * @returns {Promise<object>} SQL structure and sample data
   */
  async parseSQLFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Extract CREATE TABLE statements
      const createTableRegex = /CREATE\s+TABLE\s+[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\);/gi;
      const tables = {};
      
      let match;
      while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1];
        const tableDefinition = match[2];
        
        // Extract column definitions
        const columnRegex = /\s*[`"']?(\w+)[`"']?\s+(\w+)(?:\(.*?\))?(?:\s+(NOT NULL|NULL))?(?:\s+DEFAULT\s+([^,]+))?/gi;
        const columns = [];
        
        let columnMatch;
        while ((columnMatch = columnRegex.exec(tableDefinition)) !== null) {
          columns.push({
            name: columnMatch[1],
            type: columnMatch[2],
            notNull: columnMatch[3] === 'NOT NULL',
            defaultValue: columnMatch[4]
          });
        }
        
        tables[tableName] = {
          schema: columns,
          sampleData: [], // SQL dumps don't have sample data
          rowCount: 0     // Can't determine row count from SQL dump
        };
      }
      
      return { tables };
    } catch (error) {
      throw new Error(`Error parsing SQL file: ${error.message}`);
    }
  }
}
