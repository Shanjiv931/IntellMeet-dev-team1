function App() {
  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "20px 60px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h2>IntellMeet</h2>

        <div>
          <button
            style={{
              marginRight: "10px",
              padding: "10px 20px",
            }}
          >
            Login
          </button>

          <button
            style={{
              padding: "10px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      <section
        style={{
          textAlign: "center",
          padding: "100px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "60px",
            marginBottom: "20px",
          }}
        >
          AI-Powered Meetings
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#64748b",
          }}
        >
          Collaborate smarter with video meetings,
          AI summaries, and team productivity tools.
        </p>
      </section>
    </div>
  );
}

export default App;