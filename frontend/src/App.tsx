import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="font-sans">
      <Navbar />
      <Outlet />
      <Toaster />
    </div>
  );
}

export default App;
