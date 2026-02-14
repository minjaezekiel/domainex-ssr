module.exports = function Home(props) {
  return `
    <main style="font-family: sans-serif; padding: 24px;">
      <h1>Welcome, ${props.name}</h1>
      <p>This page was rendered by DomainEx.</p>
    </main>
  `;
};
