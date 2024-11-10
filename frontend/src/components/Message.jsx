import React from 'react';
import { Avatar } from '@chakra-ui/react';

export const Message = ({ messageInfo, currentUserName }) => {
    const isSentByCurrentUser = messageInfo.userName === currentUserName;
    const isSystemMessage = messageInfo.messageFrom === 'system'; // Проверяем, является ли сообщение системным

    // Получаем текущий часовой пояс
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Проверка и преобразование времени
    const sentAt = messageInfo.sentAt.endsWith("Z") ? messageInfo.sentAt : `${messageInfo.sentAt}Z`;
    const utcDate = new Date(sentAt);

    const localSentAt = !isNaN(utcDate.getTime()) // Проверка на валидность даты
        ? utcDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZone,
            hour12: false
        })
        : "Invalid Date";

    // Определение контента для отображения
    let contentDisplay;
    if (messageInfo.messageType === "image" || messageInfo.messageType === "file") {
        console.log(messageInfo.messageType);
        if (messageInfo.messageType === "image") {
            console.log(messageInfo.fileContent);
            // Шаблон для изображения
            contentDisplay = (
                <img
                    src={messageInfo.fileContent}
                    alt="Sent file"
                    className="max-w-full h-auto rounded-md"
                />
            );
        } else {
            // Шаблон для файла
            contentDisplay = (
                <a
                    href={messageInfo.fileContent}
                    download
                    className="text-blue-500 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {`${messageInfo.content || 'Attachment'}`}
                </a>
            );
        }
    } else {
        contentDisplay = <div>{messageInfo.content}</div>;
    }

    return (
        <div className={`flex ${isSystemMessage ? 'justify-center' : (isSentByCurrentUser ? 'justify-end' : 'justify-start')}`}>
            {!isSystemMessage && !isSentByCurrentUser && (
                <Avatar 
                    name={messageInfo.userName} 
                    src={messageInfo.avatarUrl} // Add userAvatar property if available
                    size="sm" 
                    className="mr-2" // Add margin for spacing
                />
            )}
            <div className={`p-2 rounded-lg shadow-md max-w-xs break-words ${isSystemMessage ? 'bg-green-200 text-center' : (isSentByCurrentUser ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left')} ${isSentByCurrentUser ? 'ml-2' : 'mr-2'}`}>
                {!isSystemMessage && <span className="text-sm text-slate-600 block mb-1">{messageInfo.userName} {localSentAt}</span>}
                {contentDisplay}
            </div>
            {!isSystemMessage && isSentByCurrentUser && (
                <Avatar 
                    name={messageInfo.userName} 
                    src={messageInfo.avatarUrl} // Add userAvatar property if available
                    size="sm" 
                    className="ml-2" // Add margin for spacing
                />
            )}
        </div>
    );
};
