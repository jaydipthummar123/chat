# ChatApp - Real-time Chat Application

A modern real-time chat application built with Next.js, Socket.IO, and MySQL. Features include real-time messaging, unread message notifications, room management, and user authentication.

## Features

- 🔐 **User Authentication** - JWT-based authentication system
- 💬 **Real-time Messaging** - Instant message delivery using Socket.IO
- 📱 **Unread Message Notifications** - Visual indicators for unread messages
- 🏠 **Room Management** - Create and join chat rooms
- 👥 **User Presence** - See who's online and typing
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔔 **Toast Notifications** - Beautiful notification system
- 🎨 **Modern UI** - Clean and intuitive interface

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Socket.IO
- **Database**: MySQL
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **UI Components**: Lucide React Icons
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=chat_app

   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here

   # Socket.IO Port (optional, defaults to 3001)
   SOCKET_PORT=3001
   ```

4. **Set up the database**
   - Create a MySQL database named `chat_app`
   - Run the SQL schema from `sql/schema.mysql.sql`

5. **Start the development servers**
   ```bash
   # Start both Next.js and Socket.IO servers
   npm run dev:all
   
   # Or start them separately:
   # Terminal 1: Next.js development server
   npm run dev
   
   # Terminal 2: Socket.IO server
   npm run socket
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Database Schema

The application uses the following MySQL tables:

- **users** - User accounts and authentication
- **rooms** - Chat rooms
- **room_members** - Room membership and last read timestamps
- **messages** - Chat messages
- **message_reads** - Read receipts (optional)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Rooms
- `GET /api/rooms` - Get user's rooms with unread counts
- `POST /api/rooms` - Create a new room

### Messages
- `GET /api/messages?roomId={id}` - Get messages for a room

### Unread Messages
- `GET /api/unread` - Get unread message counts

### Socket.IO Events

#### Client to Server
- `join_room` - Join a chat room
- `send_message` - Send a message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `mark_read` - Mark messages as read

#### Server to Client
- `new_message` - New message received
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing
- `messages_read` - Messages marked as read
- `error` - Error message

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── messages/      # Message endpoints
│   │   ├── rooms/         # Room endpoints
│   │   ├── socket/        # Socket.IO endpoint
│   │   └── unread/        # Unread message endpoints
│   ├── chat/              # Chat pages
│   └── layout.js          # Root layout
├── components/            # React components
│   ├── ChatRoomClient.jsx # Main chat interface
│   ├── Navbar.jsx         # Navigation bar
│   ├── RoomsList.jsx      # Room sidebar
│   └── Ui/                # UI components
├── context/               # React contexts
│   ├── AuthContext.jsx    # Authentication context
│   └── SocketContext.jsx  # Socket.IO context
├── lib/                   # Utility libraries
│   ├── auth.js           # Authentication utilities
│   └── db.js             # Database connection
└── middleware/            # Middleware
    └── auth.js           # JWT verification
```

## Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Create Rooms**: Use the "New Room" button in the navbar to create chat rooms
3. **Join Rooms**: Click on any room in the sidebar to join and start chatting
4. **Send Messages**: Type in the message input and press Enter or click Send
5. **View Unread Messages**: Unread message counts are shown in the navbar and room list

## Development

### Running in Development Mode
```bash
npm run dev:all
```

### Building for Production
```bash
npm run build
npm start
```

### Running Socket.IO Server Separately
```bash
npm run socket
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `` |
| `DB_NAME` | MySQL database name | `chat_app` |
| `JWT_SECRET` | JWT signing secret | `supersecretkey` |
| `SOCKET_PORT` | Socket.IO server port | `3001` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
