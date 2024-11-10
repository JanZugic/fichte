import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie"; // Импортируем библиотеку для работы с куками
import { Auth } from "./components/Auth";
import { Chat } from "./components/Chat";
import { ServerSelection } from "./components/ServerSelection";
import { WaitingRoom } from "./components/WaitingRoom";
import { ServerCreateMenu } from "./components/ServerCreateMenu";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { Settings } from "./components/Settings";

const App = () => {
    const [connection, setConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [roomId, setChatRoomId] = useState(null);
    const [chatRoomName, setChatRoomName] = useState("");
    const [mode, setMode] = useState("none");
    const [servers, setServers] = useState([]);
    const [currentUserName, setCurrentUserName] = useState("");
    const [user, setUser] = useState(null);

    // Инициализация SignalR соединения
    const initializeConnection = useCallback(async () => {
        const token = Cookies.get("authToken"); // Получаем токен из куков
        if (!token) {
            console.error("Токен отсутствует. Пожалуйста, войдите в систему.");
            return;
        }

        try {
            const connection = new HubConnectionBuilder()
                .withUrl("http://localhost:5022/chat", {
                    accessTokenFactory: () => Cookies.get("authToken"), // Используем токен из куков
                })
                .withAutomaticReconnect()
                .build();

            // Получение новых сообщений
            connection.on("ReceiveMessage", (username, message, avatarUrl, fileUrl) => {
                const newMessage = {
                    userName: username,
                    content: message,
                    avatarUrl: avatarUrl, // URL аватарки пользователя
                    sentAt: new Date().toISOString() // Время отправки сообщения
                };
            
                // Проверяем, есть ли ссылка на файл или изображение
                if (fileUrl) {
                    // Проверяем расширение файла, чтобы определить, изображение это или другой файл
                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                    const fileExtension = fileUrl.substring(fileUrl.lastIndexOf('.')).toLowerCase();
            
                    if (imageExtensions.includes(fileExtension)) {
                        // Это изображение, добавляем в объект сообщение с типом "изображение"
                        newMessage.messageType = "image"
                        newMessage.fileContent = fileUrl; // Для отображения изображения в компоненте
                    } else {
                        // Это обычный файл, добавляем URL файла
                        newMessage.messageType = "file"
                        newMessage.fileContent = fileUrl; // Для отображения ссылки на файл в компоненте
                    }
                }
            
                // Обновляем состояние чата с новыми сообщениями
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            });
            

            // Пример функции обработки события входа
            connection.on('UserJoined', (name) => {
                const systemMessage = {
                    userName: "System",
                    content: `${name} joined the chat.`,
                    sentAt: new Date().toISOString(),
                    messageFrom: "system" // Важно, чтобы мы отметили, что это системное сообщение
                };
                
                setMessages(prevMessages => [...prevMessages, systemMessage]); // Добавление системного сообщения в состояние
            });

            // Аналогично для выхода
            connection.on('UserLeft', (name) => {
                const systemMessage = {
                    userName: "System",
                    content: `${name} left the chat.`,
                    sentAt: new Date().toISOString(),
                    messageFrom: "system"
                };
                
                setMessages(prevMessages => [...prevMessages, systemMessage]);
            });

            
            // Загрузка истории сообщений
            connection.on("ChatHistory", (chatHistory) => {
                setMessages(chatHistory);
            });

            // Подписываемся на событие UserLeft
            connection.on("UserLeft", (userId, roomId) => {
                console.log(`User ${userId} left room: ${roomId}`);
            });

            // Подписка на событие UserJoined
            connection.on("UserJoined", (userId, roomId) => {
                console.log(`User ${userId} joined room: ${roomId}`);
            });

            await connection.start().catch(err => console.error("Ошибка подключения", err));
            if (connection) {
                console.log("SignalR Connected.");
            }
            setConnection(connection);
        } catch (error) {
            console.error("Ошибка соединения:", error);
        }
    }, []);

    const loadUserData = useCallback(async () => {
        const token = Cookies.get("authToken");
        if (!token) return;
        try {
            const response = await fetch("http://localhost:5022/api/chat/userData", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData); // Сохраняем данные пользователя в состояние
                console.log("loadUserData username: " + userData.username);
            } else {
                console.error("Не удалось загрузить данные пользователя.");
            }
        } catch (error) {
            console.error("Ошибка при загрузке данных пользователя:", error);
        }
    }, []);

    // Загрузка серверов
    const loadServers = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:5022/api/chat/rooms", {
                headers: {
                    "Authorization": `Bearer ${Cookies.get("authToken")}`, // Используем токен из куков
                },
            });
            if (response.ok) {
                const serverList = await response.json();
                setServers(serverList);
            } else {
                console.error("Не удалось загрузить серверы.");
            }
        } catch (error) {
            console.error("Ошибка при загрузке серверов:", error);
        }
    }, []);

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
                alert("Регистрация прошла успешно. Вы можете войти.");
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
                    console.log("Установка режима: waitingRoom после успешного входа.");
                    Cookies.set("authToken", token, { expires: 7 }); // Устанавливаем куки с токеном на 7 дней
                    setMode("waitingRoom");
                } else {
                    alert("Ошибка входа.");
                }
            }
        } catch (error) {
            console.error("Ошибка аутентификации:", error);
        }
    };

    // Обработка подключения к серверу
    const handleServerConnect = async (serverInfo) => {
        try {
            // Подписываемся на ответ от сервера
            connection.on("UserJoined", (userId, roomId) => {
                console.log(`User ${userId} joined room ${roomId}`);
            });

            // Вызываем метод JoinRoom на сервере
            const roomInfo = await connection.invoke("JoinRoom", serverInfo.serverName, serverInfo.password);
            serverInfo = roomInfo;
            if (roomInfo) {
                console.log("Successfully joined the chat room.", serverInfo.roomId);
                setChatRoomName(serverInfo.roomName);
                setChatRoomId(serverInfo.roomId);
                setMode("chat");
                loadServers();
            }
        } catch (error) {
            console.error("Join chat error:", error);
        }
    };

    // Обработка создания комнаты
    const handleServerCreate = async (serverInfo) => {
        try {
            // Подписываемся на событие RoomCreated
            connection.on("RoomCreated", (roomId, createdRoomName) => {
                console.log(`Room created: ${roomId} - ${createdRoomName}`);
            });

            // Вызываем метод CreateRoom на сервере
            const roomInfo = await connection.invoke("CreateRoom", serverInfo.serverName, serverInfo.password);
            
            // Убедитесь, что roomInfo не null
            if (roomInfo) {
                console.log("Successfully created the chat room.", roomInfo.roomId);
                handleServerConnect(serverInfo); // Присоединяемся к новой комнате
            } else {
                console.error("Failed to create room: roomInfo is null.");
            }
        } catch (error) {
            console.error("Create room error:", error);
        }
    };
    

    const handleBackToChatList = () => {
        setMode("waitingRoom");
    };

    const handleAddServer = () => {
        setMode("serverSelection");
    };

    // Отправка сообщения через SignalR Hub
    const sendMessage = async (message) => {
        if (connection && roomId) {
            try {
                await connection.invoke("SendMessage", roomId, message);
            } catch (error) {
                console.error("Ошибка отправки сообщения:", error);
            }
        }
    };

    const sendMessageFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file); // Отправляем только файл
    
        try {
            // Выполняем POST запрос к API для загрузки файла
            const response = await fetch('http://localhost:5022/api/chat/SendMessageFileFetch', {
                method: 'POST',
                body: formData,
                headers: {
                    "Authorization": `Bearer ${Cookies.get("authToken")}`
                }
            });
    
            if (!response.ok) {
                const errorMessage = await response.text();
                alert(`Error: ${errorMessage}`); // Сообщение об ошибке
                return;
            }
    
            const data = await response.json(); // Предположим, что data содержит URL файла
    
            // Уведомляем пользователей о новом файле через SignalR
            if (connection && roomId) {
                try {
                    // Отправляем URL файла и имя файла через SignalR
                    await connection.invoke("SendMessageFile", roomId, data.fileUrl, file.name);
                    console.log("SendMessageFile success");
                } catch (error) {
                    console.error("Ошибка отправки файла:", error);
                    alert('Error notifying users about the new file.'); // Сообщение об ошибке при отправке через SignalR
                }
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar. Please try again.'); // Сообщение об ошибке загрузки
        }
    };

    // Закрытие чата и отключение от комнаты
    const closeChat = async () => {
        if (connection && roomId) {
            try {
                await connection.invoke("LeaveRoom", roomId);
                setMessages([]);
                setChatRoomId(null);
                setChatRoomName("");
                setMode("waitingRoom");
            } catch (error) {
                console.error("Ошибка закрытия чата:", error);
            }
        } else {
            console.log("Нет активного соединения или отсутствует идентификатор комнаты.");
        }
    };

    const handleServerSelect = async (serverInfo) => {
        // Проверка на наличие соединения
        if (!connection) {
            try {
                await initializeConnection(); // Ждем, пока соединение будет установлено
            } catch (error) {
                console.error("Ошибка инициализации соединения:", error);
                return; // Если инициализация не удалась, выходим из функции
            }
        }
        
        // Проверяем, что соединение успешно установлено
        if (connection) {
            try {
                setChatRoomId(serverInfo.roomId);
                setChatRoomName(serverInfo.roomName);
                setMode("chat");
                await reconnectRooms(serverInfo.roomId); // Убедитесь, что повторное подключение также ожидает
            } catch (error) {
                console.error("Ошибка при подключении к комнате:", error);
            }
        } else {
            console.error("Не удалось установить соединение с сервером.");
        }
    };

    const reconnectRooms = useCallback(async (roomId) => {
        if (connection) {
            try {
                await connection.invoke("ReconnectRoom", roomId);
            } catch (error) {
                console.error("Ошибка при повторном присоединении к комнатам:", error);
            }
        }
    }, [connection]);

    

    // Функция для обработки выхода из системы
    const handleLogout = () => {
        // Удаляем токен и имя пользователя из куков
        Cookies.remove("authToken");
        Cookies.remove("username");

        // Сбрасываем состояние приложения
        setCurrentUserName("");
        setMessages([]);
        setChatRoomId(null);
        setChatRoomName("");
        setMode("none"); // Устанавливаем режим обратно в "none" для показа экрана аутентификации

        // Отключаемся от сервера, если соединение активно
       if (connection) {
            connection.stop()
                .then(() => {
                    console.log("Disconnected from SignalR.");
                    setConnection(null); // Reset the connection state
                })
                .catch(err => console.error("Error disconnecting:", err));
        }
    };

    const handleSettings = () => {
        setMode("settings");
    }

    // Инициализация соединения при переходе в чат
    useEffect(() => {
        if (!connection) {
            initializeConnection();
        }
    }, [initializeConnection]);

    // Загрузка истории сообщений при подключении к комнате
    useEffect(() => {
        if (roomId && connection) {
            console.log(`Chat room ID set to: ${roomId}`);
            connection.invoke("LoadChatHistory", roomId);
        }
    }, [roomId, connection]);

    // Загрузка серверов при открытии waitingRoom
    useEffect(() => {
        const token = Cookies.get("authToken");

        if (token) {
            loadUserData();
            setMode("waitingRoom");
            loadServers();
            initializeConnection();
        }
    }, [loadUserData, loadServers, initializeConnection]);

    useEffect(() => {
        if (mode === "waitingRoom") {
            console.log("Вход в режим waitingRoom через useEffect (переключение mode).");
            loadUserData();
            loadServers();
            initializeConnection();
        }
    }, [mode, loadServers, initializeConnection]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {mode === "none" && <Auth onAuth={handleAuth} />}
            {mode === "waitingRoom" && (
                <WaitingRoom
                    servers={servers}
                    chatRoom={chatRoomName}
                    onServerSelect={handleServerSelect}
                    onBackToSelection={handleAddServer}
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                />
            )}
            {mode === "serverSelection" && (
                <ServerSelection
                    onServerCreateMenu={() => setMode("serverCreate")}
                    onConnect={handleServerConnect}
                    onBack={handleBackToChatList}
                />
            )}
            {mode === "serverCreate" && (
                <ServerCreateMenu
                    onCreate={handleServerCreate}
                    onBack={handleBackToChatList}
                />
            )}
            {mode === "chat" && (
                <Chat
                    servers={servers}
                    onServerSelect={handleServerSelect}
                    onBackToSelection={handleAddServer}
                    messages={messages}
                    sendMessage={sendMessage}
                    sendMessageFile={sendMessageFile}
                    closeChat={closeChat}
                    chatRoom={chatRoomName}
                    roomId={roomId}
                    user={user}
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                />
            )}
            {mode === "settings" && (
                <Settings
                    user={user}
                    servers={servers}
                    chatRoom={chatRoomName}
                    onServerSelect={handleServerSelect}
                    onBackToSelection={handleAddServer}
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                />
            )}
        </div>
    );
};

export default App;
