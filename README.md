# Resumer - Resume Management Platform

A full-stack web application that connects candidates and recruiters through a resume database system. Candidates can create and manage their resumes, while recruiters can search and filter through candidate profiles.

## Features

### For Candidates
- Create and manage a single resume profile
- Add personal information, skills, projects, and experience
- Update resume details anytime
- Secure JWT-based authentication

### For Recruiters
- Search resumes by keywords
- Filter by skills, role, and experience level
- View candidate profiles with detailed information
- Paginated search results

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **CORS** enabled for frontend communication

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design
- Role-based dashboards

## Project Structure

```
resumer/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── models/
│   │   │   ├── User.js        # User model (candidate/recruiter)
│   │   │   └── Resume.js      # Resume model
│   │   ├── routes/
│   │   │   ├── auth.js        # Authentication routes
│   │   │   ├── candidate.js   # Candidate routes
│   │   │   └── recruiter.js   # Recruiter routes
│   │   └── middleware/
│   │       └── auth.js        # JWT authentication middleware
│   └── package.json
└── frontend/
    ├── index.html             # Landing page
    ├── login.html             # Login page
    ├── signup.html            # Registration page
    ├── user-dashboard.html    # Candidate dashboard
    ├── recruiter-dashboard.html # Recruiter dashboard
    ├── script.js              # Frontend JavaScript
    └── style.css              # Styles
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Swayam7Garg/Resumer.git
   cd resumer
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Start the backend server**
   ```bash
   npm run dev    # Development mode with nodemon
   # or
   npm start      # Production mode
   ```

5. **Open the frontend**
   Open `frontend/index.html` in your browser or use a live server.

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login and receive JWT token

### Candidate Routes
- `GET /candidate/resume` - Get own resume
- `POST /candidate/resume` - Create resume
- `PUT /candidate/resume` - Update resume
- `DELETE /candidate/resume` - Delete resume

### Recruiter Routes
- `GET /recruiter/search` - Search resumes with filters
  - Query params: `q`, `skills`, `role`, `experience`, `page`, `page_size`

## Usage

1. **Sign up** as either a candidate or recruiter
2. **Candidates**: Create your resume with skills, experience, and projects
3. **Recruiters**: Search and filter through candidate resumes
4. All routes (except auth) require JWT token in Authorization header

## Security

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Role-based access control (candidate/recruiter)
- Protected routes with middleware

## Author

Swayam Garg , Ajay Kumar Sahani
