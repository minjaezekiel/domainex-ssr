export default function App(props) {
  const { user = "Guest", title = "React SSR" } = props;

  return (
    <div className="wrap">
      <h1>{title}</h1>

      <div className="card">
        <p>
          Hello <b>{user}</b> 👋
        </p>

        <p>
          This component was rendered with <code>ReactDOMServer.renderToString()</code>.
        </p>

        <div className="row">
          <span className="pill">Framework: React</span>
          <span className="pill">SSR: enabled</span>
          <span className="pill">Engine: DomainEx</span>
        </div>

        <p style={{ marginTop: 14 }}>
          Try:{" "}
          <a href="/react?user=Ezekiel">/react?user=Ezekiel</a>
        </p>
      </div>

      <div className="card">
        <p>Other routes:</p>
        <ul>
          <li><a href="/vue">/vue</a></li>
          <li><a href="/vanilla">/vanilla</a></li>
        </ul>
      </div>
    </div>
  );
}
