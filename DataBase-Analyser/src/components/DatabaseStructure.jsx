import React, { useState } from 'react';
import { FiDatabase, FiTable, FiKey, FiColumns, FiChevronDown, FiChevronRight } from 'react-icons/fi';

const DatabaseStructure = ({ structure }) => {
  const [expandedTables, setExpandedTables] = useState({});
  const [hoveredTable, setHoveredTable] = useState(null);

  if (!structure || !structure.tables || Object.keys(structure.tables).length === 0) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-lg p-4 text-neutral-600 dark:text-dark-secondary mt-4 shadow-sm border border-neutral-200 dark:border-neutral-700 transition-all duration-300">
        <p className="flex items-center">
          <FiDatabase className="mr-2 text-primary-400 dark:text-primary-500" /> No database structure available
        </p>
      </div>
    );
  }

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg p-4 text-neutral-800 dark:text-dark-primary mt-4 overflow-auto max-h-64 transition-all duration-300 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <FiDatabase className="mr-2 text-primary-500 dark:text-primary-400" /> 
        <span className="bg-gradient-to-r from-primary-500 to-secondary-500 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
          Database Structure
        </span>
      </h3>
      <div className="space-y-2">
        {Object.entries(structure.tables).map(([tableName, tableData]) => (
          <div 
            key={tableName} 
            className={`border rounded transition-all duration-300 ${
              hoveredTable === tableName 
                ? 'border-primary-300 dark:border-primary-600 shadow-sm' 
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
            onMouseEnter={() => setHoveredTable(tableName)}
            onMouseLeave={() => setHoveredTable(null)}
          >
            <div 
              className="flex items-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-dark-hover p-2 rounded transition-colors duration-200"
              onClick={() => toggleTable(tableName)}
            >
              <div className="mr-1 transition-transform duration-300">
                {expandedTables[tableName] ? 
                  <FiChevronDown className="text-primary-500 dark:text-primary-400" /> : 
                  <FiChevronRight className="text-primary-500 dark:text-primary-400" />
                }
              </div>
              <FiTable className="mr-2 text-secondary-500 dark:text-secondary-400" />
              <span className="font-medium">{tableName}</span>
              <span className="ml-2 text-xs bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-dark-secondary px-2 py-0.5 rounded-full transition-all duration-300">
                {tableData.rowCount} rows
              </span>
            </div>
            
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                expandedTables[tableName] 
                  ? 'max-h-[1000px] opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="mt-2 pl-6 border-l border-neutral-200 dark:border-neutral-700 ml-2 pb-2">
                <div className="text-sm mb-1 text-neutral-500 dark:text-dark-secondary">Columns:</div>
                <div className="space-y-1">
                  {tableData.schema && tableData.schema.map((column, idx) => (
                    <div key={idx} className="flex items-center text-sm group hover:bg-neutral-50 dark:hover:bg-dark-hover p-1 rounded transition-colors duration-200">
                      {column.isPrimaryKey ? 
                        <FiKey className="mr-1 text-warning-DEFAULT dark:text-warning-DEFAULT group-hover:text-warning-dark dark:group-hover:text-warning-light transition-colors duration-200" /> : 
                        <FiColumns className="mr-1 text-primary-400 dark:text-primary-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-200" />
                      }
                      <span className="font-mono text-neutral-700 dark:text-dark-primary">{column.name}</span>
                      <span className="text-neutral-500 dark:text-dark-secondary ml-2 text-xs">{column.type}</span>
                      {column.notNull && (
                        <span className="text-xs ml-1 text-danger-DEFAULT dark:text-danger-DEFAULT">NOT NULL</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {tableData.sampleData && tableData.sampleData.length > 0 && (
                  <div className="mt-3 animate-fade-in">
                    <div className="text-sm mb-1 text-neutral-500 dark:text-dark-secondary">Sample data:</div>
                    <div className="bg-neutral-50 dark:bg-dark-surface p-2 rounded overflow-x-auto border border-neutral-200 dark:border-neutral-800 transition-all duration-300">
                      <pre className="text-xs text-neutral-700 dark:text-dark-primary">
                        {JSON.stringify(tableData.sampleData.slice(0, 2), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabaseStructure;