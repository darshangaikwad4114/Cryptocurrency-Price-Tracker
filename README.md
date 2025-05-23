# Cryptocurrency Price Tracker

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?logo=axios&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chart.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A modern, responsive cryptocurrency tracking application that provides real-time data on cryptocurrency prices, market caps, volumes, and price changes. The application features an intuitive user interface with filtering, sorting, and multiple view modes to help users easily track their favorite cryptocurrencies.

## 📋 Features

- **Real-time Data**: Fetches and displays up-to-date cryptocurrency data with automatic refresh every 60 seconds
- **Multiple View Modes**: Toggle between grid and list layouts for different data visualization preferences
- **Advanced Filtering**: Filter cryptocurrencies by price range, market cap categories, and custom search parameters
- **Interactive Sorting**: Sort by market cap, price, volume, or alphabetically in ascending or descending order
- **Visual Price Indicators**: Color-coded price changes with intuitive up/down indicators
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Comprehensive Market Dashboard**: Global insights, category metrics, and market trends in one place
- **Loading States**: Smooth skeleton loading states for enhanced user experience
- **Error Handling**: Robust error handling with fallback data and clear user messaging
- **Historical Price Charts**: Interactive charts showing price history over different time periods (24h, 7d, 30d, 90d, 1y)
- **Cryptocurrency News Feed**: Latest news from the crypto industry powered by CryptoCompare API
- **Detailed Coin Information**: Comprehensive metrics and information for each cryptocurrency
- **Market Insights**: Key market metrics including global statistics, Bitcoin dominance, and volume analytics

## 🌟 New Features - Enhanced Market Dashboard

- **Global Market Insights**: Real-time data on total market capitalization, 24h volume, and market changes
- **Trending Cryptocurrencies**: Display of the most searched and trending coins in the market
- **Category Analysis**: Explore different cryptocurrency sectors (DeFi, NFT, Gaming, etc.) and their performance
- **Market Screeners**: Advanced views for top movers, exchanges, and NFT collections
- **Optimized API Integration**: Efficient data fetching with smart caching to handle rate limits
- **Cross-Category Metrics**: Comprehensive data visualization across different segments of the crypto market

## 🛠️ Tech Stack

- **Frontend Framework**: React.js with functional components and hooks
- **HTTP Client**: Axios for API requests
- **Charting**: Chart.js with react-chartjs-2 for interactive price charts
- **Styling**: Custom CSS3 with variables, animations, and responsive design
- **API**: CoinGecko cryptocurrency data API and CryptoCompare news API
- **Development Environment**: Vite for fast development and optimized builds
- **State Management**: React's built-in useState and useEffect hooks

## 🚀 Installation

Follow these steps to set up the project locally:

1. **Clone the repository**
  ```sh
  git clone https://github.com/darshangaikwad4114/Cryptocurrency-Price-Tracker.git
  ```
2. **Navigate to the project directory**
  ```sh
  cd Cryptocurrency-Price-Tracker
  ```
3. **Install dependencies**
  ```sh
  npm install
  ```
4. **Start the development server**
  ```sh
  npm run dev
  ```
5. **Open the application**
  Open your browser and navigate to `http://localhost:5173` to see the application in action.

## 🖥️ Project Structure

```
cryptocurrency-price-tracker/
│
├── public/               # Static files
├── src/                  # Source files
│   ├── assets/           # Images, logos, icons
│   ├── components/       # React components
│   │   ├── Coin/         # Coin card/list item component
│   │   ├── CoinDetail/   # Detailed view for individual coins
│   │   ├── GlobalInsights/ # Global market metrics
│   │   ├── CategoryInsights/ # Cryptocurrency category analysis
│   │   ├── HistoricalChart/  # Price history charts
│   │   ├── MarketMetrics/    # Market metrics display
│   │   ├── MarketScreener/   # Advanced market screeners
│   │   ├── MarketSummary/    # Market overview data
│   │   └── NewsFeed/         # Cryptocurrency news component
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions and API helpers
│   ├── App.jsx           # Main application component
│   ├── App.css           # Main styles
│   └── main.jsx          # Application entry point
├── .eslintrc.cjs         # ESLint configuration
├── index.html            # HTML entry point
├── package.json          # Project dependencies and scripts
└── vite.config.js        # Vite configuration
```

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
  ```sh
  git checkout -b feature-name
  ```
3. **Commit your changes**
  ```sh
  git commit -m 'Add some feature'
  ```
4. **Push to the branch**
  ```sh
  git push origin feature-name
  ```
5. **Open a pull request**

## 📞 Contact

For any inquiries or feedback, please reach out to [darshangaikwad4114@gmail.com](mailto:darshangaikwad4114@gmail.com).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


