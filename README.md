# Gemini AI Chatbot

A modern, responsive chatbot interface built with Next.js 14 and Google Gemini AI, featuring real-time streaming responses and a beautiful UI powered by Shadcn components.

## 🚀 Features

### Core Features
- **Modern Chat Interface** - Clean, intuitive chat UI with message bubbles
- **Real-time Streaming** - AI responses stream in real-time as they're generated
- **Responsive Design** - Works seamlessly across desktop, tablet, and mobile devices
- **Chat Management** - Create, delete, and manage multiple chat conversations
- **Auto-scroll** - Automatically scrolls to the latest message

### Bonus Features
- **Dark/Light Mode Toggle** - Seamless theme switching with system preference support
- **Message Copy Functionality** - One-click copy for AI responses
- **Chat History Persistence** - Conversations are saved and persist across sessions
- **Loading Animations** - Smooth loading states and typing indicators
- **Error Handling** - Graceful error handling with user-friendly messages

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI Components
- **AI Integration**: Google Gemini API (@google/generative-ai)
- **State Management**: Zustand
- **Theme**: next-themes
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sathyam1020/Gemini-chat-app.git
cd Gemini-chat-app
```

### 2. Install Dependencies

```bash
npm install

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env.local` file

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 API Routes

### POST /api/chat

Handles chat messages and returns streaming responses from Google Gemini.

**Request Body:**
```json
[
    {
        "role": "user",
        "text": "hey"
    }
]
```

**Response:**
- Streaming text response from Gemini AI
- Content-Type: text/plain
- Transfer-Encoding: chunked

## 🎨 UI Components

The project uses Shadcn UI components for a consistent, accessible design:

- **AlertDialog** - Confirmation dialogs for chat deletion
- **Button** - Interactive buttons with variants
- **Card** - Container for chat items
- **DropdownMenu** - Theme selection menu
- **Sidebar** - Navigation and chat management
- **Toast** - Notification system

## 🔄 State Management

Uses Zustand for lightweight, efficient state management:

```typescript
interface ChatStore {
  chatHistories: Chat[];
  chatId: string | null;
  loading: boolean;
  currentStream: string;
  
  // Actions
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  sendMessage: (message: string) => Promise<void>;
  // ... more actions
}
```

## 🌙 Theme System

Implements a complete dark/light theme system:

- **System preference detection**
- **Manual theme switching**
- **Persistent theme selection**
- **Smooth transitions**

## 📱 Responsive Design

- **Mobile-first approach**
- **Flexible layouts** that adapt to screen sizes
- **Touch-friendly interactions**
- **Optimized for all devices**

## 🔄 Streaming Implementation

Real-time response streaming using:

```typescript
// API Route
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.stream) {
      controller.enqueue(new TextEncoder().encode(chunk.text()));
    }
    controller.close();
  },
});

// Frontend
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  setCurrentStream(prev => prev + chunk);
}
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your `GEMINI_API_KEY` environment variable in Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `out` folder to [Netlify](https://netlify.com)
3. Add environment variables in Netlify dashboard

## 🔒 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Google Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Customize API settings
GEMINI_MODEL=gemini-pro
```

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Consistent naming conventions**

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**
   - Ensure your Gemini API key is correctly set in `.env.local`
   - Verify the key is active in Google AI Studio

2. **Streaming Not Working**
   - Check browser console for errors
   - Verify API route is responding correctly

3. **UI Components Not Loading**
   - Ensure all Shadcn components are properly installed
   - Check import paths

4. **Theme Toggle Not Working**
   - Verify `next-themes` is properly configured
   - Check ThemeProvider wrapper in layout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for the powerful AI capabilities
- [Shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling
- [Next.js](https://nextjs.org/) for the excellent React framework

---

**Built with ❤️ using Next.js and Google Gemini AI**