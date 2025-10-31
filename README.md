# 🐦 Twitter Repost Assistant

A Chrome extension that helps you save, schedule, and repost interesting Twitter content with one click.

## ✨ Features

- **One-Click Save**: Save any tweet as a draft while browsing Twitter
- **Smart Scheduling**: AI-powered optimal posting time recommendations
- **Batch Operations**: Schedule multiple posts at once
- **Media Support**: Handle images and videos from original tweets
- **Content Management**: Edit, organize, and manage your saved drafts
- **Auto-Scheduling**: Spread posts throughout the day for better engagement
- **Duplicate Detection**: Avoid posting similar content multiple times

## 🚀 Installation

### From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/twitter-repost-assistant.git
   cd twitter-repost-assistant
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the extension folder

5. The extension will be loaded and ready to use!

## 🔧 Setup

### Twitter API Configuration

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app and get your API credentials
3. Open the extension options page
4. Enter your API Key and Secret (optional - extension has built-in OAuth)

### First Time Setup

1. Click the extension icon in your browser toolbar
2. Click "Connect Twitter Account" to authenticate
3. Start browsing Twitter and save interesting posts!

## 📖 How to Use

### Saving Tweets

1. Browse Twitter normally
2. When you see a tweet you want to repost, click the "Save" button that appears
3. The tweet will be saved to your drafts

### Managing Drafts

1. Click the extension icon to open the popup
2. View your saved drafts in the "Drafts" tab
3. Edit, schedule, or post tweets directly

### Scheduling Posts

1. Open a draft and click "Schedule"
2. Choose a specific time or use smart scheduling
3. The extension will automatically post at the scheduled time

### Smart Scheduling

The extension analyzes your account's engagement patterns and suggests optimal posting times:
- **Peak Hours**: When your followers are most active
- **Content Spacing**: Avoids posting too frequently
- **Time Zone Optimization**: Considers your audience's location

## 🎯 Use Cases

- **Content Curation**: Save interesting posts for later sharing
- **Social Media Management**: Schedule posts for optimal engagement
- **Content Inspiration**: Build a library of shareable content
- **Automated Posting**: Maintain consistent social media presence
- **Cross-Platform Sharing**: Repost content across different accounts

## 🔒 Privacy & Security

- **Local Storage**: All drafts are stored locally on your device
- **Secure Authentication**: Uses Twitter's official OAuth 2.0
- **No Data Collection**: We don't collect or store your personal data
- **Open Source**: Fully transparent codebase

## 🛠️ Development

### Project Structure

```
twitter-repost-extension/
├── manifest.json              # Extension configuration
├── background/
│   └── service-worker.js      # Background tasks and API handling
├── content/
│   ├── inject.js             # Content script for Twitter pages
│   └── styles.css            # Styles for injected elements
├── popup/
│   ├── popup.html            # Extension popup interface
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup functionality
├── options/
│   ├── options.html          # Settings page
│   ├── options.css           # Settings styles
│   └── options.js            # Settings functionality
├── lib/
│   └── twitter-api.js        # Twitter API integration
└── icons/                    # Extension icons
```

### Building from Source

1. Install dependencies (if any):
   ```bash
   npm install
   ```

2. Make your changes to the source code

3. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find the extension and click the refresh icon

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📋 Roadmap

### Version 1.1
- [ ] Thread creation from multiple saved tweets
- [ ] Quote tweet functionality
- [ ] Analytics dashboard
- [ ] Bulk operations

### Version 1.2
- [ ] Cross-platform support (Firefox, Safari)
- [ ] Team collaboration features
- [ ] Advanced content filtering
- [ ] Integration with other social platforms

### Version 2.0
- [ ] AI-powered content suggestions
- [ ] Automated content creation
- [ ] Advanced analytics and insights
- [ ] Enterprise features

## 🐛 Troubleshooting

### Common Issues

**Extension not working on Twitter:**
- Make sure you're on twitter.com or x.com
- Refresh the page and try again
- Check if the extension is enabled

**Authentication issues:**
- Disconnect and reconnect your Twitter account
- Clear extension data and start fresh
- Check your internet connection

**Scheduled tweets not posting:**
- Ensure your computer is on at the scheduled time
- Check if the extension has permission to run in the background
- Verify your Twitter account is still connected

### Getting Help

- Check the [Issues](https://github.com/your-username/twitter-repost-assistant/issues) page
- Create a new issue with detailed information
- Join our [Discord community](https://discord.gg/your-server)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Twitter API for providing the platform
- Chrome Extensions team for the development framework
- Open source community for inspiration and contributions

## 📞 Support

- **Email**: support@twitterrepost.com
- **Twitter**: [@TwitterRepost](https://twitter.com/twitterrepost)
- **GitHub**: [Issues](https://github.com/your-username/twitter-repost-assistant/issues)

---

Made with ❤️ for the Twitter community
