import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="layout">

      <Sidebar />

      <main className="main-content">
        {children}
      </main>

    </div>
  );
}

export default Layout;