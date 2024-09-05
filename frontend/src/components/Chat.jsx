import {
    Button,
    CloseButton,
    Heading,
    Input,
    VStack,
    Box,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";

// Компонент для меню серверов
const ServerMenu = ({ servers, onSelectServer, onBackToSelection }) => {
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
                        colorScheme="white"
                        width="full"
                        variant="outline"
                        onClick={() => onSelectServer(server)}
                    >
                        {server.roomName}
                    </Button>
                ))}
            </VStack>
        </Box>
    );
};

export const Chat = ({ servers, onServerSelect, onBackToSelection, messages, sendMessage, closeChat, chatRoom, roomId }) => {
    const [message, setMessage] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const cancelRef = useRef();
    const messagesEndRef = useRef(null);
    const currentUserName = 'CurrentUser';

    useEffect(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSendMessage = () => {
        if (message.trim() !== "") {
            sendMessage(message); // Используем пропс sendMessage
            setMessage("");
        }
    };

    const onCloseRequest = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

    const leaveChat = async () => {
        if (!roomId) {
            console.error("RoomId is not provided.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5022/api/chat/leave-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ roomId }), // Передаем roomId
            });

            if (!response.ok) {
                throw new Error("Failed to leave chat");
            }

            const result = await response.json();
            console.log("Successfully left chat:", result);
        } catch (error) {
            console.error("Error leaving chat:", error);
        }
    };

    const onConfirmClose = async () => {
        await leaveChat(); // Вызов leaveChat для выхода с сервера на бэкенде
        setIsOpen(false);
        closeChat(); // Закрытие соединения на клиенте
    };

    return (
        <div className="flex h-screen w-screen">
            {/* Server menu */}
            <ServerMenu servers={servers} onSelectServer={onServerSelect} onBackToSelection={onBackToSelection} />

            {/* Chat container */}
            <div className="flex-1 ml-[250px] p-8 bg-white flex flex-col">
                {/* Header */}
                <div className="flex flex-row justify-between mb-5">
                    <Heading size="lg">{chatRoom}</Heading>
                    <CloseButton onClick={onCloseRequest} />
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-auto">
                    <div className="flex flex-col gap-3">
                        {messages.map((messageInfo, index) => (
                            <Message messageInfo={messageInfo} currentUserName={currentUserName} key={index}/>
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
                        flex="1"
                    />
                    <Button colorScheme="blue" onClick={onSendMessage}>
                        Send
                    </Button>
                </div>

                {/* AlertDialog для подтверждения закрытия */}
                <AlertDialog
                    isOpen={isOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={onClose}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Close Chat
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                Are you sure you want to close the chat? You will lose the current conversation.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button colorScheme="red" onClick={onConfirmClose} ml={3}>
                                    Confirm
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </div>
        </div>
    );
};
