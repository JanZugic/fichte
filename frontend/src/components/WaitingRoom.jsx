// components/WaitingRoom.jsx
import { Button, Heading, VStack, Box } from "@chakra-ui/react";

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
            {/* Верхняя часть с кнопками серверов, занимает 90% высоты */}
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
                            minHeight="45px" // Минимальная высота для кнопок
                            _hover={{ 
                                bg: "grey.100", // Фоновый цвет при наведении
                                color: "blue.800", // Цвет текста при наведении
                                borderColor: "blue.500", // Цвет рамки при наведении
                            }}
                            _active={{ 
                                bg: "blue.100", // Фоновый цвет при нажатии
                                color: "blue.900", // Цвет текста при нажатии
                                borderColor: "blue.600", // Цвет рамки при нажатии
                            }}
                        >
                            {server.roomName}
                        </Button>
                    ))}
                </VStack>
            </Box>

            {/* Нижняя часть с кнопками Logout и Settings, занимает оставшиеся 10% высоты */}
            <Box
                width="full"
                bg="gray.200"
                p="4"
                borderTop="1px solid lightgray"
                flexShrink="0" // Предотвращаем сжатие контейнера
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

export const WaitingRoom = ({ servers, onServerSelect, onBackToSelection, onLogout, onSettings}) => {
    return (
        <div className="flex h-screen w-screen">
            {/* Server menu */}
            <ServerMenu servers={servers} onSelectServer={onServerSelect} onBackToSelection={onBackToSelection} onLogout={onLogout} onSettings={onSettings} />

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
