// API Constants
const isProduction = true;

export const API_BASE_URL = isProduction
  ? "https://codecollab-t5uj.onrender.com/api"
  : "http://localhost:5000/api";

// Socket.IO Constants
export const SOCKET_URL = isProduction
  ? "https://codecollab-t5uj.onrender.com/"
  : "http://localhost:5000";

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "codecollab_token",
  USER: "codecollab_user",
  THEME: "codecollab_theme",
};

// User Roles
export const USER_ROLES = {
  TEACHER: "teacher",
  STUDENT: "student",
};

// Room Status
export const ROOM_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: "text",
  SYSTEM: "system",
  REACTION: "reaction",
};

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { id: "javascript", name: "JavaScript", monaco: "javascript" },
  { id: "python", name: "Python", monaco: "python" },
  { id: "java", name: "Java", monaco: "java" },
  { id: "cpp", name: "C++", monaco: "cpp" },
  { id: "html", name: "HTML", monaco: "html" },
  { id: "css", name: "CSS", monaco: "css" },
];

// Default Code Templates
export const CODE_TEMPLATES = {
  javascript: `// Welcome to CodeCollab JavaScript Editor
function hello(name) {
  return \`Hello, \${name}!\`;
}

console.log(hello("World"));`,

  python: `# Welcome to CodeCollab Python Editor
def hello(name):
    return f"Hello, {name}!"

print(hello("World"))`,

  java: `// Welcome to CodeCollab Java Editor
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,

  cpp: `// Welcome to CodeCollab C++ Editor
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`,

  css: `/* Welcome to CodeCollab CSS Editor */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}`,
};

// Reactions
export const REACTIONS = [
  { emoji: "👍", name: "thumbs-up" },
  { emoji: "👎", name: "thumbs-down" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😊", name: "smile" },
  { emoji: "🎉", name: "celebration" },
  { emoji: "🤔", name: "thinking" },
  { emoji: "💡", name: "idea" },
  { emoji: "👏", name: "clap" },
];

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: "Logged in successfully!",
  LOGIN_ERROR: "Invalid email or password",
  REGISTER_SUCCESS: "Account created successfully!",
  REGISTER_ERROR: "Failed to create account",
  ROOM_CREATED: "Room created successfully!",
  ROOM_JOINED: "Joined room successfully!",
  ROOM_LEFT: "Left room successfully",
  NETWORK_ERROR: "Network error. Please try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
};

// Animation Durations (in ms)
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};
