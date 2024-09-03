// components/WaitingRoom.jsx
import { Button, Heading, VStack, Box } from "@chakra-ui/react";

// Компонент для меню серверов
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
                {/* Кнопка для добавления нового сервера */}
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

export const WaitingRoom = ({ chatRoom, onServerSelect, onBackToSelection }) => {
    return (
        <div className="flex h-screen w-screen">
            {/* Server menu */}
            <ServerMenu onSelectServer={onServerSelect} onBackToSelection={onBackToSelection} />

            {/* Waiting room container */}
            <div className="flex-1 ml-[250px] p-8 bg-white flex flex-col justify-center items-center">
                {/* Header */}
                <Heading size="lg" mb="5">
                    Welcome to the FICHTE
                </Heading>
                {/* Placeholder for additional content */}
                <Box>
                    <p>Choose a server from the list to join the chat.</p>
                </Box>
            </div>
        </div>
    );
};
