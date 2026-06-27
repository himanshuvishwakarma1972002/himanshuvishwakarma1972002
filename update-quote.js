const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "README.md");
const QUOTES_PATH = path.join(__dirname, "quotes.json");

const QUOTE_THEME = {
  theme: "dark",
  bg_color: "0d1117",
  author_color: "79c0ff",
  accent_color: "58a6ff",
};

function buildQuoteCard(quote, author) {
  const params = new URLSearchParams({
    author,
    quote,
    ...QUOTE_THEME,
  });

  return `
<!--STARTS_HERE_QUOTE_CARD-->
<p align="center">
    <img src="https://readme-daily-quotes.vercel.app/api?${params.toString()}">
</p>
<!--ENDS_HERE_QUOTE_CARD-->
`;
}

function updateQuote() {
  try {
    const quotes = require(QUOTES_PATH);
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const { quote, author } = quotes[randomIndex];

    const cardDesign = buildQuoteCard(quote, author);
    let readmeContent = fs.readFileSync(README_PATH, "utf-8");

    readmeContent = readmeContent.replace(
      /<!--STARTS_HERE_QUOTE_CARD-->[\s\S]*?<!--ENDS_HERE_QUOTE_CARD-->/,
      cardDesign.trim()
    );

    fs.writeFileSync(README_PATH, readmeContent);
    console.log(`Quote updated: "${quote}" — ${author}`);
  } catch (error) {
    console.error("Error updating quote:", error.message);
    process.exit(1);
  }
}

updateQuote();
