# TextureProPrompt

AI-Powered Professional Prompt Generator for Adobe Stock content creation.

## 🚀 Features

- **3 Specialized Generators**: Texture, AbstractWave, and Sky prompts
- **5 Specialized Generators**: Texture, AbstractWave, Sky, White Frame, and GradientFlow prompts
- **AI-Powered**: Uses Google Gemini for intelligent prompt generation
- **Auto-Save**: Automatically saves your work to the cloud every 3 seconds
- **Smart Learning**: Learns from user feedback via Supabase
- **CSV Export**: Direct export for Adobe Stock metadata upload
- **Cloud Sync**: Access your work from any device
- **Professional Quality**: Generates titles, keywords, and optimized prompts
- **Project Management**: Save and organize multiple CSV projects

## 🛠️ Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TextureProPrompt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Get API Keys**
   - **Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Supabase**: Create project at [Supabase](https://supabase.com) and get URL + anon key

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔒 Security

- All sensitive data is stored in environment variables
- `.env` file is gitignored for security
- Use `.env.example` as a template
- Never commit API keys to version control
- Email confirmation is disabled for immediate sign-in
- Users can sign in immediately after account creation

## 📊 Database Setup (Optional)

If using Supabase for AI training:
1. Run the migration in `supabase/migrations/create_feedback_tables.sql`
2. This enables AI learning from user feedback

## 🎯 Usage

1. **Select Generator**: Choose Texture, AbstractWave, or Sky
1. **Select Generator**: Choose from 5 different generators
2. **Generate Prompts**: Use "Auto-Generate Everything!" for best results
3. **Provide Feedback**: Click 👍👎😐 to train the AI
4. **Export CSV**: Add prompts to CSV for Adobe Stock upload
5. **Auto-Save**: Your work is automatically saved to the cloud when signed in

## 🤖 AI Training

The system learns from user feedback:
- **👍 Like**: AI learns to generate similar prompts
- **👎 Dislike**: AI avoids similar combinations
- **😐 Neutral**: Neutral data point for training

## ☁️ Auto-Save Features
## 📝 License

When signed in, the app automatically:
- **Saves CSV data** every 3 seconds after changes
- **Backs up all prompts** to your personal cloud storage
- **Syncs across devices** - access your work anywhere
- **Preserves history** - never lose your generated content
- **Configurable intervals** - adjust save frequency in settings
MIT License - feel free to use for your projects!