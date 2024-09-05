import React from 'react';

export const Message = ({ messageInfo, currentUserName }) => {
    const isSentByCurrentUser = messageInfo.userName === currentUserName;

    return (
        <div className={`w-fit ${isSentByCurrentUser ? 'text-right' : 'text-left'}`}>
            <span className="text-sm text-slate-600">{messageInfo.userName} {messageInfo.sentAt}</span>
            <div
                className={`p-2 rounded-lg shadow-md ${isSentByCurrentUser ? 'bg-blue-100' : 'bg-gray-100'} ${isSentByCurrentUser ? 'ml-auto' : ''}`}
            >
                {console.log(messageInfo)}
                {messageInfo.content}
            </div>
        </div>
    );
};
