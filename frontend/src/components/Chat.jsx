// components/Chat.jsx
import { Button, CloseButton, Heading, Input, VStack, Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";

// Компонент для меню
const ServerMenu = ({ onSelectServer, onBackToSelection }) => {
    // Пример серверов, их можно динамически загружать
    const servers = [
        { name: "Server 1", id: 1 },
        { name: "Server 2", id: 2 },
    ];

    return (
        <Box
            width={{ base: "100%", md: "250px" }} // 100% на маленьких экранах, 250px на больших
            bg="gray.100"
            p="4"
            boxShadow="md"
            height="100vh"
            position="fixed"
            left="0"
            top="0"
            overflowY="auto" // Скролл для длинного списка
        >
            <VStack spacing="4" align="start">
                {/* Кнопка для возврата к выбору сервера */}
                <Button
                    width="full"
                    variant="solid"
                    colorScheme="blue"
                    onClick={onBackToSelection}
                >
                    Add server
                </Button>

                {servers.map((server) => (
                    <Button
                        key={server.id}
                        width="full"
                        variant="outline"
                        onClick={() => onSelectServer(server)}
                    >
                        {server.name}
                    </Button>
                ))}
            </VStack>
        </Box>
    );
};

export const Chat = ({ messages, sendMessage, closeChat, chatRoom, onServerSelect, onBackToSelection }) => {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSendMessage = () => {
        sendMessage(message);
        setMessage("");
    };

    return (
        <div className="flex h-screen w-screen">
            {/* Server menu */}
            <ServerMenu onSelectServer={onServerSelect} onBackToSelection={onBackToSelection} />

            {/* Chat container */}
            <div className="flex-1 ml-[250px] p-8 bg-white flex flex-col">
                {/* Header */}
                <div className="flex flex-row justify-between mb-5">
                    <Heading size="lg">{chatRoom}</Heading>
                    <CloseButton onClick={closeChat} />
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-auto">
                    <div className="flex flex-col gap-3">
                        {messages.map((messageInfo, index) => (
                            <Message messageInfo={messageInfo} key={index} />
                        ))}
                        <span ref={messagesEndRef} />
                    </div>
                </div>

                {/* Message input area */}
                <div className="mt-4 flex gap-3">
                    <Input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter message"
                        flex="1" // Растягиваем input на всю оставшуюся ширину
                    />
                    <Button colorScheme="blue" onClick={onSendMessage}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
};
