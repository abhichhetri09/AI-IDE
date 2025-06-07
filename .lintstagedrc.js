module.exports = {
  // Run type-check on changes to TypeScript files
  "**/*.ts?(x)": () => "npm run type-check",
  // Lint and format TypeScript and JavaScript files
  "**/*.(ts|tsx|js|jsx)": (filenames) => [
    "next lint",
    `npx prettier --write ${filenames.join(" ")}`,
  ],
  // Format MarkDown and JSON
  "**/*.(md|json)": (filenames) => `npx prettier --write ${filenames.join(" ")}`,
};
