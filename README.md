# File Drive
File storage application made using an Express API with a database in Postgres and views in Pug.

## Features
- Uploading files up to 3MB and organizing them in folders
- File storage in a cloud service (Cloudinary)
- CRUD operations on PostgreSQL database
- Authentication and authorization of users
- Sharing files and folders, with ability to set an expiration date

## Environment Variables
```plaintext
DATABASE_URL=postgresql://your_db_url
SECRET=secret_key
CLOUDINARY_URL=cloudinary://cloudinary_url
```

## API Routes
### Auth Routes

Routes related to user authentication, including signup, login, and logout.

| Method | Endpoint          | Description               |
|--------|--------------------|---------------------------|
| GET    | `/signup`    | Display signup form       |
| POST   | `/signup`    | Process signup form       |
| GET    | `/login`     | Display login form        |
| POST   | `/login`     | Process login form        |
| GET    | `/logout`    | Logout the current user   |

### File Routes

Routes for handling files, including upload, detail view, movement, deletion, and sharing.

| Method | Endpoint                    | Description                                    |
|--------|------------------------------|------------------------------------------------|
| POST   | `/file/upload`              | Upload a new file                              |
| GET    | `/file/:id`                 | View details of a specific file                |
| POST   | `/file/:id/move`            | Move a file to a different location            |
| POST   | `/file/:id/delete`          | Delete a specific file                         |
| GET    | `/file/:id/share`           | Display sharing options for a specific file    |
| POST   | `/file/:id/share`           | Share a file                                   |
| GET    | `/share/file/:id`           | Display a shared file for public access        |

### Folder Routes

Routes for managing folders, including creation, deletion, and sharing.

| Method | Endpoint                     | Description                                        |
|--------|-------------------------------|----------------------------------------------------|
| GET    | `/folder/:id`                | View a specific folder's contents                  |
| POST   | `/folder/new`                | Create a new folder                                |
| GET    | `/folder/:id/delete`         | Display delete confirmation for a specific folder  |
| POST   | `/folder/:id/delete`         | Delete a specific folder                           |
| GET    | `/folder/:id/share`          | Display sharing options for a specific folder      |
| POST   | `/folder/:id/share`          | Share a folder                                     |
| GET    | `/share/folder/:id`          | Display a shared folder for public access          |

### Index Routes

Main route for loading the application homepage.

| Method | Endpoint | Description                 |
|--------|----------|-----------------------------|
| GET    | `/`      | Display the main homepage   |
