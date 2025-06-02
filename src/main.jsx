// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.jsx";
// import "./App.css";
//
// ReactDOM.createRoot(document.getElementById("root")).render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>
// );
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
);
