using CloudinaryDotNet.Actions;
using CloudinaryDotNet;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace RealTimeChat.Hubs  // Добавь это пространство имен
{
    public class ChatHub : Hub
    {
        private readonly FichteContext _context;
        private readonly Cloudinary _cloudinary;

        public ChatHub(Cloudinary cloudinary, FichteContext context)
        {
            _context = context;
            _cloudinary = cloudinary;
        }

        // Метод для создания комнаты
        public async Task<Room> CreateRoom(string roomName, string password)
        {
            // Получение userId из контекста соединения
            var userId = Context.User?.Claims.FirstOrDefault(c => c.Type == "UserId")?.Value;
            if (userId == null)
            {
                await Clients.Caller.SendAsync("Error", "Invalid user.");
                return null;
            }

            // Проверка существования комнаты
            var existingRoom = await _context.Rooms
                .SingleOrDefaultAsync(r => r.RoomName == roomName && r.Password == password);

            if (existingRoom != null)
            {
                await Clients.Caller.SendAsync("Error", "Room is already exists.");
                return null;
            }

            // Создание комнаты
            var room = new Room
            {
                RoomName = roomName,
                CreatorId = int.Parse(userId),
                CreatedAt = DateTime.UtcNow,
                Password = password
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            // Отправляем подтверждение клиенту, который создал комнату
            await Clients.Caller.SendAsync("RoomCreated", room.RoomId, roomName);

            // Возвращаем информацию о комнате
            return new Room
            {
                RoomId = room.RoomId,
                RoomName = room.RoomName,
            };
        }

        


        // Повторное присоединение пользователя к комнате по ID
        public async Task ReconnectRoom(int roomId)
        {
            var userId = Context.User?.Claims.FirstOrDefault(c => c.Type == "UserId")?.Value;
            if (userId == null)
            {
                await Clients.Caller.SendAsync("Error", "Invalid user.");
                return;
            }

            // Проверяем, существует ли комната
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Error", "Room not found.");
                return;
            }

            Console.WriteLine($"User {userId} trying to reconnect to room {roomId}.");

            // Получаем все группы, в которых состоит пользователь
            var userGroups = await _context.RoomMembers
                .Where(rm => rm.UserId == int.Parse(userId))
                .Select(rm => rm.RoomId.ToString())
                .ToListAsync();

            // Удаляем пользователя из всех групп
            foreach (var groupId in userGroups)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
            }

            // Проверяем, является ли пользователь членом комнаты
            var isAlreadyMember = await _context.RoomMembers
                .AnyAsync(rm => rm.RoomId == room.RoomId && rm.UserId == int.Parse(userId));

            if (isAlreadyMember)
            {
                // Если пользователь еще не в комнате, добавляем его в группу
                await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId.ToString());

                // Оповещаем всех участников о повторном присоединении
                await Clients.Group(room.RoomId.ToString()).SendAsync("UserRejoined", userId, room.RoomId);
            }
        }


        // Отправка сообщений в комнату
        public async Task SendMessage(int roomId, string message)
        {
            if (Context.User.Identity.IsAuthenticated)
            {
                var userId = Context.User?.Claims.FirstOrDefault(c => c.Type == "UserId")?.Value;
                if (userId == null)
                {
                    await Clients.Caller.SendAsync("Error", "Invalid user.");
                    return;
                }

                var user = await _context.Users.FindAsync(int.Parse(userId));
                if (user == null)
                {
                    await Clients.Caller.SendAsync("Error", "User not found.");
                    return;
                }

                var chatMessage = new Message
                {
                    RoomId = roomId,
                    SenderId = user.UserId,
                    Content = message,
                    SentAt = DateTime.UtcNow,
                    MessageType = "text"
                };

                _context.Messages.Add(chatMessage);
                await _context.SaveChangesAsync();

                // Рассылка сообщения всем в комнате
                await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", user.Username, message, user.ProfilePicture, "");
            }
            else
            {
                await Clients.Caller.SendAsync("Error", "User is not authenticated.");
            }
        }

        // Отправка файла в комнату
        public async Task SendMessageFile(int roomId, string fileUrl, string fileName)
        {
            try
            {
                if (Context.User.Identity.IsAuthenticated)
                {
                    var userId = Context.User?.Claims.FirstOrDefault(c => c.Type == "UserId")?.Value;
                    if (userId == null)
                    {
                        await Clients.Caller.SendAsync("Error", "Invalid user.");
                        return;
                    }

                    var user = await _context.Users.FindAsync(int.Parse(userId));
                    if (user == null)
                    {
                        await Clients.Caller.SendAsync("Error", "User not found.");
                        return;
                    }

                    if (fileUrl == null || fileUrl.Length == 0 || fileName == null || fileName.Length == 0)
                    {
                        await Clients.Caller.SendAsync("Error", "No file provided.");
                        return;
                    }
                    var isImage = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" }
                    .Contains(Path.GetExtension(fileName).ToLower());

                    if (isImage)
                    {
                        // Создание и сохранение сообщения в базе данных
                        var chatMessage = new Message
                        {
                            RoomId = roomId,
                            SenderId = user.UserId,
                            FileContent = fileUrl,
                            SentAt = DateTime.UtcNow,
                            MessageType = "image",
                            Content = fileName
                        };
                        _context.Messages.Add(chatMessage);
                    }
                    else
                    {
                        // Создание и сохранение сообщения в базе данных
                        var chatMessage = new Message
                        {
                            RoomId = roomId,
                            SenderId = user.UserId,
                            FileContent = fileUrl,
                            SentAt = DateTime.UtcNow,
                            MessageType = "file",
                            Content = fileName
                        };
                        _context.Messages.Add(chatMessage);
                    }
                    await _context.SaveChangesAsync();

                    // Рассылка сообщения всем в комнате
                    await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", user.Username, fileName, user.ProfilePicture, fileUrl);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
            }
        }




        // Получение истории сообщений для комнаты
        public async Task LoadChatHistory(int roomId)
        {
            // Получаем все пользовательские сообщения из базы данных
            var chatMessages = await _context.Messages
                .Where(m => m.RoomId == roomId)
                .Select(m => new MessagesDBO
                {
                    UserName = m.Sender.Username,
                    Content = m.Content,
                    SentAt = m.SentAt,
                    AvatarUrl = m.Sender.ProfilePicture,
                    MessageType = m.MessageType,
                    FileContent = m.FileContent,
                    MessageFrom = "user" // Указываем, что это сообщение пользователя
                })
                .ToListAsync();

            // Получаем все системные сообщения из базы данных
            var systemMessages = await _context.SystemMessages
                .Where(sm => sm.RoomId == roomId)
                .Select(sm => new MessagesDBO
                {
                    UserName = "System", // Указываем, что это системное сообщение
                    Content = sm.Content,
                    SentAt = sm.SentAt,
                    AvatarUrl = null, // Для системного сообщения можно оставить пустым или указать иконку системы
                    MessageFrom = "system" // Указываем, что это системное сообщение
                })
                .ToListAsync();

            // Объединяем списки и сортируем по времени
            var allMessages = chatMessages
                .Concat(systemMessages)
                .OrderBy(m => m.SentAt)
                .ToList();

            // Отправляем все сообщения клиенту
            await Clients.Caller.SendAsync("ChatHistory", allMessages);
        }


        public class MessagesDBO
        {
            public string UserName { get; set; }
            public string Content { get; set; }
            public DateTime? SentAt { get; set; }
            public string AvatarUrl { get; set; }
            public string MessageFrom { get; set; }
            public string MessageType { get; set; }
            public string FileContent { get; set; }
        }


        // Отключение пользователя от комнаты
        public async Task LeaveRoom(int roomId)
        {
            var userId = Context.User?.Claims.FirstOrDefault(c => c.Type == "UserId")?.Value;
            if (userId == null)
            {
                await Clients.Caller.SendAsync("Error", "Invalid user.");
                return;
            }

            // Удаление пользователя из группы SignalR
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());

            // Удаление из RoomMembers
            var roomMember = await _context.RoomMembers
                .SingleOrDefaultAsync(rm => rm.RoomId == roomId && rm.UserId == int.Parse(userId));

            if (roomMember != null)
            {
                _context.RoomMembers.Remove(roomMember);
                await _context.SaveChangesAsync();

                var username = await _context.Users
                    .Where(u => u.UserId == int.Parse(userId))
                    .Select(u => u.Username)
                    .FirstOrDefaultAsync();

                // Отправляем системное сообщение о том, что пользователь вышел
                string systemMessage = $"{username} left the chat.";

                var userLeftMessage = new SystemMessage
                {
                    RoomId = roomId,
                    Content = systemMessage,
                    SentAt = DateTime.UtcNow,
                };

                _context.SystemMessages.Add(userLeftMessage);
                await _context.SaveChangesAsync();

                // Рассылаем системное сообщение всем участникам комнаты
                await Clients.Group(roomId.ToString()).SendAsync("UserLeft", username);
            }

            Console.WriteLine($"User {userId} has left the room {roomId}.");
        }


        // Присоединение пользователя к комнате
        public async Task<Room> JoinRoom(string roomName, string password)
        {
            var userId = Context.User?.Claims.FirstOrDefault(c => c.Type == "UserId")?.Value;
            if (userId == null)
            {
                await Clients.Caller.SendAsync("Error", "Invalid user.");
                return null;
            }

            // Проверка существования комнаты
            var room = await _context.Rooms
                .SingleOrDefaultAsync(r => r.RoomName == roomName && r.Password == password);

            if (room == null)
            {
                await Clients.Caller.SendAsync("Error", "Room not found or incorrect password.");
                return null;
            }

            // Проверка, был ли пользователь уже добавлен в эту комнату
            var alreadyJoined = await _context.RoomMembers
                .AnyAsync(rm => rm.RoomId == room.RoomId && rm.UserId == int.Parse(userId));

            if (!alreadyJoined)
            {
                // Добавляем пользователя в группу SignalR для комнаты
                await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId.ToString());

                // Добавление в таблицу RoomMembers
                var roomMember = new RoomMember
                {
                    RoomId = room.RoomId,
                    UserId = int.Parse(userId),
                    JoinedAt = DateTime.UtcNow
                };

                _context.RoomMembers.Add(roomMember);
                await _context.SaveChangesAsync();

                var username = await _context.Users
                    .Where(u => u.UserId == int.Parse(userId))
                    .Select(u => u.Username)
                    .FirstOrDefaultAsync();

                // Отправляем сообщение от системы
                string systemMessage = $"{username} joined the chat.";

                var userJoinedMessage = new SystemMessage
                {
                    RoomId = room.RoomId,
                    Content = systemMessage,
                    SentAt = DateTime.UtcNow,
                };

                _context.SystemMessages.Add(userJoinedMessage);
                await _context.SaveChangesAsync();

                await Clients.Group(room.RoomId.ToString()).SendAsync("UserJoined", username);

                Console.WriteLine($"User {userId} has join the room {room.RoomId}.");

                // Возвращаем информацию о комнате
                return new Room
                {
                    RoomId = room.RoomId,
                    RoomName = room.RoomName,
                };
            }

            return null;
        }
    }
}