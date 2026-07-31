export default function FirstRun({ onComplete }: { onComplete: () => void }) {
  return (
    <>
      <h1 className="page-title">First Run Wizard</h1>
      <p className="page-sub">Welcome to Avalon Agentique Platform. No API keys required to start.</p>
      <ol className="mono" style={{ lineHeight: 1.8 }}>
        <li>Welcome</li>
        <li>Verify environment</li>
        <li>Initialize secure vault (already created by Core bootstrap)</li>
        <li>Create local identity</li>
        <li>Select workspace location (default LocalAppData)</li>
        <li>Detect Excel (optional)</li>
        <li>Detect local models (optional)</li>
        <li>Select offline/network policy (default OFFLINE LOCK)</li>
        <li>Create recovery/backup policy</li>
        <li>Finish</li>
      </ol>
      <button
        className="primary"
        onClick={() => {
          localStorage.setItem("avalon_first_run_complete", "1");
          onComplete();
        }}
      >
        Finish
      </button>
    </>
  );
}
