import React, { useState } from 'react';
import { Button, Box, Heading, Input, Avatar, VStack } from '@chakra-ui/react';
import Cookies from "js-cookie";


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

export const Settings = ({ 
    user, 
    servers, 
    onServerSelect, 
    onBackToSelection, 
    onLogout, 
    onSettings, 
    updateUserField
}) => {
    const [isEditing, setIsEditing] = useState({
        username: false,
        name: false,
        surname: false,
        email: false,
        password: false
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fieldValues, setFieldValues] = useState({
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: ""
    });
    const [profileImage, setProfileImage] = useState(user.profilePicture || ""); // Сохраняем URL новой фотографии профиля
    const [selectedFile, setSelectedFile] = useState(null); // Хранит выбранный файл
    const [uploading, setUploading] = useState(false); // Для отслеживания загрузки

    // Обработчик выбора нового файла
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file); // Создаем URL для выбранного файла
            setProfileImage(imageUrl); // Обновляем URL профиля
            setSelectedFile(file); // Сохраняем выбранный файл
        }
    };
    
    

    // Обработчик для подтверждения выбора изображения
    const handleConfirmUpload = async () => {
        if (selectedFile) {
            setUploading(true);
            
            // Создаем FormData для отправки файла на сервер
            const formData = new FormData();
            formData.append('avatar', selectedFile); // Отправляем только файл

            try {
                // Выполняем POST запрос к API
                const response = await fetch('http://localhost:5022/api/chat/uploadAvatar', {
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

                const data = await response.json();
                setProfileImage(data.avatarUrl); // Обновляем изображение профиля с полученным URL
                alert('Profile picture updated!'); // Уведомление об успешной загрузке
                setSelectedFile(null); // Сброс выбранного файла

                // Сохраняем состояние только для settings
                //Cookies.set("returnToSettings", "true");

                // Обновляем страницу, чтобы новые изменения отобразились
                window.location.reload(); // <-- добавляем авто-обновление страницы
            } catch (error) {
                console.error('Error uploading avatar:', error);
                alert('Error uploading avatar. Please try again.'); // Сообщение об ошибке
            } finally {
                setUploading(false); // Завершаем загрузку
            }
        }
    };

        const handleSaveChange = async (field, newValue, confirmPassword) => {
            try {
                const response = await fetch(`http://localhost:5022/api/chat/update${field.charAt(0).toUpperCase() + field.slice(1)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Cookies.get('authToken')}`,
                    },
                    body: JSON.stringify({
                        [`new${field.charAt(0).toUpperCase() + field.slice(1)}`]: newValue,
                        password: confirmPassword,
                    }),
                });
        
                if (!response.ok) {
                    const errorMessage = await response.text();
                    alert(`Error: ${errorMessage}`);
                    return;
                }
        
                const data = await response.json();
                if(field === 'password'){
                    alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
                }else{
                    alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully: ${data[field]}`);
                }
                window.location.reload();
            } catch (error) {
                console.error(`Error updating ${field}:`, error);
                alert(`An error occurred while updating ${field}.`);
            }
        };
    
    

    const handleEditToggle = async (field) => {
        if (!isEditing[field]) {
            setIsEditing((prev) => ({ ...prev, [field]: true }));
            setConfirmPassword("");
        } else {
            await updateUserField(field, fieldValues[field]);
            setIsEditing((prev) => ({ ...prev, [field]: false }));
            setConfirmPassword("");
        }
    };

    const handleFieldChange = (field, value) => {
        setFieldValues((prev) => ({ ...prev, [field]: value }));
    };

    const cancelEdit = (field) => {
        setIsEditing((prev) => ({ ...prev, [field]: false }));
        setConfirmPassword("");
        setFieldValues((prev) => ({ ...prev, [field]: user[field] }));
    };

    return (
        <div className="flex h-screen w-screen">
            {/* Server menu */}
            <ServerMenu 
                servers={servers} 
                onSelectServer={onServerSelect} 
                onBackToSelection={onBackToSelection} 
                onLogout={onLogout} 
                onSettings={onSettings} 
            />

            {/* Settings content */}
            <div className="flex-1 ml-[250px] p-8 bg-white flex flex-col items-center">
                {/* Header */}
                <Heading size="lg" mb="5">
                    Account Settings
                </Heading>

                {/* Profile Picture */}
                <Box mb="6" className="flex flex-col items-center">
                    <Avatar src={profileImage} size="xl" mb="4" />
                    <Button colorScheme="blue" onClick={() => document.getElementById('fileInput').click()}>
                        Change Profile Picture
                    </Button>
                    <Input
                        type="file"
                        id="fileInput"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />
                    {selectedFile && (
                        <Button 
                            colorScheme="green" 
                            onClick={handleConfirmUpload} 
                            isLoading={uploading} // Показать индикатор загрузки, если загружается
                            mt="4"
                        >
                            Confirm
                        </Button>
                    )}
                </Box>

                {/* User Information */}
                <Box className="w-full max-w-md p-6 border border-gray-300 rounded-md shadow-md">
                    {/* Username */}
                    <Box mb="4">
                        <label className="text-gray-600">Username:</label>
                        {isEditing.username ? (
                            <>
                                <Input 
                                    placeholder="Enter new username" 
                                    value={fieldValues.username}
                                    onChange={(e) => handleFieldChange('username', e.target.value)}
                                    mb="2"
                                />
                                <Input 
                                    type="password"
                                    placeholder="Confirm password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    mb="2"
                                />
                                <Button variant="link" colorScheme="red" onClick={() => cancelEdit('username')}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <p>{user.username}</p>
                        )}
                        <Button 
                            variant="link" 
                            colorScheme="blue" 
                            onClick={() => {
                                if (isEditing.username) {
                                    handleSaveChange('username', fieldValues.username, confirmPassword); // Вызов функции для сохранения изменений
                                } else {
                                    handleEditToggle('username'); // Обычное переключение в режим редактирования
                                }
                            }}
                        >
                            {isEditing.username ? 'Save' : 'Edit'}
                        </Button>
                    </Box>

                    {/* Name */}
                    <Box mb="4">
                        <label className="text-gray-600">Name:</label>
                        {isEditing.name ? (
                            <>
                                <Input 
                                    placeholder="Enter new name" 
                                    value={fieldValues.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    mb="2"
                                />
                                <Input 
                                    type="password"
                                    placeholder="Confirm password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    mb="2"
                                />
                                <Button variant="link" colorScheme="red" onClick={() => cancelEdit('name')}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <p>{user.name}</p>
                        )}
                        <Button 
                            variant="link" 
                            colorScheme="blue" 
                            onClick={() => {
                                if (isEditing.name) {
                                    handleSaveChange('name', fieldValues.name, confirmPassword); // Вызов функции для сохранения изменений
                                } else {
                                    handleEditToggle('name'); // Обычное переключение в режим редактирования
                                }
                            }}
                        >
                            {isEditing.name ? 'Save' : 'Edit'}
                        </Button>
                    </Box>

                    {/* Surname */}
                    <Box mb="4">
                        <label className="text-gray-600">Surname:</label>
                        {isEditing.surname ? (
                            <>
                                <Input 
                                    placeholder="Enter new surname" 
                                    value={fieldValues.surname}
                                    onChange={(e) => handleFieldChange('surname', e.target.value)}
                                    mb="2"
                                />
                                <Input 
                                    type="password"
                                    placeholder="Confirm password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    mb="2"
                                />
                                <Button variant="link" colorScheme="red" onClick={() => cancelEdit('surname')}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <p>{user.surname}</p>
                        )}
                        <Button 
                            variant="link" 
                            colorScheme="blue" 
                            onClick={() => {
                                if (isEditing.surname) {
                                    handleSaveChange('surname', fieldValues.surname, confirmPassword); // Вызов функции для сохранения изменений
                                } else {
                                    handleEditToggle('surname'); // Обычное переключение в режим редактирования
                                }
                            }}
                        >
                            {isEditing.surname ? 'Save' : 'Edit'}
                        </Button>
                    </Box>

                    {/* Email */}
                    <Box mb="4">
                        <label className="text-gray-600">Email:</label>
                        {isEditing.email ? (
                            <>
                                <Input 
                                    placeholder="Enter new email" 
                                    value={fieldValues.email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    mb="2"
                                />
                                <Input 
                                    type="password"
                                    placeholder="Confirm password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    mb="2"
                                />
                                <Button variant="link" colorScheme="red" onClick={() => cancelEdit('email')}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <p>
                                {user.email}
                                <span className={`ml-2 text-sm ${user.isEmailConfirmed ? 'text-green-500' : 'text-red-500'}`}>
                                    {user.isEmailConfirmed ? 'Confirmed' : 'Not Confirmed'}
                                </span>
                            </p>
                        )}
                       <Button 
                            variant="link" 
                            colorScheme="blue" 
                            onClick={() => {
                                if (isEditing.email) {
                                    handleSaveChange('email', fieldValues.email, confirmPassword); // Вызов функции для сохранения изменений
                                } else {
                                    handleEditToggle('email'); // Обычное переключение в режим редактирования
                                }
                            }}
                        >
                            {isEditing.email ? 'Save' : 'Edit'}
                        </Button>
                    </Box>

                    {/* Created At */}
                    <Box mb="4">
                        <label className="text-gray-600">Account Created At:</label>
                        <p>{new Date(user.createdAt).toISOString().split('T')[0]}</p>
                    </Box>

                    {/* Change Password */}
                    <Box mb="4">
                        {isEditing.password ? (
                            <>
                                <Input 
                                    placeholder="Enter new password" 
                                    value={fieldValues.password}
                                    onChange={(e) => handleFieldChange('password', e.target.value)}
                                    mb="2"
                                />
                                <Input 
                                    type="password"
                                    placeholder="Confirm password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    mb="2"
                                />
                                <Button variant="link" colorScheme="red" onClick={() => cancelEdit('password')}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <p></p>
                        )}
                        <Button 
                            variant="link" 
                            colorScheme="blue" 
                            onClick={() => {
                                if (isEditing.password) {
                                    handleSaveChange('password', fieldValues.password, confirmPassword); // Вызов функции для сохранения изменений
                                } else {
                                    handleEditToggle('password'); // Обычное переключение в режим редактирования
                                }
                            }}
                        >
                            {isEditing.password ? 'Save' : 'Change password'}
                        </Button>
                    </Box>

                </Box>
            </div>
        </div>
    );
};
