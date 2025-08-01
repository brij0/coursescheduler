# Backend Setup Guide for Frontend Development

This guide provides step-by-step instructions to set up the backend environment. This will allow you to run the server locally and make API calls from the frontend.

## One-Time Setup

Follow these steps to configure your development environment for the first time.

### 1. Clone the Repository

First, clone the project repository to your local machine.

```bash
git clone <your-repository-url>
cd coursescheduler
```

### 2. Set Up Conda Environment

This project uses Conda for managing Python dependencies.

- If you don't have it, install [Miniconda](https://docs.conda.io/en/latest/miniconda.html).
- Create the Conda environment from the `conda.yaml` file:

```bash
conda env create -f conda.yaml
conda activate /opt/homebrew/Caskroom/miniconda/base/envs/coursescheduler
```

### 3. Install and Configure MySQL

The backend uses a MySQL database.

1. Download and install [MySQL Server](https://dev.mysql.com/downloads/mysql/) (version 8.0 or newer) from the official MySQL website.
2. During installation, you will be asked to set a root password. Remember it.
3. After installation, open the MySQL command line client or your preferred SQL GUI.

### 4. Create the Database and User

Run the following SQL commands to create the database and a dedicated user. Using these exact credentials will ensure your setup matches the team's standard, avoiding configuration issues.

```sql
-- Create a new user named 'localdev' with a password
CREATE USER 'localdev'@'localhost' IDENTIFIED BY 'CheckWP';

-- Create the database
CREATE DATABASE coursescheduler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant all permissions on the new database to the new user
GRANT ALL PRIVILEGES ON coursescheduler.* TO 'localdev'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
```

### 5. Configure Environment Variables

Create a `.env` file inside the `backend/` directory. This file stores the database credentials.

```env
DB_HOST=127.0.0.1
DB_USER=localdev
DB_PASSWORD=CheckWP
DB_NAME=coursescheduler
```

### 6. Set Up Django

Finally, apply the database migrations to set up the tables and create an admin user.

```bash
# Navigate to the backend directory
cd backend

# Apply database migrations
python manage.py migrate

# Create a superuser to access the admin panel
python manage.py createsuperuser
```

Follow the prompts to create your admin username and password.

## Daily Workflow

Follow these steps each time you start working on the project.

### 1. Activate Conda Environment

Always make sure your Conda environment is active.

```bash
conda activate /opt/homebrew/Caskroom/miniconda/base/envs/coursescheduler
```

### 2. Start the Backend Server

Run the Django development server from the backend directory.

```bash
cd backend
python manage.py runserver
```

The backend API will now be running at `http://127.0.0.1:8000/`. You can now make API calls from the frontend to this address.

## Team Collaboration - Sharing Database Data

### For Backend Developer (Data Provider)

If you have sample data, test data, or want to share your current database state with frontend developers:

```bash
# Export all data to a JSON fixture file
python manage.py dumpdata > sample.json

# Or export specific apps only (recommended for large databases)
python manage.py dumpdata courses users scheduling > sample.json

# Share this file with your team members
```

### For Frontend Developer (Data Receiver)

To load the shared data into your local database:

```bash
# 1. Make sure you've completed the one-time setup above
# 2. Apply all migrations first
python manage.py migrate

# 3. Load the shared data
python manage.py loaddata sample.json
```

**Important Notes:**
- Always run migrations **before** loading data
- The `sample.json` file should be placed in your project root or in any app's `fixtures/` directory
- This ensures both backend and frontend developers have the same test data to work with
- If you get conflicts, you may need to reset your database and start fresh

**Example workflow:**
```bash
# Backend developer shares data
python manage.py dumpdata > team_sample_data.json
# (shares file via Git, Slack, etc.)

# Frontend developer loads data
python manage.py migrate
python manage.py loaddata team_sample_data.json
python manage.py runserver
# Now frontend has same data as backend for testing
```

---