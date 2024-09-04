using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RealTimeChat.Hubs
{
    public interface IChatClient
    {
        Task ReceiveMessage(string userName, string message);
        Task LoadMessages(IEnumerable<MessageDto> messages);
    }

    public class ChatHub : Hub<IChatClient>
    {
        private readonly FichteContext _context;

        public ChatHub(FichteContext context)
        {
            _context = context;
        }

        // Метод для создания сервера (комнаты)
        public async Task<int> CreateServer(string roomName, string password)
        {
            var creatorId = Context.UserIdentifier; // Получаем ID пользователя

            var room = new Room
            {
                RoomName = roomName,
                CreatorId = int.Parse(creatorId), // Преобразование строки в целое число
                Password = password // Добавляем пароль (если нужно)
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            // Добавляем создателя в группу SignalR
            await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId.ToString());

            return room.RoomId;
        }

        // Метод для подключения к существующему серверу
        public async Task<bool> ConnectToServer(int roomId, string password)
        {
            var userId = Context.UserIdentifier; // Получаем ID пользователя
            var room = await _context.Rooms.FindAsync(roomId);

            if (room == null)
            {
                throw new HubException("Server not found.");
            }

            // Проверка пароля, если он установлен
            if (!string.IsNullOrEmpty(room.Password) && room.Password != password)
            {
                throw new HubException("Incorrect password.");
            }

            // Добавляем пользователя в группу SignalR
            await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId.ToString());

            return true;
        }

        // Метод для отправки сообщения в чат
        public async Task SendMessage(int roomId, string content)
        {
            var senderId = Context.UserIdentifier; // Или другой способ получения ID пользователя
            var sender = await _context.Users.FindAsync(int.Parse(senderId));

            if (sender == null)
            {
                throw new HubException("User not found.");
            }

            var message = new Message
            {
                RoomId = roomId,
                SenderId = sender.UserId,
                MessageType = "text", // Или другой тип сообщения
                Content = content,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Отправка сообщения всем подключенным клиентам
            await Clients.Group(roomId.ToString()).ReceiveMessage(sender.Username, content);
        }

        // Метод для загрузки истории сообщений при подключении клиента
        public async Task LoadChatHistory(int roomId)
        {
            var messages = await _context.Messages
                .Where(m => m.RoomId == roomId)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    UserName = m.Sender.Username, // Или другой способ получения имени пользователя
                    Content = m.Content,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            await Clients.Caller.LoadMessages(messages);
        }
    }

    public class MessageDto
    {
        public string UserName { get; set; }
        public string? Content { get; set; }
        public DateTime? SentAt { get; set; }
    }
}
