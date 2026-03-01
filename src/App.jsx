import React, { useState, useEffect } from "react";
import "./App.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode"; // for decoding user info
import Talk from "./components/Talk";
import Cards from "./components/Cards";

function App() {

    const [activeTab, setActiveTab] = useState("talk");
    const [user, setUser] = useState(() => {
        return {
            name : localStorage.getItem("name"),
            email: localStorage.getItem("email")
        };
    });
    // const [loggedIn, setLoggedIn] = useState(false);
    const [loggedIn, setLoggedIn] = useState(() => {
        // Check localStorage on initial load
        const loggedIn = localStorage.getItem("loggedIn");
        return loggedIn === "true"; // convert string to boolean
    });

    useEffect(() => {
        // Update localStorage whenever loggedIn changes
        localStorage.setItem("loggedIn", loggedIn+"");
    }, [loggedIn]);

    useEffect(() => {
        // Update localStorage whenever loggedIn changes
        localStorage.setItem("email", user.email);
        localStorage.setItem("name", user.name);
    }, [user]);

    const handleGoogleLogin = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        setUser(decoded);
        setLoggedIn(true);
    };

    const handleGoogleLoginError = () => {
        console.error("Google Login Failed");
    };

    const logout = () => {
        setLoggedIn(false);
    }



    return (
        <div className="App">

            {!loggedIn ? (
                <div>
                    <h1>🤖💬 PromptPolish</h1>
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={handleGoogleLoginError}
                    />
                </div>
            ) : (
                <div>
                    <div className="header">
                        <div style={{marginRight:'110px'}} className="logo">
                            <h1>🤖💬 PromptPolish</h1>
                        </div>

                        <div className="user-controls">
                            <p className="welcome">👋 Hello, {user.name}</p>
                            <button className="logout-button" onClick={logout}>Logout</button>
                        </div>
                    </div>

                    {/* 🔁 Feature Switch */}
                    <div className="tab-switcher">
                        <button
                            className={activeTab === "talk" ? "active" : ""}
                            onClick={() => setActiveTab("talk")}
                        >
                            🗣 Talk
                        </button>
                        <button
                            className={activeTab === "cards" ? "active" : ""}
                            onClick={() => setActiveTab("cards")}
                        >
                            🧩 Cards
                        </button>
                    </div>

                    {activeTab === "talk" && <Talk />}
                    {activeTab === "cards" && <Cards />}
                </div>
            )}
        </div>
    );
}

export default App;
