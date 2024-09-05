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
    }

    public class ChatHub : Hub
    {
        private readonly FichteContext _context;

        public ChatHub(FichteContext context)
        {
            _context = context;
        }

        public async Task LoadChatHistory(int roomId)
        {
            var messages = await _context.Messages
                .Where(m => m.RoomId == roomId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    UserName = m.Sender.Username,
                    Content = m.Content,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            await Clients.Caller.SendAsync("LoadMessages", messages);
        }
        // Метод для отправки сообщения
        public async Task SendMessage(int roomId, string userName, string message)
        {
            await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", userName, message);
        }

        // Метод для подключения к группе (комнате)
        public async Task JoinRoom(int roomId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
        }

        // Метод для выхода из группы (комнаты)
        public async Task LeaveRoom(int roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());
        }

    }

}
