// src/App.js
import { useState, useEffect } from "react";
import { Auth } from "./components/Auth.jsx";
import { Chat } from "./components/Chat.jsx";
import { ServerSelection } from "./components/ServerSelection.jsx";
import { WaitingRoom } from "./components/WaitingRoom.jsx";
import { ServerCreateMenu } from "./components/ServerCreateMenu.jsx";
import { HubConnectionBuilder } from "@microsoft/signalr";

const App = () => {
    const [connection, setConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatRoom, setChatRoom] = useState("");
    const [mode, setMode] = useState("none");

    // Создание подключения и установка обработчиков
    const initializeConnection = async () => {
        try {
            const connection = new HubConnectionBuilder()
                .withUrl("http://localhost:5022/chat", {
                    accessTokenFactory: () => localStorage.getItem("authToken"),
                })
                .withAutomaticReconnect()
                .build();

            connection.on("ReceiveMessage", (userName, message) => {
                setMessages((messages) => [...messages, { userName, message }]);
            });

            connection.on("LoadMessages", (messages) => {
                setMessages(messages);
            });

            await connection.start();
            setConnection(connection);
        } catch (error) {
            console.error("Connection error:", error);
        }
    };

    // Обработка аутентификации пользователя
    const handleAuth = async (mode, userData) => {
        try {
            if (mode === "register") {
                await fetch("http://localhost:5022/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userData),
                });
                alert("Registration successful. You can now log in.");
                setMode("login");
            } else if (mode === "login") {
                const response = await fetch("http://localhost:5022/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userData),
                });
                if (response.ok) {
                    const { Token } = await response.json();
                    localStorage.setItem("authToken", Token);
                    setMode("waitingRoom"); // Переключаемся на waitingRoom после успешного логина
                } else {
                    alert("Login failed.");
                }
            }
        } catch (error) {
            console.error("Auth error:", error);
        }
    };

    // Обработка подключения к серверу
    const handleServerConnect = (serverInfo) => {
        setChatRoom(serverInfo.serverName); // Установить текущую комнату
        setMode("chat"); // Переключиться на экран чата
    };

    // Возвращение к экрану выбора сервера
    const handleBackToChatList = () => {
        setMode("waitingRoom"); // Вернуться в waitingRoom
    };

    // Возвращение к экрану выбора сервера
    const handleServerSelection = () => {
        setMode("chat"); // Вернуться к выбору сервера
    };

    const handleServerCreateMenu = () => {
        setMode("serverCreate"); // Вернуться к выбору сервера
    };

        // Возвращение к экрану выбора сервера
        const handleAddServer = () => {
            setMode("serverSelection"); // Вернуться к выбору сервера
        };

    // Отправка сообщения в текущую комнату
    const sendMessage = async (message) => {
        if (connection && chatRoom) {
            try {
                await connection.invoke("SendMessage", chatRoom, message);
            } catch (error) {
                console.error("Send message error:", error);
            }
        }
    };

        // Создание нового сервера
        const handleCreateServer = async (serverInfo) => {
            try {
                // Предположим, что у вас есть API для создания сервера
                const response = await fetch("http://localhost:5022/api/servers/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                    },
                    body: JSON.stringify(serverInfo),
                });
                if (response.ok) {
                    const result = await response.json();
                    setChatRoom(result.serverName); // Установить текущую комнату
                    setMode("chat"); // Переключиться на экран чата
                } else {
                    alert("Failed to create server.");
                }
            } catch (error) {
                console.error("Create server error:", error);
            }
        };

    // Закрытие чата
    const closeChat = async () => {
        if (connection) {
            try {
                await connection.stop();
                setConnection(null);
                setMessages([]);
                setMode("serverSelection"); // Возврат к выбору сервера
                setChatRoom(""); // Сброс текущей комнаты
            } catch (error) {
                console.error("Close chat error:", error);
            }
        }
    };

    // Подключение и загрузка сообщений при авторизации
    useEffect(() => {
        if (mode === "chat") {
            initializeConnection();
        }
    }, [mode]);

    // Загрузка истории сообщений при подключении к комнате
    useEffect(() => {
        if (connection && chatRoom) {
            connection.invoke("LoadChatHistory", chatRoom);
        }
    }, [connection, chatRoom]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {mode === "none" && <Auth onAuth={handleAuth} />}
            {mode === "waitingRoom" && (
                <WaitingRoom
                    chatRoom={chatRoom}
                    onServerSelect={handleServerSelection}
                    onBackToSelection={handleAddServer}
                />
            )}
            {mode === "serverSelection" && (
                <ServerSelection
                    onServerCreateMenu={handleServerCreateMenu}
                    onConnect={handleServerConnect}
                    onBack={handleBackToChatList} // Передача функции возврата в chat list
                />
            )}
            {mode === "serverCreate" && (
                <ServerCreateMenu
                    onCreateServer={handleCreateServer}
                    onBack={handleServerSelection}
                />
            )}
            {mode === "chat" && (
                <Chat
                    onServerSelect={handleServerSelection}
                    onBackToSelection={handleAddServer}
                    messages={messages}
                    sendMessage={sendMessage} // Передача функции отправки сообщения
                    closeChat={closeChat} // Передача функции закрытия чата
                    chatRoom={chatRoom}
                    setChatRoom={setChatRoom}
                />
            )}
        </div>
    );
};

export default App;
