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
    const [roomId, setChatRoomId] = useState(null); // Использование ID комнаты
    const [chatRoomName, setChatRoomName] = useState(""); // Для отображения имени комнаты
    const [mode, setMode] = useState("none");
    const [servers, setServers] = useState([]); // Список серверов

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
                setMessages((prevMessages) => [...prevMessages, { userName, message }]);
            });
    
            connection.on("LoadMessages", (messages) => {
                setMessages(messages);
            });
    
            connection.onclose((error) => {
                console.error("SignalR connection closed due to error: ", error);
                // Optionally, you can add logic to retry connection here
            });
    
            connection.onreconnecting((error) => {
                console.warn("SignalR connection lost due to error: ", error);
            });
    
            connection.onreconnected((connectionId) => {
                console.log("SignalR connection reestablished with connection ID: ", connectionId);
            });
    
            await connection.start();
            setConnection(connection);
        } catch (error) {
            console.error("Connection error:", error);
        }
    };
    // Загрузка серверов
    const loadServers = async () => {
        try {
            const response = await fetch("http://localhost:5022/api/chat/rooms", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                }
            });
            if (response.ok) {
                const serverList = await response.json();
                setServers(serverList);
            } else {
                console.error("Failed to load servers.");
            }
        } catch (error) {
            console.error("Error loading servers:", error);
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
                    const { token } = await response.json();
                    localStorage.setItem("authToken", token);
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
        console.log("Connecting to server:", serverInfo);
        setChatRoomId(serverInfo.roomId); // Установить текущую комнату по ID
        setChatRoomName(serverInfo.serverName); // Сохранить имя комнаты для отображения

        setMode("chat"); // Переключиться на экран чата после подключения
    };

    // Возвращение к экрану выбора сервера
    const handleBackToChatList = () => {
        setMode("waitingRoom"); // Вернуться в waitingRoom
    };

    const handleServerCreateMenu = () => {
        setMode("serverCreate");
    };

    const handleAddServer = () => {
        setMode("serverSelection");
    };

    // Отправка сообщения в текущую комнату
    const sendMessage = async (message) => {
        if (connection && roomId) {
            try {
                await fetch("http://localhost:5022/api/chat/send-message", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                    },
                    body: JSON.stringify({
                        RoomId: roomId,
                        Message: message
                    })
                });
            } catch (error) {
                console.error("Send message error:", error);
            }
        }
    };
    

    // Создание нового сервера
    const handleCreateServer = async (serverInfo) => {
        try {
            const response = await fetch("http://localhost:5022/api/chat/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                },
                body: JSON.stringify(serverInfo),
            });
            if (response.ok) {
                const result = await response.json();
                setChatRoomId(result.ServerId); // Сохраняем ID новой комнаты
                setChatRoomName(result.ServerName); // Имя комнаты для отображения
                setMode("chat");
            } else {
                alert("Failed to create server.");
            }
        } catch (error) {
            console.error("Create server error:", error);
        }
    };

    // Закрытие чата и сброс состояния
    const closeChat = async () => {
        if (connection) {
            try {
                await connection.stop(); // Остановка подключения SignalR
                setConnection(null);
                setMessages([]); // Очистка сообщений
                setChatRoomId(null); // Сброс ID комнаты
                setChatRoomName(""); // Сброс имени комнаты
                setMode("waitingRoom"); // Возврат к выбору сервера
            } catch (error) {
                console.error("Close chat error:", error);
            }
        }
    };

    // Подключение и загрузка сообщений при авторизации
    useEffect(() => {
        if (mode === "chat" && !connection) {
            initializeConnection();
        }
    }, [mode]);

    // Загрузка истории сообщений при подключении к комнате
    useEffect(() => {
        if (roomId && connection) {
            console.log(`Chat room ID set to: ${roomId}`);
            connection.invoke("LoadChatHistory", roomId);
        }
    }, [roomId, connection]);

    // Загрузка серверов при переходе в режим выбора сервера
    useEffect(() => {
        if (mode === "waitingRoom") {
            loadServers();
        }
    }, [mode]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {mode === "none" && <Auth onAuth={handleAuth} />}
            {mode === "waitingRoom" && (
                <WaitingRoom
                    servers={servers}
                    chatRoom={chatRoomName}
                    onServerSelect={handleServerConnect}
                    onBackToSelection={handleAddServer}
                />
            )}
            {mode === "serverSelection" && (
                <ServerSelection
                    onServerCreateMenu={handleServerCreateMenu}
                    onConnect={handleServerConnect}
                    onBack={handleBackToChatList}
                />
            )}
            {mode === "serverCreate" && (
                <ServerCreateMenu
                    onCreate={handleCreateServer}
                    onBack={handleServerConnect}
                />
            )}
            {mode === "chat" && (
                <Chat
                    servers={servers}
                    onServerSelect={handleServerConnect}
                    onBackToSelection={handleAddServer}
                    messages={messages}
                    sendMessage={sendMessage}
                    closeChat={closeChat}
                    chatRoom={chatRoomName}
                    roomId={roomId}
                    setChatRoom={setChatRoomName}
                />
            )}
        </div>
    );
};

export default App;
