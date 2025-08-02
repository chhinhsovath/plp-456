const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class SchemaValidator {
  constructor() {
    this.prisma = new PrismaClient();
    this.errors = [];
    this.warnings = [];
  }

  // Validate database connection
  async validateConnection() {
    console.log('🔌 Validating database connection...');
    try {
      await this.prisma.$connect();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      this.errors.push({
        type: 'CONNECTION',
        message: `Failed to connect to database: ${error.message}`
      });
      return false;
    }
  }

  // Check if required tables exist
  async validateTables() {
    console.log('\n📊 Validating table existence...');
    
    const requiredTables = ['users'];
    const optionalTables = ['geographic', 'schools'];
    
    try {
      // Get all tables
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const tableNames = tables.map(t => t.table_name);
      
      // Check required tables
      for (const table of requiredTables) {
        if (!tableNames.includes(table)) {
          this.errors.push({
            type: 'MISSING_TABLE',
            table,
            message: `Required table '${table}' is missing`
          });
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      }
      
      // Check optional tables
      for (const table of optionalTables) {
        if (!tableNames.includes(table)) {
          this.warnings.push({
            type: 'MISSING_OPTIONAL_TABLE',
            table,
            message: `Optional table '${table}' is missing`
          });
        } else {
          console.log(`✅ Optional table '${table}' exists`);
        }
      }
    } catch (error) {
      this.errors.push({
        type: 'TABLE_CHECK',
        message: `Failed to check tables: ${error.message}`
      });
    }
  }

  // Validate table schemas
  async validateSchemas() {
    console.log('\n🔍 Validating table schemas...');
    
    // Check users table schema
    try {
      const userColumns = await this.prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `;
      
      const expectedColumns = {
        id: { type: 'integer', nullable: 'NO' },
        email: { type: 'character varying', nullable: 'NO', length: 255 },
        password: { type: 'character varying', nullable: 'YES', length: 255 },
        name: { type: 'character varying', nullable: 'YES', length: 255 },
        role: { type: 'character varying', nullable: 'YES', length: 50 },
        auth_provider: { type: 'character varying', nullable: 'YES', length: 50 },
        telegram_id: { type: 'bigint', nullable: 'YES' },
        is_active: { type: 'boolean', nullable: 'YES' }
      };
      
      // Check each expected column
      for (const [colName, expected] of Object.entries(expectedColumns)) {
        const column = userColumns.find(c => c.column_name === colName);
        
        if (!column) {
          this.errors.push({
            type: 'MISSING_COLUMN',
            table: 'users',
            column: colName,
            message: `Column '${colName}' is missing from users table`
          });
        } else {
          // Validate column properties
          if (column.data_type !== expected.type) {
            this.warnings.push({
              type: 'COLUMN_TYPE_MISMATCH',
              table: 'users',
              column: colName,
              expected: expected.type,
              actual: column.data_type,
              message: `Column '${colName}' type mismatch`
            });
          }
          
          if (column.is_nullable !== expected.nullable) {
            this.warnings.push({
              type: 'NULLABLE_MISMATCH',
              table: 'users',
              column: colName,
              expected: expected.nullable,
              actual: column.is_nullable,
              message: `Column '${colName}' nullable mismatch`
            });
          }
        }
      }
      
      console.log('✅ Users table schema validated');
    } catch (error) {
      this.errors.push({
        type: 'SCHEMA_CHECK',
        message: `Failed to validate schema: ${error.message}`
      });
    }
  }

  // Check indexes
  async validateIndexes() {
    console.log('\n🔑 Validating indexes...');
    
    try {
      const indexes = await this.prisma.$queryRaw`
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
      `;
      
      // Check for important indexes
      const requiredIndexes = [
        { table: 'users', column: 'email', type: 'unique' },
        { table: 'users', column: 'telegram_id', type: 'unique' }
      ];
      
      for (const required of requiredIndexes) {
        const found = indexes.some(idx => 
          idx.tablename === required.table &&
          idx.indexdef.toLowerCase().includes(required.column)
        );
        
        if (!found) {
          this.warnings.push({
            type: 'MISSING_INDEX',
            table: required.table,
            column: required.column,
            message: `Missing index on ${required.table}.${required.column}`
          });
        } else {
          console.log(`✅ Index on ${required.table}.${required.column} exists`);
        }
      }
    } catch (error) {
      this.errors.push({
        type: 'INDEX_CHECK',
        message: `Failed to check indexes: ${error.message}`
      });
    }
  }

  // Check constraints
  async validateConstraints() {
    console.log('\n🔒 Validating constraints...');
    
    try {
      const constraints = await this.prisma.$queryRaw`
        SELECT 
          conname AS constraint_name,
          contype AS constraint_type,
          conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
      `;
      
      console.log(`✅ Found ${constraints.length} constraints`);
      
      // Check for specific constraints
      const hasUniqueEmail = constraints.some(c => 
        c.constraint_name.includes('email') && c.constraint_type === 'u'
      );
      
      if (!hasUniqueEmail) {
        this.warnings.push({
          type: 'MISSING_CONSTRAINT',
          message: 'Missing unique constraint on users.email'
        });
      }
    } catch (error) {
      this.errors.push({
        type: 'CONSTRAINT_CHECK',
        message: `Failed to check constraints: ${error.message}`
      });
    }
  }

  // Check data integrity
  async validateDataIntegrity() {
    console.log('\n🔍 Validating data integrity...');
    
    try {
      // Check for duplicate emails
      const duplicateEmails = await this.prisma.$queryRaw`
        SELECT email, COUNT(*) as count
        FROM users
        WHERE email IS NOT NULL
        GROUP BY email
        HAVING COUNT(*) > 1
      `;
      
      if (duplicateEmails.length > 0) {
        this.errors.push({
          type: 'DATA_INTEGRITY',
          message: `Found ${duplicateEmails.length} duplicate emails`,
          data: duplicateEmails
        });
      } else {
        console.log('✅ No duplicate emails found');
      }
      
      // Check for users without roles
      const usersWithoutRoles = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM users
        WHERE role IS NULL OR role = ''
      `;
      
      if (usersWithoutRoles[0].count > 0) {
        this.warnings.push({
          type: 'DATA_INTEGRITY',
          message: `Found ${usersWithoutRoles[0].count} users without roles`
        });
      }
      
      // Check for invalid roles
      const validRoles = ['ADMINISTRATOR', 'MENTOR', 'TEACHER'];
      const invalidRoles = await this.prisma.$queryRaw`
        SELECT DISTINCT role
        FROM users
        WHERE role NOT IN (${validRoles.join(',')})
          AND role IS NOT NULL
      `;
      
      if (invalidRoles.length > 0) {
        this.errors.push({
          type: 'DATA_INTEGRITY',
          message: 'Found users with invalid roles',
          data: invalidRoles
        });
      } else {
        console.log('✅ All user roles are valid');
      }
    } catch (error) {
      this.errors.push({
        type: 'INTEGRITY_CHECK',
        message: `Failed to check data integrity: ${error.message}`
      });
    }
  }

  // Generate migration suggestions
  async generateMigrationSuggestions() {
    console.log('\n💡 Generating migration suggestions...');
    
    const suggestions = [];
    
    // Based on errors and warnings, suggest migrations
    if (this.errors.some(e => e.type === 'MISSING_TABLE')) {
      suggestions.push({
        priority: 'HIGH',
        action: 'Create missing tables',
        script: 'npx prisma migrate dev --name add_missing_tables'
      });
    }
    
    if (this.warnings.some(w => w.type === 'MISSING_INDEX')) {
      suggestions.push({
        priority: 'MEDIUM',
        action: 'Add missing indexes for better performance',
        sql: `
-- Add missing indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
        `
      });
    }
    
    if (this.errors.some(e => e.type === 'DATA_INTEGRITY')) {
      suggestions.push({
        priority: 'HIGH',
        action: 'Fix data integrity issues',
        sql: `
-- Remove duplicate emails (keep the newest)
DELETE FROM users a USING users b
WHERE a.id < b.id AND a.email = b.email;

-- Set default roles for users without roles
UPDATE users SET role = 'TEACHER' WHERE role IS NULL OR role = '';
        `
      });
    }
    
    return suggestions;
  }

  // Generate report
  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        status: this.errors.length === 0 ? 'PASS' : 'FAIL'
      },
      errors: this.errors,
      warnings: this.warnings,
      suggestions: await this.generateMigrationSuggestions()
    };
    
    // Save report
    const reportPath = path.join(__dirname, `../schema-validation-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📋 Validation Summary:');
    console.log('='.repeat(50));
    console.log(`Status: ${report.summary.status}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.type}: ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => {
        console.log(`  - ${warning.type}: ${warning.message}`);
      });
    }
    
    if (report.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      report.suggestions.forEach(suggestion => {
        console.log(`  - [${suggestion.priority}] ${suggestion.action}`);
        if (suggestion.sql) {
          console.log('    SQL:', suggestion.sql.trim());
        }
      });
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return report;
  }

  // Main validation function
  async validate() {
    console.log('🔍 Starting database schema validation...\n');
    
    try {
      // Run all validations
      await this.validateConnection();
      await this.validateTables();
      await this.validateSchemas();
      await this.validateIndexes();
      await this.validateConstraints();
      await this.validateDataIntegrity();
      
      // Generate and save report
      const report = await this.generateReport();
      
      // Exit with appropriate code
      process.exit(report.summary.status === 'PASS' ? 0 : 1);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run validation
const validator = new SchemaValidator();
validator.validate().catch(console.error);