# 🏈 NFL Weekly Picks Application

A full-stack web application for NFL weekly pick'em contests with real-time scoring and leaderboards.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Weekly Picks**: Submit picks for NFL games with deadline enforcement
- **Real-time Scoring**: Automatic scoring based on actual NFL game results
- **Leaderboards**: Season-long and weekly leaderboards with rankings
- **Responsive Design**: Mobile-friendly interface built with React and Tailwind CSS
- **API Integration**: Real NFL data integration with fallback mock data
- **Automated Updates**: Cron jobs for score updates during game windows

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express
- **PostgreSQL** database with Sequelize ORM
- **JWT** authentication
- **bcrypt** for password hashing
- **Helmet** for security
- **Rate limiting** for API protection

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **PostgreSQL 15** database
- **CORS** enabled for cross-origin requests

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- NFL API key (optional - app works with mock data)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nfl-picks
   ```

2. **Configure environment variables** (optional)
   ```bash
   # Edit docker-compose.yml to update these values:
   # - JWT_SECRET: Change to a secure random string
   # - NFL_API_KEY: Add your NFL API key (optional)
   # - Database credentials (if needed)
   ```

3. **Set up the IP address (for VM deployment)**
   ```bash
   ./setup-ip.sh
   ```

4. **Build and start the application**
   ```bash
   ./restart.sh
   ```
   
   Or manually:
   ```bash
   docker-compose --env-file .env up --build
   ```

5. **Access the application**
   - Frontend: http://[YOUR-VM-IP]:3000
   - Backend API: http://[YOUR-VM-IP]:5000
   - Database: [YOUR-VM-IP]:5432

### Default Test User
- Email: `test@example.com`
- Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Games
- `GET /api/games/week/:week` - Get games for a specific week
- `GET /api/games/current-week` - Get current NFL week

### Picks
- `GET /api/picks/week/:week` - Get user's picks for a week
- `POST /api/picks` - Submit picks for multiple games
- `GET /api/picks/deadline` - Get picks deadline information

### Leaderboard
- `GET /api/leaderboard` - Get overall season leaderboard
- `GET /api/leaderboard/week/:week` - Get weekly leaderboard

## How It Works

### Pick Submission Window
- **Opens**: Tuesday 6:00 AM CT
- **Closes**: Thursday 12:00 PM CT
- **Games**: Thursday, Sunday, and Monday NFL games

### Scoring System
- **1 point** for each correct pick
- **0 points** for incorrect picks
- Automatic scoring during game windows (Thursday 7 PM - Monday 11:59 PM CT)

### Game Data
- Integrates with NFL sports data APIs
- Falls back to realistic mock data if no API key provided
- Automatic score updates via scheduled jobs

## Development

### Project Structure
```
nfl-picks/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── models/         # Sequelize database models
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql            # Database initialization script
├── docker-compose.yml       # Docker compose configuration
└── README.md
```

### Running in Development Mode

1. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database Setup**
   ```bash
   # Run PostgreSQL locally or use Docker
   docker run --name nfl-picks-db -e POSTGRES_DB=nfl_picks -e POSTGRES_PASSWORD=password123 -p 5432:5432 -d postgres:15
   ```

## Configuration

### Environment Variables

The application can be configured via environment variables in `docker-compose.yml`:

- `JWT_SECRET`: Secret key for JWT token signing
- `NFL_API_KEY`: API key for NFL data (optional)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database configuration
- `NODE_ENV`: Environment (development/production)

### NFL API Integration

To use real NFL data, sign up for a sports data API service and add your API key to the `docker-compose.yml` file. The application includes mock data generation as a fallback.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- CORS protection
- SQL injection prevention via Sequelize ORM
- Input validation and sanitization

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts and authentication
- **games**: NFL game schedule and scores
- **picks**: User predictions for games

## Deployment

### Production Deployment

1. **Update configuration**
   - Change JWT_SECRET to a secure value
   - Update CORS origins to your domain
   - Configure proper database credentials
   - Add real NFL API key

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Set up reverse proxy** (optional)
   - Configure nginx or similar for SSL termination
   - Set up domain routing

### Backup Strategy

The application includes automated database backups via Docker volumes. For production:

1. Set up regular database backups
2. Monitor application logs
3. Configure health checks
4. Set up monitoring and alerting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include logs and error messages when applicable

## Adding Groups

---

**Note**: This application is designed for the 2025-2026 NFL season. Dates and team information may need updates for future seasons.