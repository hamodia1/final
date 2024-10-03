// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer({ dest: 'uploads/' });

const app = express();

const port = 8383;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'your_postgres_db',
  password: '2312',
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

const secretKey = 'your_secret_key';

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from the header

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.sendStatus(403); // Invalid token
      req.user = user; // Attach user information to the request
      next();
  });
};



// Endpoint for uploading employees CSV
const sanitizeSchemaName = (companyName) => {
  return companyName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
};

// Endpoint for uploading employees CSV
app.post('/upload-employees', authenticateToken, upload.single('file'), async (req, res) => {
  const { file } = req;
  if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }

  const email = req.user.email;

  try {
      const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
      const companyName = userResult.rows[0].company_name;

      const schemaName = sanitizeSchemaName(companyName);
      await pool.query(`DELETE FROM ${schemaName}.employees`);

      const filePath = path.join(__dirname, file.path);
      const employeeData = [];

      // Read and parse the CSV file
      fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
          console.log('Processing row:', row); // Log the row data to see what's being parsed
  
          // Destructure the row into variables with matching case
          const { id, Name, Skill1, Skill2, Skill3, Shift_Wanted } = row;
  
          // Ensure id and Name are defined and convert Shift_Wanted to an integer
          if (id && Name) {
              const shiftsWanted = parseInt(Shift_Wanted, 10); // Convert to integer
              employeeData.push([id, Name, Skill1, Skill2, Skill3, shiftsWanted]);
          } else {
              console.warn('Skipping row due to missing id or name:', row);
          }
      })
      .on('end', async () => {
          if (employeeData.length > 0) {
              const query = `
                  INSERT INTO ${schemaName}.employees (id, name, skill1, skill2, skill3, shifts_wanted)
                  VALUES ($1, $2, $3, $4, $5, $6)
              `;
              for (const employee of employeeData) {
                  try {
                      await pool.query(query, employee);
                      console.log('Inserted:', employee); // Confirm insertion
                  } catch (err) {
                      console.error('Error inserting data:', err); // Log any errors during insertion
                  }
              }
          }
          // Clean up: Delete the uploaded file after processing
          fs.unlinkSync(filePath);
          res.json({ message: 'Employees CSV uploaded and processed successfully' });
      })
      .on('error', (err) => {
          console.error(err);
          res.status(500).json({ error: 'Error processing CSV file' });
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
  }
});


// Endpoint for uploading shifts CSV
// Endpoint for uploading shifts CSV
app.post('/upload-shifts', authenticateToken, upload.single('file'), async (req, res) => {
  const { file } = req;
  if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }

  const email = req.user.email;

  try {
      const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
      const companyName = userResult.rows[0].company_name;

      const schemaName = sanitizeSchemaName(companyName);
      await pool.query(`DELETE FROM ${schemaName}.shifts_types`); // Clear existing data

      const filePath = path.join(__dirname, file.path);
      const shiftData = [];

      // Read and parse the CSV file
      fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
              console.log('Processing row:', row); // Log the row data to see what's being parsed

              // Destructure the row into variables
              const { Skill, Day, 'From Hour': timeBegin, 'To Hour': timeEnd, 'Shift Cost': price } = row;

              // Ensure required fields are defined and convert price to a numeric value
              if (Skill && Day && timeBegin && timeEnd && price) {
                  const priceValue = parseFloat(price); // Convert to a numeric value
                  shiftData.push([Skill, Day, timeBegin, timeEnd, priceValue]);
              } else {
                  console.warn('Skipping row due to missing required fields:', row);
              }
          })
          .on('end', async () => {
              if (shiftData.length > 0) {
                  const query = `
                      INSERT INTO ${schemaName}.shifts_types (skill, day, time_begin, time_end, price)
                      VALUES ($1, $2, $3, $4, $5)
                  `;
                  for (const shift of shiftData) {
                      try {
                          await pool.query(query, shift);
                          console.log('Inserted shift:', shift); // Confirm insertion
                      } catch (err) {
                          console.error('Error inserting shift data:', err); // Log any errors during insertion
                      }
                  }
              }
              // Clean up: Delete the uploaded file after processing
              fs.unlinkSync(filePath);
              res.json({ message: 'Shifts CSV uploaded and processed successfully' });
          })
          .on('error', (err) => {
              console.error(err);
              res.status(500).json({ error: 'Error processing CSV file' });
          });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
  }
});


// Endpoint for uploading required employees CSV// Endpoint for uploading required employees CSV
app.post('/upload-require-employees', authenticateToken, upload.single('file'), async (req, res) => {
  const { file } = req;
  if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }

  const email = req.user.email;

  try {
      const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
      const companyName = userResult.rows[0].company_name;

      const schemaName = sanitizeSchemaName(companyName);
      await pool.query(`DELETE FROM ${schemaName}.shifts_require`); // Clear existing data

      const filePath = path.join(__dirname, file.path);
      const requireData = [];

      // Read and parse the CSV file
      fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
              console.log('Processing row:', row); // Log the row data to see what's being parsed

              // Destructure the row into variables
              const { Day, Skill, 'From Hour': timeBegin, 'To Hour': timeEnd, Requirement } = row;

              // Ensure required fields are defined and convert Requirement to an integer
              if (Day && Skill && timeBegin && timeEnd && Requirement) {
                  const requirementValue = parseInt(Requirement, 10); // Convert to integer
                  requireData.push([Day, Skill, timeBegin, timeEnd, requirementValue]);
              } else {
                  console.warn('Skipping row due to missing required fields:', row);
              }
          })
          .on('end', async () => {
              if (requireData.length > 0) {
                  const query = `
                      INSERT INTO ${schemaName}.shifts_require (day, skill, time_begin, time_end, require)
                      VALUES ($1, $2, $3, $4, $5)
                  `;
                  for (const requireShift of requireData) {
                      try {
                          await pool.query(query, requireShift);
                          console.log('Inserted required shift:', requireShift); // Confirm insertion
                      } catch (err) {
                          console.error('Error inserting required shift data:', err); // Log any errors during insertion
                      }
                  }
              }
              // Clean up: Delete the uploaded file after processing
              fs.unlinkSync(filePath);
              res.json({ message: 'Required employees CSV uploaded and processed successfully' });
          })
          .on('error', (err) => {
              console.error(err);
              res.status(500).json({ error: 'Error processing CSV file' });
          });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
  }
});


// Registration Route
// Registration Route
app.post('/register', async (req, res) => {
  const { email, password, companyName, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO users (email, password, company_name, phone) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, hashedPassword, companyName, phone]
      );
      const companyId = result.rows[0].id;

      // Sanitize the company name for use as a schema name
      const schemaName = sanitizeSchemaName(companyName);

      // Create the schema for the company
      await client.query(`CREATE SCHEMA ${schemaName}`);

      // Create the employees table within the new schema
      await client.query(`
        CREATE TABLE ${schemaName}.employees (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          skill1 VARCHAR(255),
          skill2 VARCHAR(255),
          skill3 VARCHAR(255),
          shifts_wanted INTEGER NOT NULL
        )
      `);

      // Create the shifts_types table within the new schema
      await client.query(`
        CREATE TABLE ${schemaName}.shifts_types (
          id SERIAL PRIMARY KEY,
          skill VARCHAR(255) NOT NULL,
          day VARCHAR(255) NOT NULL,
          time_begin TIME NOT NULL,
          time_end TIME NOT NULL,
          price NUMERIC(10, 2) NOT NULL
        )
      `);

      // Create the shifts_require table within the new schema
      await client.query(`
        CREATE TABLE ${schemaName}.shifts_require (
          id SERIAL PRIMARY KEY,
          day VARCHAR(255) NOT NULL,
          skill VARCHAR(255) NOT NULL,
          time_begin TIME NOT NULL,
          time_end TIME NOT NULL,
          require INTEGER NOT NULL
        )
      `);

      // Create the results table within the new schema
      await client.query(`
        CREATE TABLE ${schemaName}.results (
          skill VARCHAR(255) NOT NULL,
          day VARCHAR(255) NOT NULL,
          time_begin TIME NOT NULL,
          time_end TIME NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          require NUMERIC NOT NULL
        )
      `);
            // Create the results table within the new schema
            await client.query(`
            CREATE TABLE ${schemaName}.assignments (
              skill VARCHAR(255) NOT NULL,
              day VARCHAR(255) NOT NULL,
              time_begin TIME NOT NULL,
              time_end TIME NOT NULL,
              price NUMERIC(10, 2) NOT NULL,
              require NUMERIC NOT NULL,
              emp1 VARCHAR(255) ,
              emp2 VARCHAR(255) ,
              emp3 VARCHAR(255) ,
              emp4 VARCHAR(255) ,
              emp5 VARCHAR(255) ,
              emp6 VARCHAR(255) ,
              emp7 VARCHAR(255) 
            )
          `);

      await client.query(`
        CREATE TABLE ${schemaName}.skills_days_images (
          id SERIAL PRIMARY KEY,
          path TEXT NOT NULL
           )
       `);
     

      await client.query('COMMIT');
      res.json({ message: 'Company registered, schema created, and tables initialized', company: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile Route
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [req.user.email]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Employee Route
app.post('/add-employee', authenticateToken, async (req, res) => {
  const { id, name, skill1, skill2, skill3, shifts_wanted } = req.body;

  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Check if the ID already exists
    const idCheck = await pool.query(`SELECT * FROM ${schemaName}.employees WHERE id = $1`, [id]);
    if (idCheck.rows.length > 0) {
      return res.status(400).json({ error: 'ID already exists' });
    }

    // Insert the employee into the company's employees table
    const result = await pool.query(`
      INSERT INTO ${schemaName}.employees (id, name, skill1, skill2, skill3, shifts_wanted)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [id, name, skill1, skill2, skill3, shifts_wanted]);

    res.json({ message: 'Employee added', employee: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Shift Route
app.post('/add-shift', authenticateToken, async (req, res) => {
  const { skill, day, time_begin, time_end, price } = req.body;

  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Insert the shift into the company's shifts_types table
    const result = await pool.query(`
      INSERT INTO ${schemaName}.shifts_types (skill, day, time_begin, time_end, price)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [skill, day, time_begin, time_end, price]);

    res.json({ message: 'Shift added', shift: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Shift Requirement Route
app.post('/add-shift-require', authenticateToken, async (req, res) => {
  const { day, skill, time_begin, time_end, require } = req.body;

  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Insert the shift requirement into the company's shifts_require table
    const result = await pool.query(`
      INSERT INTO ${schemaName}.shifts_require (day, skill, time_begin, time_end, require)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [day, skill, time_begin, time_end, require]);

    res.json({ message: 'Shift requirement added', shiftRequire: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Employee Route
app.put('/update-employee/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, skill1, skill2, skill3, shifts_wanted } = req.body;

  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const values = [id];
    let paramIndex = 2;

    if (name) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (skill1) {
      updateFields.push(`skill1 = $${paramIndex}`);
      values.push(skill1);
      paramIndex++;
    }
    if (skill2) {
      updateFields.push(`skill2 = $${paramIndex}`);
      values.push(skill2);
      paramIndex++;
    }
    if (skill3) {
      updateFields.push(`skill3 = $${paramIndex}`);
      values.push(skill3);
      paramIndex++;
    }
    if (shifts_wanted !== undefined) {
      updateFields.push(`shifts_wanted = $${paramIndex}`);
      values.push(shifts_wanted);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updateQuery = `
      UPDATE ${schemaName}.employees
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee updated', employee: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Shift Route
app.put('/update-shift/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { skill, day, time_begin, time_end, price } = req.body;

  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const values = [id];
    let paramIndex = 2;

    if (skill) {
      updateFields.push(`skill = $${paramIndex}`);
      values.push(skill);
      paramIndex++;
    }
    if (day) {
      updateFields.push(`day = $${paramIndex}`);
      values.push(day);
      paramIndex++;
    }
    if (time_begin) {
      updateFields.push(`time_begin = $${paramIndex}`);
      values.push(time_begin);
      paramIndex++;
    }
    if (time_end) {
      updateFields.push(`time_end = $${paramIndex}`);
      values.push(time_end);
      paramIndex++;
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updateQuery = `
      UPDATE ${schemaName}.shifts_types
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({ message: 'Shift updated', shift: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Shift Requirement Route
app.put('/update-shift-require/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { day, skill, time_begin, time_end, require } = req.body;

  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const values = [id];
    let paramIndex = 2;

    if (day) {
      updateFields.push(`day = $${paramIndex}`);
      values.push(day);
      paramIndex++;
    }
    if (skill) {
      updateFields.push(`skill = $${paramIndex}`);
      values.push(skill);
      paramIndex++;
    }
    if (time_begin) {
      updateFields.push(`time_begin = $${paramIndex}`);
      values.push(time_begin);
      paramIndex++;
    }
    if (time_end) {
      updateFields.push(`time_end = $${paramIndex}`);
      values.push(time_end);
      paramIndex++;
    }
    if (require !== undefined) {
      updateFields.push(`require = $${paramIndex}`);
      values.push(require);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updateQuery = `
      UPDATE ${schemaName}.shifts_require
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift requirement not found' });
    }

    res.json({ message: 'Shift requirement updated', shiftRequire: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all employees
app.get('/employees', authenticateToken, async (req, res) => {
  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch all employees for the authenticated user's company
    const result = await pool.query(`SELECT * FROM ${schemaName}.employees`);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all shifts
app.get('/shifts', authenticateToken, async (req, res) => {
  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch all shifts for the authenticated user's company
    const result = await pool.query(`SELECT * FROM ${schemaName}.shifts_types`);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all shift requirements
app.get('/shift-requirements', authenticateToken, async (req, res) => {
  try {
      const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
      const companyName = userResult.rows[0].company_name;

      const schemaName = sanitizeSchemaName(companyName);

      // Fetch all shift requirements from the respective company schema
      const result = await pool.query(`SELECT * FROM ${schemaName}.shifts_require`);
      res.json(result.rows);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Route to get all results
app.get('/results', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
    const companyName = userResult.rows[0].company_name;
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch results from the results table
    const resultQuery = `SELECT * FROM ${schemaName}.results`;
    const result = await pool.query(resultQuery);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/assignments', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
    const companyName = userResult.rows[0].company_name;
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch results from the assignments table
    const resultQuery = `SELECT skill, day, time_begin, time_end, require, emp1, emp2, emp3, emp4, emp5, emp6, emp7 FROM ${schemaName}.assignments`;
    const result = await pool.query(resultQuery);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get shifts requirements for a specific day
app.get('/shift-requirements/:day', authenticateToken, async (req, res) => {
  const { day } = req.params;
  try {
    // Look up the company name based on the authenticated user's email
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [req.user.email]);
    const companyName = userResult.rows[0].company_name;

    // Sanitize the company name for use as a schema name
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch shift requirements for the specific day
    const result = await pool.query(`SELECT * FROM ${schemaName}.shifts_require WHERE day = $1`, [day]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const axios = require('axios');

// New Endpoint to Optimize Schedule

// Endpoint to fetch and print the data
// New Endpoint to Optimize Schedule
app.post('/optimize-schedule', authenticateToken, async (req, res) => {
  const email = req.user.email;

  try {
    // Step 1: Fetch company name and schema
    console.log("Fetching company details...");
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
    const companyName = userResult.rows[0].company_name;
    const schemaName = sanitizeSchemaName(companyName);
    

    // Step 2: Fetch shift requirements and shift types
    console.log("Fetching shift requirements and shift types...");
    const shiftReqQuery = `SELECT day, skill, time_begin, time_end, require FROM ${schemaName}.shifts_require`;
    const shiftsQuery = `SELECT skill, day, time_begin, time_end, price FROM ${schemaName}.shifts_types`;
    
    const shiftReqResult = await pool.query(shiftReqQuery);
    const shiftsResult = await pool.query(shiftsQuery);
   

    const shiftRequirements = shiftReqResult.rows;
    const shifts = shiftsResult.rows;

    // Step 3: Convert shift data to CSV format
    console.log("Converting shift requirements and shift types to CSV...");
    const shiftRequirementsCsv = jsonToCsv(shiftRequirements);
    const shiftsCsv = jsonToCsv(shifts);
  
    // Step 4: Prepare form data and send to Flask
    console.log("Sending data to Flask server...");
    const formData = new FormData();
    formData.append('req_shifts', shiftRequirementsCsv, 'req_shifts.csv');
    formData.append('shifts', shiftsCsv, 'shifts.csv');

    const flaskResponse = await axios.post('http://localhost:5001/optimize-schedule', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Step 5: Check if Flask returns a solution
    if (flaskResponse.status === 200 && flaskResponse.data) {
      const solutionCsv = flaskResponse.data.solution;

      // Step 6: Delete existing results from database
      console.log("Clearing previous results from database...");
      await pool.query(`DELETE FROM ${schemaName}.results`);

      // Step 7: Insert new results into the database
      console.log("Inserting new results...");
      const insertQuery = `
        INSERT INTO ${schemaName}.results (skill, day, time_begin, time_end, price, require)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const solutionRows = csvToJson(solutionCsv); // Convert CSV to JSON

      for (const row of solutionRows) {
        await pool.query(insertQuery, [
          row.Skill,
          row.Day,
          row['From Hour'],
          row['To Hour'],
          row['Shift Cost'],
          row.Requirement
        ]);
      }

      // Step 8: Fetch available employees
      console.log("Fetching available employees...");
      const employeesAvailable = await getAvailableEmployees(schemaName);
  

      // Step 9: Run Greedy Algorithm
      console.log("Running Greedy Algorithm...");
      const assignments = runGreedyAlgorithm(solutionRows, employeesAvailable);
  

      // Step 10: Insert Greedy Algorithm results into assignments table
      await pool.query(`DELETE FROM ${schemaName}.assignments`); // Clear previous assignments

      const insertAssignmentQuery = `
        INSERT INTO ${schemaName}.assignments (skill, day, time_begin, time_end, price, require, emp1, emp2, emp3, emp4, emp5, emp6, emp7)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      for (const assignment of assignments) {
        await pool.query(insertAssignmentQuery, [
          assignment.Skill,
          assignment.Day,
          assignment.time_begin,
          assignment.time_end,
          assignment.price,
          assignment.Requirement,
          assignment.employees[0] || null,
          assignment.employees[1] || null,
          assignment.employees[2] || null,
          assignment.employees[3] || null,
          assignment.employees[4] || null,
          assignment.employees[5] || null,
          assignment.employees[6] || null
        ]);
      }

      res.json({ message: 'Schedule optimized, assignments saved in the database.' });
    } else {
      res.status(500).json({ error: 'Error from Flask server' });
    }
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

function runGreedyAlgorithm(shiftRequirements, employees) {
  const assignments = [];

  // Sort shift requirements by the number of required employees (descending order)
  shiftRequirements.sort((a, b) => b.require - a.require);

  // Create a map to track which employees are assigned to which days
  const employeeDayAssignments = {};

  // Iterate over each shift requirement
  for (const shift of shiftRequirements) {
    const { Skill, Day, time_begin, time_end, Requirement } = shift;
    let assignedEmployees = [];

    // Find employees who are skilled, still have availability, and haven't worked another shift on the same day
    for (const employee of employees) {
      // If the employee has already been assigned to a shift on the same day, skip them
      if (employeeDayAssignments[employee.name] && employeeDayAssignments[employee.name].includes(Day)) {
        continue;
      }

      if (assignedEmployees.length >= Requirement) break; // Stop once we meet the required number of employees

      // Check if the employee is skilled and has availability
      if (employee.shiftsWanted > employee.assignedShifts && employee.skills.includes(Skill)) {
        // Assign this employee to the shift
        assignedEmployees.push(employee.name);
        employee.assignedShifts++; // Increment the count of assigned shifts

        // Record that the employee has been assigned to this day
        if (!employeeDayAssignments[employee.name]) {
          employeeDayAssignments[employee.name] = [];
        }
        employeeDayAssignments[employee.name].push(Day);
      }
    }

    // Add the assignment result to the array
    assignments.push({
      Skill,
      Day,
      time_begin: shift['From Hour'],
      time_end: shift['To Hour'],
      price: shift['Shift Cost'], // Assuming the price is part of the shift
      Requirement,
      employees: assignedEmployees // List of assigned employees
    });
  }

  return assignments;
}


async function getAvailableEmployees(schemaName) {
  try {
    // Fetch all employees from the database
    const result = await pool.query(`SELECT * FROM ${schemaName}.employees`);
    return result.rows.map(employee => ({
      id: employee.id,
      name: employee.name,
      skills: [employee.skill1, employee.skill2, employee.skill3].filter(Boolean), // Filter out undefined or null skills
      shiftsWanted: employee.shifts_wanted, // Number of shifts they are willing to work
      assignedShifts: 0 // Track how many shifts they have been assigned
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Unable to fetch available employees');
  }
}


// Helper function to convert JSON to CSV format
function jsonToCsv(jsonArray) {
  const headers = Object.keys(jsonArray[0]);
  const csvRows = jsonArray.map(row =>
    headers.map(header => row[header]).join(',')
  );
  return [headers.join(','), ...csvRows].join('\n');
}

function csvToJson(csvString) {
  const [headerLine, ...lines] = csvString.split('\n').map(line => line.trim()).filter(line => line.length > 0); // Trim and filter out empty lines
  const headers = headerLine.split(',').map(header => header.trim()); // Trim whitespace from headers

  return lines.map(line => {
    const values = line.split(',').map(value => value.trim()); // Trim whitespace from values

    // Create an object for each line with header-value pairs
    const obj = headers.reduce((acc, header, index) => {
      acc[header] = values[index] !== undefined ? values[index] : null; // Handle missing values
      return acc;
    }, {});

    return obj;
  }).filter(row => {
    // Ensure each row has the required fields, e.g., 'Day', 'Skill', etc.
    return row.Day && row.Skill && row['From Hour'] && row['To Hour'] && row['Shift Cost'] && row.Requirement;
  });
}

// New Endpoint to get images
// Endpoint to get images
app.get('/get-images', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;

    // Get the company name from the user
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
    const companyName = userResult.rows[0].company_name;
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch image paths from the database
    const result = await pool.query(`SELECT path FROM ${schemaName}.skills_days_images`);
    console.log(result)
    // Prepare the response by mapping through the results
    const images = result.rows.map(row => ({
      path: row.path // Store the path to the image
    }));
    console.log(images);
    res.json(images); // Send the image paths back to the client
    console.log(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for creating charts and sending data to Flask
app.post('/charts', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;

    // Get the company name from the user
    const userResult = await pool.query('SELECT company_name FROM users WHERE email = $1', [email]);
    const companyName = userResult.rows[0].company_name;
    const schemaName = sanitizeSchemaName(companyName);

    // Fetch data from shifts_require and results tables without the ID field
    const shiftReqQuery = `SELECT day, skill, time_begin, time_end, require FROM ${schemaName}.shifts_require`;
    const resultsQuery = `SELECT skill, day, time_begin, time_end, price, require FROM ${schemaName}.results`;

    const shiftReqResult = await pool.query(shiftReqQuery);
    const resultsResult = await pool.query(resultsQuery);

    // Convert data to CSV format excluding IDs
    const shiftReqCsv = jsonToCsv(shiftReqResult.rows);
    const resultsCsv = jsonToCsv(resultsResult.rows);

    // Prepare form data to send to the Flask server
    const formData = new FormData();
    formData.append('last_req', shiftReqCsv, 'shifts_require.csv'); // Append shifts_require CSV
    formData.append('assigned_shifts', resultsCsv, 'results.csv'); // Append results CSV

    // Send data to Flask server
    const flaskResponse = await axios.post('http://localhost:5001/upload-csvs', formData, {
      headers: {
        ...formData.getHeaders() // Use form data headers
      }
    });

    if (flaskResponse.status === 200) {
      const plotPaths = flaskResponse.data.plot_paths; // Get the plot paths from the response
      await pool.query(`delete from ${schemaName}.skills_days_images`);
      // Insert each plot path into the database
      for (const path of plotPaths) {
        await pool.query(`INSERT INTO ${schemaName}.skills_days_images (path) VALUES ($1)`, [path]);
      }

      // Send a success message back to the client with the plot paths
      res.json({
        message: 'Charts created and images generated successfully.',
        plot_paths: plotPaths // Include the plot paths in the response
      });
    } else {
      res.status(500).json({ error: 'Error from Flask server' });
    }
  } catch (error) {
    console.error('Error creating charts:', error);
    res.status(500).json({ error: error.message });
  }
});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${8383}`);
});