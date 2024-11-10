using CloudinaryDotNet.Actions;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Models;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;


namespace RealTimeChat.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly FichteContext _context;
        private readonly Cloudinary _cloudinary;

        public ChatController(Cloudinary cloudinary, FichteContext context)
        {
            _context = context;
            _cloudinary = cloudinary;
        }

        [HttpGet("rooms")]
        public async Task<IActionResult> GetAllRooms()
        {
            try
            {
                // Получение UserId из Claims
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                // Получение комнат, к которым привязан пользователь
                var rooms = await _context.RoomMembers
                    .AsNoTracking()
                    .Where(rm => rm.UserId == userId)
                    .Select(rm => new
                    {
                        rm.Room.RoomId,
                        rm.Room.RoomName
                    })
                    .ToListAsync();

                return Ok(rooms);
            }
            catch (Exception ex)
            {
                // Логирование ошибки
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpGet("userData")]
        public async Task<IActionResult> GetUserData()
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                var user = await _context.Users
                    .Where(u => u.UserId == userId)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Username,
                        u.Email,
                        u.IsEmailConfirmed,
                        u.CreatedAt,
                        u.Name,
                        u.Surname,
                        u.ProfilePicture
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound("User not found.");
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpPost("uploadAvatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile avatar)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                if (avatar == null || avatar.Length == 0)
                    return BadRequest("No image file provided.");

                // Параметры загрузки для аватара пользователя
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(avatar.FileName, avatar.OpenReadStream()),
                    Folder = "FICHTE/Avatars", // Папка в Cloudinary, где будут храниться аватары
                    Transformation = new Transformation().Width(300).Height(300).Crop("fill").Gravity("face")
                };

                // Загрузка изображения в Cloudinary
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                    return BadRequest(uploadResult.Error.Message);

                // Сохранение URL аватара в базе данных
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound("User not found.");

                user.ProfilePicture = uploadResult.SecureUrl.ToString();

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new { avatarUrl = user.ProfilePicture });
            }
            catch (Exception ex) 
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpPost("sendMessageFileFetch")]
        public async Task<IActionResult> SendMessageFileFetch(IFormFile file)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                if (file == null || file.Length == 0)
                    return BadRequest("No file provided.");

                // Определяем, является ли файл изображением по расширению
                var isImage = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" }
                    .Contains(Path.GetExtension(file.FileName).ToLower());

                UploadResult uploadResult;

                if (isImage)
                {
                    // Параметры загрузки для изображений
                    var uploadParams = new ImageUploadParams
                    {
                        File = new FileDescription(file.FileName, file.OpenReadStream()),
                        Folder = "FICHTE/Photos",
                        Transformation = new Transformation().Width(800).Height(800).Crop("fill").Gravity("auto")
                    };

                    uploadResult = await _cloudinary.UploadAsync(uploadParams);
                }
                else
                {
                    // Параметры загрузки для файлов
                    var uploadParams = new RawUploadParams
                    {
                        File = new FileDescription(file.FileName, file.OpenReadStream()),
                        Folder = "FICHTE/Files"
                    };

                    uploadResult = await _cloudinary.UploadAsync(uploadParams);
                }

                if (uploadResult.Error != null)
                    return BadRequest(uploadResult.Error.Message);

                // Здесь можно сохранить информацию о загруженном файле в базе данных или выполнить другую логику
                return Ok(new { fileUrl = uploadResult.SecureUrl.ToString() });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }


        [HttpPost ("updateUsername")]
            public async Task<IActionResult> UpdateUsername(newUsernameDBO newUsernameDBO)
            {
                try
                {
                    var userIdClaim = User.Claims.FirstOrDefault(u => u.Type == "UserId");
                    if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    {
                        return BadRequest("Invalid UserId: User does not exist.");
                    }

                    if(newUsernameDBO.newUsername == null || newUsernameDBO.newUsername.Length == 0) return BadRequest("No new username provided.");

                    if (newUsernameDBO.password == null || newUsernameDBO.password.Length == 0) return BadRequest("No password provided");


                    User user = await _context.Users.FindAsync(userId);
                    if (user == null) return NotFound("User not found.");

                    if (!BCrypt.Net.BCrypt.Verify(newUsernameDBO.password, user.PasswordHash)) return BadRequest("Invalid password");

                    bool usernameExists = await _context.Users.AnyAsync(u => u.Username == newUsernameDBO.newUsername);
                    if (usernameExists)
                    {
                        return BadRequest("Username already in use.");
                    }

                    user.Username = newUsernameDBO.newUsername;

                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();

                    return Ok(new { username = user.Username });
                } 
                catch (Exception ex) {
                    Console.WriteLine($"Exception: {ex.Message}");
                    return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
                }
            }

        public class newUsernameDBO
        {
            public string newUsername { get; set; }
            public string password { get; set; }
        }

        [HttpPost("updateName")]
        public async Task<IActionResult> UpdateName(newNameDBO newNameDBO)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(u => u.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                if (newNameDBO.newName == null || newNameDBO.newName.Length == 0) return BadRequest("No new name provided.");

                if (newNameDBO.password == null || newNameDBO.password.Length == 0) return BadRequest("No password provided");


                User user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound("User not found.");

                if (!BCrypt.Net.BCrypt.Verify(newNameDBO.password, user.PasswordHash)) return BadRequest("Invalid password");

                user.Name = newNameDBO.newName;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new { name = user.Name });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        public class newNameDBO
        {
            public string newName { get; set; }
            public string password { get; set; }
        }

        [HttpPost("updateSurname")]
        public async Task<IActionResult> UpdateSurname(newSurnameDBO newSurnameDBO)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(u => u.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                if (newSurnameDBO.newSurname == null || newSurnameDBO.newSurname.Length == 0) return BadRequest("No new surname provided.");

                if (newSurnameDBO.password == null || newSurnameDBO.password.Length == 0) return BadRequest("No password provided");


                User user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound("User not found.");

                if (!BCrypt.Net.BCrypt.Verify(newSurnameDBO.password, user.PasswordHash)) return BadRequest("Invalid password");

                user.Surname = newSurnameDBO.newSurname;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new { surname = user.Surname });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }


        public class newSurnameDBO
        {
            public string newSurname { get; set; }
            public string password { get; set; }
        }

        [HttpPost("updateEmail")]
        public async Task<IActionResult> UpdateEmail(newEmailDBO newEmailDBO)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(u => u.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                if (newEmailDBO.newEmail == null || newEmailDBO.newEmail.Length == 0) return BadRequest("No new email provided.");

                if (newEmailDBO.password == null || newEmailDBO.password.Length == 0) return BadRequest("No password provided");


                User user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound("User not found.");

                if (!BCrypt.Net.BCrypt.Verify(newEmailDBO.password, user.PasswordHash)) return BadRequest("Invalid password");

                bool emailExists = await _context.Users.AnyAsync(u => u.Email == newEmailDBO.newEmail);
                if (emailExists)
                {
                    return BadRequest("This email is already in use.");
                }

                user.Email = newEmailDBO.newEmail;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new { email = user.Email });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        public class newEmailDBO
        {
            public string newEmail { get; set; }
            public string password { get; set; }
        }

        [HttpPost("updatePassword")]
        public async Task<IActionResult> UpdatePassword(newPasswordDBO newPasswordDBO)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(u => u.Type == "UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest("Invalid UserId: User does not exist.");
                }

                if (string.IsNullOrWhiteSpace(newPasswordDBO.newPassword))
                    return BadRequest("No new password provided.");

                if (string.IsNullOrWhiteSpace(newPasswordDBO.password))
                    return BadRequest("No current password provided.");

                User user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound("User not found.");

                if (!BCrypt.Net.BCrypt.Verify(newPasswordDBO.password, user.PasswordHash)) return BadRequest("Invalid password");

                if (BCrypt.Net.BCrypt.Verify(newPasswordDBO.newPassword, user.PasswordHash))
                    return BadRequest("The new password must be different from the current password.");

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPasswordDBO.newPassword);

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new { response = "Password updated" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        public class newPasswordDBO
        {
            public string newPassword { get; set; }
            public string password { get; set; }
        }
    }


}

