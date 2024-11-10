import {
    Button,
    CloseButton,
    Heading,
    Textarea,
    VStack,
    Box,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Input
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";
import { AttachmentIcon } from "@chakra-ui/icons"; // Импорт иконки скрепки из Chakra UI

// Компонент для меню серверов
const ServerMenu = ({ servers, onSelectServer, onBackToSelection, onLogout, onSettings }) => {
    return (
        <Box
            width={{ base: "100%", md: "250px" }}
            bg="gray.100"
            p="4"
            boxShadow="md"
            height="100vh"
            position="fixed"
            left="0"
            top="0"
            display="flex"
            flexDirection="column"
        >
            <Box flex="1" overflowY="auto">
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
                            minHeight="45px"
                            _hover={{
                                bg: "grey.100",
                                color: "blue.800",
                                borderColor: "blue.500",
                            }}
                            _active={{
                                bg: "blue.100",
                                color: "blue.900",
                                borderColor: "blue.600",
                            }}
                        >
                            {server.roomName}
                        </Button>
                    ))}
                </VStack>
            </Box>

            <Box
                width="full"
                bg="gray.200"
                p="4"
                borderTop="1px solid lightgray"
                flexShrink="0"
            >
                <VStack spacing="2" align="start">
                    <Button colorScheme="gray" width="full" onClick={onSettings} minHeight="50px">
                        Settings
                    </Button>
                    <Button colorScheme="red" width="full" onClick={onLogout} minHeight="50px">
                        Logout
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
};

export const Chat = ({ servers, onServerSelect, onBackToSelection, messages, sendMessage, closeChat, chatRoom, user, onLogout, onSettings, sendMessageFile }) => {
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null); // Состояние для выбранного файла
    const [isOpen, setIsOpen] = useState(false);
    const cancelRef = useRef();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        console.log("Catch focus");
        console.log(inputRef.current);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const onSendMessage = () => {
        if (file) {
            sendMessageFile(file);
            setFile(null);
        } else if (message.trim() !== "") {
            sendMessage(message);
            setMessage("");
        }
    
        // Автоматическое изменение высоты инпута (если это textarea)
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'; // Сбрасываем высоту
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`; // Устанавливаем высоту на основе содержимого
            inputRef.current.focus(); 
        }
    };
    

    const handleKeyPress = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (message.trim() !== "" || file) {
                onSendMessage();
            }
        }
    };

    const onCloseRequest = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

    const onConfirmClose = async () => {
        setIsOpen(false);
        closeChat();
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
    };

    const autoResizeTextarea = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage(""); // Очищаем текстовое поле
            console.log("File selected: ", selectedFile);
        }
        if (inputRef.current) {
            inputRef.current.focus(); // Добавьте это
        }
    };

    const handleKeyDown = (event) => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
        }
    };
    

    return (
        <div className="flex h-screen w-screen" tabIndex={0} onKeyDown={handleKeyDown}>
            <ServerMenu servers={servers} onSelectServer={onServerSelect} onBackToSelection={onBackToSelection} onLogout={onLogout} onSettings={onSettings} />

            <div className="flex-1 ml-[250px] p-8 bg-white flex flex-col">
                <div className="sticky top-0 z-10 bg-white flex flex-row justify-between mb-5 pb-3 border-b">
                    <Heading size="lg">{chatRoom}</Heading>
                    <CloseButton onClick={onCloseRequest} />
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto flex-grow">
                    {messages.map((messageInfo, index) => (
                        <Message messageInfo={messageInfo} currentUserName={user.username} key={index} />
                    ))}
                    <span ref={messagesEndRef} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                    {file && (
                        <div className="flex items-center bg-gray-200 p-2 rounded">
                            <span className="mr-2">{file.name}</span>
                            <CloseButton onClick={() => setFile(null)} />
                        </div>
                    )}

                    <Textarea
                        value={message}
                        onChange={(e) => {
                            handleInputChange(e);
                            autoResizeTextarea(e);
                        }}
                        placeholder={file ? "File attached" : "Enter message"}
                        flex="1"
                        onKeyPress={handleKeyPress}
                        ref={inputRef}
                        resize="none"
                        rows={1}
                        minHeight="40px"
                        isDisabled={!!file}
                    />

                    <Button variant="outline" colorScheme="gray" leftIcon={<AttachmentIcon />} size="sm" onClick={() => document.getElementById('fileInput').click()}>
                        Attach File
                    </Button>
                    <Input
                        type="file"
                        id="fileInput"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />

                    <Button colorScheme="blue" onClick={onSendMessage} isDisabled={!message.trim() && !file}>
                        Send
                    </Button>
                </div>

                <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
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
