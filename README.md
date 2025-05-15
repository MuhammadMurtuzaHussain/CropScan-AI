# CropScanAI

A web application that analyzes crop images using AI to determine crop health status. Built with React.js and Node.js, powered by Google Cloud Vertex AI.

## Features

- 📷 Upload crop images
- 🔍 AI-powered crop health analysis
- 📊 Confidence score display
- 💡 Health recommendations
- 🎯 Simple and intuitive interface

## Prerequisites

Before running the application, make sure you have:

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Cloud CLI installed
- Access to Google Cloud Vertex AI

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cropscan-ai.git
cd cropscan-ai
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. Configure Google Cloud:
```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project crop-scan-ai
```

## Running the Application

1. Start the backend server:
```bash
cd backend
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/gcp-cred.json"
node server.js
```
The backend will run on http://localhost:3001

2. In a new terminal, start the frontend:
```bash
cd ..  # Go back to project root
npm start
```
The frontend will run on http://localhost:3000

## Known Issues

- Vertex AI endpoint connectivity issues may occur
- Access token needs manual refresh
- Image processing limitations

## Future Improvements

- [ ] Implement automatic token refresh
- [ ] Add better error handling
- [ ] Improve AI model accuracy
- [ ] Add support for multiple crop types
- [ ] Implement user authentication

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
