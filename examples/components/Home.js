module.exports = function Home(props) {
  const user = props.user || "Guest";
  const title = props.title || "Vanilla SSR";

  return `
    <div class="wrap">
      <h1>${title}</h1>

      <div class="card">
        <p>Hello <b>${user}</b> 👋</p>

        <p>
          This component was rendered as a plain function returning HTML.
        </p>

        <div class="row">
          <span class="pill">Framework: Vanilla</span>
          <span class="pill">SSR: enabled</span>
          <span class="pill">Engine: DomainEx</span>
        </div>

        <p style="margin-top: 14px">
          Try: <a href="/vanilla?user=Ezekiel">/vanilla?user=Ezekiel</a>
        </p>
      </div>

      <div class="card">
        <p>Other routes:</p>
        <ul>
          <li><a href="/react">/react</a></li>
          <li><a href="/vue">/vue</a></li>
        </ul>
      </div>
    </div>
  `;
};
