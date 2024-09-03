import { Button, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

export const Auth = ({ onAuth }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            onAuth("register", { username, password, name, surname, email });
        } else {
            onAuth("login", { username, password });
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-sm w-full bg-white p-8 rounded shadow-lg"
        >
            <Heading size="lg" mb={4}>
                {isRegistering ? "Register" : "Login"}
            </Heading>
            <Stack spacing={4}>
                {isRegistering && (
                    <>
                        <div>
                            <Text fontSize={"sm"}>Name</Text>
                            <Input
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Text fontSize={"sm"}>Surname</Text>
                            <Input
                                placeholder="Enter your surname"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                            />
                        </div>
                        <div>
                            <Text fontSize={"sm"}>Email</Text>
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </>
                )}
                <div>
                    <Text fontSize={"sm"}>Username</Text>
                    <Input
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <Text fontSize={"sm"}>Password</Text>
                    <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button type="submit" colorScheme="blue">
                    {isRegistering ? "Register" : "Login"}
                </Button>
                <Button
                    onClick={() => setIsRegistering(!isRegistering)}
                    colorScheme="teal"
                    variant="outline"
                >
                    {isRegistering ? "Already have an account? Login" : "Need to register? Sign Up"}
                </Button>
            </Stack>
        </form>
    );
};

export default Auth;
