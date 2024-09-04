using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Models;
using System.Linq;
using System.Threading.Tasks;

namespace RealTimeChat.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly FichteContext _context;

        public ChatController(FichteContext context)
        {
            _context = context;
        }

        // Создание новой комнаты
        [HttpPost("create")]
        public async Task<IActionResult> CreateServer([FromBody] ServerCreateDto serverCreateDto)
        {
            // Получение UserId из Claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int creatorId))
            {
                return BadRequest("Invalid CreatorId: User does not exist.");
            }

            var room = new Room
            {
                RoomName = serverCreateDto.ServerName,
                CreatorId = creatorId,
                CreatedAt = DateTime.UtcNow,
                Password = serverCreateDto.Password
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            var joinChat = new JoinChatDto
            {
                RoomId = room.RoomId
            };

            JoinChat(joinChat);

            return Ok(new
            {
                ServerName = room.RoomName,
                RoomId = room.RoomId
            });
        }



        // Отправка сообщения в чат
        [HttpPost("send-message")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto sendMessageDto)
        {
            var sender = await _context.Users.FindAsync(sendMessageDto.UserId);
            if (sender == null)
            {
                return NotFound("User not found.");
            }

            var message = new Message
            {
                RoomId = sendMessageDto.RoomId,
                SenderId = sender.UserId,
                Content = sendMessageDto.Message,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { Success = true });
        }

        // Загрузка истории сообщений для комнаты
        [HttpGet("history/{roomId}")]
        public async Task<IActionResult> GetChatHistory(int roomId)
        {
            var messages = await _context.Messages
                .Where(m => m.RoomId == roomId)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    UserName = m.Sender.Username,
                    Content = m.Content,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        // Получение списка всех комнат
        [HttpGet("rooms")]
        public async Task<IActionResult> GetAllRooms()
        {
            var rooms = await _context.Rooms
                .Select(r => new { r.RoomId, r.RoomName })
                .ToListAsync();

            return Ok(rooms);
        }

        [HttpPost("join-chat")]
        public async Task<IActionResult> JoinChat([FromBody] JoinChatDto joinChatDto)
        {
            try
            {
                // Получение UserId из Claims
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                // Проверка существования комнаты
                var room =  _context.Rooms
                    .AsNoTracking()
                    .SingleOrDefaultAsync(r => r.RoomId == joinChatDto.RoomId);

                if (room == null)
                {
                    return NotFound("Room not found.");
                }

                // Проверка существования пользователя
                var user =  _context.Users
                    .AsNoTracking()
                    .SingleOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // Проверка, если пользователь уже является членом комнаты
                var existingMembership = await _context.RoomMembers
                    .AsNoTracking()
                    .SingleOrDefaultAsync(rm => rm.RoomId == joinChatDto.RoomId && rm.UserId == userId);

                if (existingMembership != null)
                {
                    return BadRequest("User is already a member of the room.");
                }

                // Добавление нового члена комнаты
                var roomMember = new RoomMember
                {
                    RoomId = joinChatDto.RoomId,
                    UserId = userId,
                    JoinedAt = DateTime.UtcNow
                };

                _context.RoomMembers.Add(roomMember);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    RoomId = roomMember.RoomId,
                    UserId = roomMember.UserId,
                    JoinedAt = roomMember.JoinedAt
                });
            }
            catch (Exception ex)
            {
                // Логирование ошибки
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }


    }

    // DTO для присоединения к комнате
    public class JoinChatDto
    {
        public int RoomId { get; set; }
    }

    // DTO для создания сервера
    public class ServerCreateDto
    {
        public string ServerName { get; set; }
        public int CreatorId { get; set; }
        public string? Password { get; set; } // Добавлен пароль
    }

    // DTO для отправки сообщения
    public class SendMessageDto
    {
        public int RoomId { get; set; }
        public int UserId { get; set; } // ID пользователя, отправляющего сообщение
        public string Message { get; set; }
    }

    // DTO для отображения сообщения
    public class MessageDto
    {
        public string UserName { get; set; }
        public string Content { get; set; }
        public DateTime? SentAt { get; set; }
    }
}
