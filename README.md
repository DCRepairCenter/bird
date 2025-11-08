# The Little Bird of Night Patrol

This is a simple web-based game built with HTML, CSS, JavaScript, and a Go backend.

## Project Structure

- `public/`: Contains all the frontend assets (HTML, CSS, JS).
- `main.go`: The Go backend that serves the frontend files.
- `package.json`: Defines the frontend dependencies and scripts.

## Getting Started

### Frontend

To run the frontend development server, use the following command:

```bash
npm run dev
```

This will start a Vite development server, typically on `http://localhost:5173`.

### Backend

To run the Go backend, you need to have Go installed on your system. If you don't have it, you can download it from [https://golang.org/](https://golang.org/).

Once Go is installed, you can run the backend with the following commands:

```bash
go mod init bird
go run main.go
```

This will start the Go server on `http://localhost:8080`, which will serve the contents of the `public` directory.

### Production Build

To create a production build of the frontend, run:

```bash
npm run build
```

This will create a `dist` directory with the optimized and minified frontend assets. You can then deploy this `dist` directory to any static hosting service or serve it with the Go backend by changing the directory in `main.go` from `public` to `dist`.