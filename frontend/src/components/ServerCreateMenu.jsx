// components/ServerCreateMenu.jsx
import { Button, Heading, Input, VStack, HStack, Box } from "@chakra-ui/react";
import { useState } from "react";

export const ServerCreateMenu = ({ onCreate, onBack }) => {
    const [serverName, setServerName] = useState("");
    const [password, setPassword] = useState("");

    const handleCreate = () => {
        onCreate({ serverName, password });
    };

    return (
        <Box className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <VStack spacing="4" width={{ base: "full", sm: "400px" }} bg="white" p="8" borderRadius="md" boxShadow="md">
                <Heading size="lg">Create a New Server</Heading>
                <Input
                    type="text"
                    placeholder="Server Name"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {/* Horizontal stack for buttons */}
                <HStack spacing="4" width="full">
                    <Button colorScheme="blue" onClick={handleCreate} width="full">
                        Create
                    </Button>
                    <Button colorScheme="gray" onClick={onBack} width="full">
                        Back to chatlist
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};
